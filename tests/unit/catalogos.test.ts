import { describe, expect, it } from "vitest";
import {
  cambiarActivoElemento,
  guardarElemento,
  listarCatalogo,
} from "@/modules/catalogos/application/casos-uso";
import { esquemaElemento } from "@/modules/catalogos/application/esquemas";
import {
  CATALOGOS,
  CODIGOS_CATALOGO,
  layoutValido,
  type CodigoCatalogo,
} from "@/modules/catalogos/domain/catalogos";
import type { CatalogosRepositorio } from "@/modules/catalogos/application/repositorios";
import type { Actor } from "@/shared/kernel/actor";
import { ok } from "@/shared/kernel/result";

const A = "0190a1b2-0000-7000-8000-00000000000a";
const ID = "0190a1b2-0000-7000-8000-0000000000e1";
const actor = (rol: string): Actor => ({
  id: `u-${rol}`,
  email: "x@a.pe",
  rol,
  empresaId: rol === "SUPERADMIN" ? null : A,
  personaId: null,
  habilitado: true,
  motivo: null,
  debeCambiarClave: false,
});

function fakes() {
  const log: string[] = [];
  const catalogos: CatalogosRepositorio = {
    listar: async (c, e) => (log.push(`listar:${c}:${e}`), []),
    crear: async (c, e, d) => (
      log.push(`crear:${c}:${e}:${JSON.stringify(d)}`),
      ok(undefined)
    ),
    actualizar: async (c, id, d) => (
      log.push(`editar:${c}:${id}:${String(d.nombre)}`),
      ok(undefined)
    ),
    cambiarActivo: async (c, id, a) => (
      log.push(`activo:${c}:${id}:${a}`),
      ok(undefined)
    ),
  };
  return { catalogos, log };
}

const form = (catalogo: CodigoCatalogo, campos: Record<string, string>) =>
  esquemaElemento(catalogo).safeParse({ id: "", ...campos });
const ok_ = (c: CodigoCatalogo, campos: Record<string, string>) =>
  form(c, campos).success;
const errorEn = (c: CodigoCatalogo, campos: Record<string, string>) => {
  const r = form(c, campos);
  return r.success ? null : r.error.issues[0]?.path[0];
};

describe("esquemas de catálogos", () => {
  it("cada catálogo declara su campo principal y campos de orden existentes", () => {
    for (const c of CODIGOS_CATALOGO) {
      const claves = CATALOGOS[c].campos.map((x) => x.clave);
      expect(claves).toContain(CATALOGOS[c].principal);
      for (const o of CATALOGOS[c].ordenarPor) expect(claves).toContain(o);
    }
  });
  it("ubicación exige un tipo de su lista y limpia el nombre", () => {
    expect(
      errorEn("ubicaciones", { nombre: "Campo", tipo: "", orden: "" }),
    ).toBe("tipo");
    expect(
      errorEn("ubicaciones", { nombre: "Campo", tipo: "PARADA", orden: "" }),
    ).toBe("tipo");
    const r = form("ubicaciones", {
      nombre: "  Campo ",
      tipo: "LUGAR",
      orden: "2",
    });
    expect(r.success && r.data.valores).toEqual({
      nombre: "Campo",
      tipo: "LUGAR",
      orden: 2,
    });
  });
  it("solo pasan los campos del catálogo (sin asignación masiva)", () => {
    const r = form("tipos_grasa", {
      nombre: "EP-2",
      empresa_id: "otra",
      activo: "false",
    });
    expect(r.success && r.data.valores).toEqual({ nombre: "EP-2" });
  });
  it("rechaza nombre vacío, largo u orden con decimales", () => {
    expect(errorEn("tipos_grasa", { nombre: "   " })).toBe("nombre");
    expect(errorEn("tipos_grasa", { nombre: "a".repeat(81) })).toBe("nombre");
    expect(
      errorEn("sistemas_mantenimiento", { nombre: "MOTOR", orden: "1.5" }),
    ).toBe("orden");
  });
  it("motivo de parada: duración solo en PM1 a PM4, con dos decimales", () => {
    const base = { nombre: "x", duracion_estandar_horas: "" };
    expect(
      ok_("motivos_parada", {
        ...base,
        codigo: "PM2",
        duracion_estandar_horas: "4.5",
      }),
    ).toBe(true);
    expect(
      errorEn("motivos_parada", {
        ...base,
        codigo: "MCI",
        duracion_estandar_horas: "2",
      }),
    ).toBe("duracion_estandar_horas");
    expect(
      errorEn("motivos_parada", {
        ...base,
        codigo: "PM1",
        duracion_estandar_horas: "1.234",
      }),
    ).toBe("duracion_estandar_horas");
    expect(errorEn("motivos_parada", { ...base, codigo: "INVENTADO" })).toBe(
      "codigo",
    );
    expect(ok_("motivos_parada", { ...base, codigo: "MCI" })).toBe(true);
  });
  it("categoría opcional: vacía aplica a todas, si viene debe ser un id", () => {
    const base = { descripcion: "Cambio de aceite", plan: "", orden: "" };
    const r = form("plantillas_actividades", { ...base, categoria_id: "" });
    expect(r.success && r.data.valores.categoria_id).toBe(null);
    expect(
      errorEn("plantillas_actividades", { ...base, categoria_id: "abc" }),
    ).toBe("categoria_id");
  });
  it("disposición: una línea por eje, se pasa a mayúsculas", () => {
    expect(layoutValido("DEL-I | DEL-D\nPOS-IE|POS-II|POS-DI|POS-DE")).toBe(
      true,
    );
    expect(layoutValido("del;izq")).toBe(false);
    expect(layoutValido("A\n\nB")).toBe(false);
    const r = form("plantillas_disposicion_neumatico", {
      nombre: "4x2",
      preset: "4X2",
      layout: "del-i | del-d\r\npos-i | pos-d",
    });
    expect(r.success && r.data.valores.layout).toBe(
      "DEL-I | DEL-D\nPOS-I | POS-D",
    );
    expect(
      errorEn("plantillas_disposicion_neumatico", {
        nombre: "x",
        preset: "4X2",
        layout: "A;B",
      }),
    ).toBe("layout");
  });
});

describe("casos de uso de catálogos", () => {
  const entrada = {
    catalogo: "tipos_grasa" as const,
    id: null,
    valores: { nombre: "EP-2" },
  };
  it("planificador crea en su empresa y edita por id", async () => {
    const f = fakes();
    expect((await guardarElemento(actor("PLANIFICADOR"), entrada, f)).ok).toBe(
      true,
    );
    expect(
      (await guardarElemento(actor("PLANIFICADOR"), { ...entrada, id: ID }, f))
        .ok,
    ).toBe(true);
    expect(f.log).toEqual([
      `crear:tipos_grasa:${A}:{"nombre":"EP-2"}`,
      `editar:tipos_grasa:${ID}:EP-2`,
    ]);
  });
  it("técnico, supervisor y gerente leen pero no escriben", async () => {
    for (const rol of ["TECNICO", "SUPERVISOR", "GERENTE"]) {
      const f = fakes();
      expect((await listarCatalogo(actor(rol), "tipos_grasa", f)).ok).toBe(
        true,
      );
      const g = await guardarElemento(actor(rol), entrada, f);
      const d = await cambiarActivoElemento(
        actor(rol),
        { catalogo: "tipos_grasa", id: ID, activo: false },
        f,
      );
      expect(!g.ok && g.error.code).toBe("FORBIDDEN");
      expect(!d.ok && d.error.code).toBe("FORBIDDEN");
      expect(f.log).toEqual([`listar:tipos_grasa:${A}`]);
    }
  });
  it("sin sesión o superadmin (sin empresa) no entran", async () => {
    const f = fakes();
    const r = await listarCatalogo(null, "tipos_grasa", f);
    expect(!r.ok && r.error.code).toBe("UNAUTHENTICATED");
    const s = await guardarElemento(actor("SUPERADMIN"), entrada, f);
    expect(s.ok).toBe(false);
    expect(f.log).toEqual([]);
  });
});

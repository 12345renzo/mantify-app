import { describe, expect, it } from "vitest";
import {
  crearEquipo,
  editarEquipo,
  registrarLectura,
  sanearBusqueda,
  cambiarMovilizacion,
} from "@/modules/equipos/application/casos-uso";
import {
  crearEquipoSchema,
  lecturaSchema,
} from "@/modules/equipos/application/esquemas";
import type {
  EquipoParaLectura,
  EquiposRepositorio,
} from "@/modules/equipos/application/repositorios";
import { normalizarCodigo } from "@/modules/equipos/domain/equipo";
import {
  parsearHorometro,
  validarLectura,
} from "@/modules/equipos/domain/horometro";
import type { Actor } from "@/shared/kernel/actor";
import { DomainError } from "@/shared/kernel/errors";
import { err, ok } from "@/shared/kernel/result";

const A = "0190a1b2-0000-7000-8000-00000000000a";
const B = "0190a1b2-0000-7000-8000-00000000000b";
const EQ = "0190a1b2-0000-7000-8000-0000000000e1";
const CAT = "0190a1b2-0000-7000-8000-0000000000c1";
// 18 nov 2026, 10:00 en Lima.
const AHORA = new Date("2026-11-18T15:00:00Z");

const actor = (rol: string, empresaId: string | null = A): Actor => ({
  id: `u-${rol}`,
  email: "x@a.pe",
  rol,
  empresaId,
  personaId: null,
  habilitado: true,
  motivo: null,
  debeCambiarClave: false,
});

function fakes(equipo: Partial<EquipoParaLectura> = {}) {
  const log: string[] = [];
  const equipos: EquiposRepositorio = {
    crear: async (e, d) => (
      log.push(`crear:${e}:${d.codigo}:${d.horometroInicial}`),
      ok({ id: EQ })
    ),
    actualizar: async (id, v) => (log.push(`editar:${id}:${v}`), ok(undefined)),
    cambiarMovilizacion: async (id, e) => (
      log.push(`movil:${id}:${e}`),
      ok(undefined)
    ),
    paraLectura: async (id) =>
      id === EQ
        ? ok({
            id,
            empresaId: A,
            horometroActual: 1500,
            estadoMovilizacion: "MOVILIZADO",
            zonaHoraria: "America/Lima",
            ...equipo,
          })
        : err(new DomainError("NOT_FOUND", "no")),
    importar: async () => ok([]),
    insertarLectura: async (d) => (
      log.push(`lectura:${d.valor}:${d.esCorreccion}:${d.motivo}`),
      ok(undefined)
    ),
  };
  return { equipos, log };
}

describe("normalizarCodigo", () => {
  it("mayúsculas y sin espacios", () => {
    expect(normalizarCodigo("  eq 001 ")).toBe("EQ001");
    expect(normalizarCodigo("cf-02\t a")).toBe("CF-02A");
    expect(normalizarCodigo("ＥＱ１")).toBe("EQ1"); // ancho completo
  });
});

describe("parsearHorometro", () => {
  it.each([
    ["1500", 1500],
    ["1500.5", 1500.5],
    [" 0 ", 0],
    ["1000000", 1000000],
  ])("acepta %s", (t, n) => expect(parsearHorometro(t)).toBe(n));
  it.each([
    "",
    "abc",
    "-5",
    "1e5",
    "Infinity",
    "NaN",
    "1.234",
    "1,500.00",
    "1,500",
    "1500,25",
    "1000001",
    "=1+1",
  ])("rechaza %s", (t) => expect(parsearHorometro(t)).toBe(null));
});

describe("validarLectura", () => {
  it("igual o mayor pasa; menor se rechaza", () => {
    expect(validarLectura(1500, 1500, false, null).ok).toBe(true);
    expect(validarLectura(1500, 1600, false, null).ok).toBe(true);
    expect(validarLectura(1500, 1499.99, false, null).ok).toBe(false);
  });
  it("corrección: baja con motivo; sin motivo o subiendo, no", () => {
    expect(validarLectura(1500, 1400, true, "Error de tipeo").ok).toBe(true);
    expect(validarLectura(1500, 1400, true, null).ok).toBe(false);
    expect(validarLectura(1500, 1400, true, "abc").ok).toBe(false);
    expect(validarLectura(1500, 1500, true, "Error de tipeo").ok).toBe(false);
  });
});

describe("esquemas de equipos", () => {
  const base = {
    codigo: " cam 01 ",
    categoriaId: CAT,
    ubicacionId: "",
    marca: "CAT",
    modelo: "",
    numeroSerie: "",
    idExterno: "",
    estadoOperativo: "OPERATIVO",
    estadoMovilizacion: "MOVILIZADO",
    requiereEngrase: "on",
    horometroInicial: "1500",
  };
  it("normaliza el código y convierte vacíos a null", () => {
    const r = crearEquipoSchema.safeParse(base);
    expect(r.success && r.data).toMatchObject({
      codigo: "CAM01",
      ubicacionId: null,
      modelo: null,
      requiereEngrase: true,
      horometroInicial: 1500,
    });
  });
  it("rechaza código inválido, horómetro raro y crear desmovilizado", () => {
    expect(
      crearEquipoSchema.safeParse({ ...base, codigo: "EQ#1" }).success,
    ).toBe(false);
    expect(
      crearEquipoSchema.safeParse({ ...base, horometroInicial: "1e9" }).success,
    ).toBe(false);
    expect(
      crearEquipoSchema.safeParse({
        ...base,
        estadoMovilizacion: "DESMOVILIZADO",
      }).success,
    ).toBe(false);
  });
  it("lectura de corrección exige motivo", () => {
    const l = {
      equipoId: EQ,
      valor: "1400",
      fecha: "2026-11-18",
      esCorreccion: "true",
      motivo: "",
    };
    expect(lecturaSchema.safeParse(l).success).toBe(false);
    expect(
      lecturaSchema.safeParse({ ...l, motivo: "Se tecleó mal" }).success,
    ).toBe(true);
  });
});

describe("sanearBusqueda", () => {
  it("quita lo que rompería el filtro de PostgREST", () => {
    expect(sanearBusqueda("EQ-001")).toBe("EQ-001");
    expect(sanearBusqueda("a,codigo.eq.x)")).toBe("acodigo.eq.x");
    expect(sanearBusqueda("100%_*")).toBe("100_");
    expect(sanearBusqueda("   ")).toBe(null);
    expect(sanearBusqueda(undefined)).toBe(null);
  });
});

describe("casos de uso de equipos", () => {
  const lectura = {
    equipoId: EQ,
    valor: 1600,
    fecha: "2026-11-18",
    esCorreccion: false,
    motivo: null,
  };

  it("planificador crea en su empresa; supervisor y gerente no", async () => {
    const entrada = crearEquipoSchema.parse({
      codigo: "eq1",
      categoriaId: CAT,
      ubicacionId: "",
      marca: "",
      modelo: "",
      numeroSerie: "",
      idExterno: "",
      estadoOperativo: "OPERATIVO",
      estadoMovilizacion: "MOVILIZADO",
      requiereEngrase: "",
      horometroInicial: "10",
    });
    const f = fakes();
    expect((await crearEquipo(actor("PLANIFICADOR"), entrada, f)).ok).toBe(
      true,
    );
    for (const rol of ["SUPERVISOR", "GERENTE", "TECNICO"]) {
      const r = await crearEquipo(actor(rol), entrada, f);
      expect(!r.ok && r.error.code).toBe("FORBIDDEN");
    }
    expect(f.log).toEqual([`crear:${A}:EQ1:10`]);
  });

  it("solo el planificador edita y desmoviliza", async () => {
    const f = fakes();
    const mov = { id: EQ, estado: "DESMOVILIZADO" as const };
    expect((await cambiarMovilizacion(actor("PLANIFICADOR"), mov, f)).ok).toBe(
      true,
    );
    const s = await cambiarMovilizacion(actor("SUPERVISOR"), mov, f);
    expect(!s.ok && s.error.code).toBe("FORBIDDEN");
    const e = await editarEquipo(
      actor("SUPERVISOR"),
      { id: EQ, version: 1 } as never,
      f,
    );
    expect(!e.ok && e.error.code).toBe("FORBIDDEN");
    expect(f.log).toEqual([`movil:${EQ}:DESMOVILIZADO`]);
  });

  it("supervisor registra lectura que sube; no corrige", async () => {
    const f = fakes();
    expect(
      (await registrarLectura(actor("SUPERVISOR"), lectura, f, AHORA)).ok,
    ).toBe(true);
    const c = await registrarLectura(
      actor("SUPERVISOR"),
      { ...lectura, valor: 1400, esCorreccion: true, motivo: "Error de tipeo" },
      f,
      AHORA,
    );
    expect(!c.ok && c.error.code).toBe("FORBIDDEN");
    expect(f.log).toEqual(["lectura:1600:false:null"]);
  });

  it("lectura menor se rechaza antes de llegar a la base; corrección del planificador pasa", async () => {
    const f = fakes();
    const m = await registrarLectura(
      actor("PLANIFICADOR"),
      { ...lectura, valor: 1400 },
      f,
      AHORA,
    );
    expect(!m.ok && m.error.code).toBe("VALIDATION");
    const c = await registrarLectura(
      actor("PLANIFICADOR"),
      { ...lectura, valor: 1400, esCorreccion: true, motivo: "Error de tipeo" },
      f,
      AHORA,
    );
    expect(c.ok).toBe(true);
    expect(f.log).toEqual(["lectura:1400:true:Error de tipeo"]);
  });

  it("rechaza fecha futura, equipo desmovilizado y equipo de otra empresa", async () => {
    const futura = await registrarLectura(
      actor("PLANIFICADOR"),
      { ...lectura, fecha: "2026-11-19" },
      fakes(),
      AHORA,
    );
    expect(!futura.ok && futura.error.code).toBe("VALIDATION");
    const baja = await registrarLectura(
      actor("PLANIFICADOR"),
      lectura,
      fakes({ estadoMovilizacion: "DESMOVILIZADO" }),
      AHORA,
    );
    expect(!baja.ok && baja.error.code).toBe("VALIDATION");
    const otra = await registrarLectura(
      actor("PLANIFICADOR", B),
      lectura,
      fakes(),
      AHORA,
    );
    expect(!otra.ok && otra.error.code).toBe("NOT_FOUND");
  });
});

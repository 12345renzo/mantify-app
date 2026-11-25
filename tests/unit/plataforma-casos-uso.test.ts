import { describe, expect, it } from "vitest";
import type { Actor } from "@/shared/kernel/actor";
import { darDeBajaEmpresa } from "@/modules/plataforma/application/dar-de-baja-empresa";
import { cambiarPrecioPlan } from "@/modules/plataforma/application/cambiar-precio-plan";
import { crearEmpresa } from "@/modules/plataforma/application/crear-empresa";
import { renovarEmpresa } from "@/modules/plataforma/application/renovar-empresa";
import type {
  EmpresaParaMembresia,
  EmpresasRepositorio,
  MotivoBaja,
  NuevaEmpresa,
  PlanesRepositorio,
} from "@/modules/plataforma/application/repositorios";
import { DomainError } from "@/shared/kernel/errors";
import { err, ok } from "@/shared/kernel/result";

const PLAN = "0190a1b2-0000-7000-8000-000000000001";
const EMPRESA = "0190a1b2-0000-7000-8000-000000000002";
const superadmin: Actor = {
  id: "u1",
  email: "sa@x.pe",
  rol: "SUPERADMIN",
  empresaId: null,
  personaId: null,
  habilitado: true,
  motivo: null,
  debeCambiarClave: false,
};
// 17 nov 2026, 10:00 en Lima.
const AHORA = new Date("2026-11-17T15:00:00Z");

function fakes(empresa: Partial<EmpresaParaMembresia> = {}) {
  const creadas: NuevaEmpresa[] = [];
  const bajas: MotivoBaja[] = [];
  const precios: number[] = [];
  const renovadas: { planId: string; inicio: string; fin: string }[] = [];
  const empresas: EmpresasRepositorio = {
    crear: async (d) => (creadas.push(d), ok({ id: EMPRESA })),
    obtenerParaMembresia: async (id) =>
      id === EMPRESA
        ? ok({
            id,
            estado: "ACTIVA",
            diasGracia: 3,
            zonaHoraria: "America/Lima",
            finVigente: null,
            ...empresa,
          })
        : err(new DomainError("NOT_FOUND", "no existe")),
    darDeBaja: async (_id, m) => (bajas.push(m), ok(undefined)),
    actualizar: async () => ok(undefined),
    renovar: async (d) => (renovadas.push(d), ok(undefined)),
  };
  const planes: PlanesRepositorio = {
    existeActivo: async (id) => id === PLAN,
    cambiarPrecio: async (_id, p) => (precios.push(p), ok(undefined)),
  };
  return { empresas, planes, creadas, bajas, precios, renovadas };
}

const entradaEmpresa = {
  nombre: "Minera Andina",
  razonSocial: null,
  ruc: "20123456789",
  correoContacto: null,
  planId: PLAN,
  diasGracia: 3,
};

describe("permisos", () => {
  const casos: [string, Actor | null, string][] = [
    ["sin sesión", null, "UNAUTHENTICATED"],
    ["usuario de empresa", { ...superadmin, rol: "PLANIFICADOR" }, "FORBIDDEN"],
  ];
  it.each(casos)(
    "%s no puede crear, renovar, dar de baja ni cambiar precio",
    async (_n, actor, code) => {
      const f = fakes();
      const r = await Promise.all([
        crearEmpresa(actor, entradaEmpresa, f),
        renovarEmpresa(
          actor,
          { empresaId: EMPRESA, planId: PLAN, referencia: null },
          f,
          AHORA,
        ),
        darDeBajaEmpresa(actor, { empresaId: EMPRESA }, f, AHORA),
        cambiarPrecioPlan(actor, { planId: PLAN, precioMensual: 400 }, f),
      ]);
      for (const res of r) {
        expect(res.ok).toBe(false);
        if (!res.ok) expect(res.error.code).toBe(code);
      }
      expect(
        f.creadas.length +
          f.renovadas.length +
          f.bajas.length +
          f.precios.length,
      ).toBe(0);
    },
  );
});

describe("crearEmpresa", () => {
  it("crea con slug derivado del nombre y el RUC", async () => {
    const f = fakes();
    const r = await crearEmpresa(superadmin, entradaEmpresa, f);
    expect(r.ok).toBe(true);
    expect(f.creadas[0]?.slug).toBe("minera-andina-20123456789");
  });
  it("rechaza un plan que no existe", async () => {
    const f = fakes();
    const r = await crearEmpresa(
      superadmin,
      { ...entradaEmpresa, planId: EMPRESA },
      f,
    );
    expect(r.ok).toBe(false);
    expect(f.creadas).toHaveLength(0);
  });
});

describe("darDeBajaEmpresa", () => {
  const baja = (f: ReturnType<typeof fakes>) =>
    darDeBajaEmpresa(superadmin, { empresaId: EMPRESA }, f, AHORA);
  it("vencida tras la gracia: motivo VENCIMIENTO", async () => {
    const f = fakes({ finVigente: "2026-11-10" });
    await baja(f);
    expect(f.bajas).toEqual(["VENCIMIENTO"]);
  });
  it("al día: motivo MANUAL", async () => {
    const f = fakes({ finVigente: "2026-12-10" });
    await baja(f);
    expect(f.bajas).toEqual(["MANUAL"]);
  });
  it("ya de baja: CONFLICT", async () => {
    const f = fakes({ estado: "INACTIVA" });
    const r = await baja(f);
    expect(!r.ok && r.error.code).toBe("CONFLICT");
    expect(f.bajas).toHaveLength(0);
  });
});

describe("renovarEmpresa", () => {
  const entrada = { empresaId: EMPRESA, planId: PLAN, referencia: null };
  const casos: [string, Partial<EmpresaParaMembresia>, string][] = [
    ["nunca pagó: hoy", {}, "2026-11-17"],
    ["por vencer: tras el fin", { finVigente: "2026-11-20" }, "2026-11-21"],
    ["en gracia: tras la gracia", { finVigente: "2026-11-15" }, "2026-11-19"],
    ["vencida: hoy", { finVigente: "2026-10-31" }, "2026-11-17"],
    [
      "de baja ayer: hoy",
      { estado: "INACTIVA", finVigente: "2026-11-16" },
      "2026-11-17",
    ],
    [
      "de baja hoy: mañana",
      { estado: "INACTIVA", finVigente: "2026-11-17" },
      "2026-11-18",
    ],
  ];
  it.each(casos)("%s", async (_n, empresa, inicio) => {
    const f = fakes(empresa);
    const r = await renovarEmpresa(superadmin, entrada, f, AHORA);
    expect(r.ok && r.value.inicio).toBe(inicio);
    expect(f.renovadas).toHaveLength(1);
  });
  it("al día: CONFLICT y no cambia nada", async () => {
    const f = fakes({ finVigente: "2026-12-20" });
    const r = await renovarEmpresa(superadmin, entrada, f, AHORA);
    expect(!r.ok && r.error.code).toBe("CONFLICT");
    expect(f.renovadas).toHaveLength(0);
  });
  it("plan inexistente: VALIDATION", async () => {
    const f = fakes({ finVigente: "2026-10-31" });
    const r = await renovarEmpresa(
      superadmin,
      { ...entrada, planId: "otro" },
      f,
      AHORA,
    );
    expect(!r.ok && r.error.code).toBe("VALIDATION");
  });
  it("empresa que no existe: NOT_FOUND", async () => {
    const r = await renovarEmpresa(
      superadmin,
      { ...entrada, empresaId: PLAN },
      fakes(),
      AHORA,
    );
    expect(!r.ok && r.error.code).toBe("NOT_FOUND");
  });
});

import { describe, expect, it } from "vitest";
import type { Actor } from "@/shared/kernel/actor";
import { activarDesactivarEmpresa } from "@/modules/plataforma/application/activar-desactivar-empresa";
import { cambiarPrecioPlan } from "@/modules/plataforma/application/cambiar-precio-plan";
import { crearEmpresa } from "@/modules/plataforma/application/crear-empresa";
import { reactivarEmpresa } from "@/modules/plataforma/application/reactivar-empresa";
import { registrarPagoManual } from "@/modules/plataforma/application/registrar-pago-manual";
import type {
  CambioEstadoEmpresa,
  EmpresaParaMembresia,
  EmpresasRepositorio,
  MembresiasRepositorio,
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
  const cambios: CambioEstadoEmpresa[] = [];
  const pagos: { inicio: string; fin: string }[] = [];
  const precios: number[] = [];
  const reactivadas: { planId: string; inicio: string; fin: string }[] = [];
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
    cambiarEstado: async (_id, c) => (cambios.push(c), ok(undefined)),
    actualizar: async () => ok(undefined),
    reactivar: async (d) => (reactivadas.push(d), ok(undefined)),
  };
  const membresias: MembresiasRepositorio = {
    registrarPagoManual: async (d) => (
      pagos.push(d),
      ok({ membresiaId: "m1" })
    ),
  };
  const planes: PlanesRepositorio = {
    existeActivo: async (id) => id === PLAN,
    cambiarPrecio: async (_id, p) => (precios.push(p), ok(undefined)),
  };
  return {
    empresas,
    membresias,
    planes,
    creadas,
    cambios,
    pagos,
    precios,
    reactivadas,
  };
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
    "%s no puede crear, pagar, desactivar ni cambiar precio",
    async (_n, actor, code) => {
      const f = fakes();
      const r = await Promise.all([
        crearEmpresa(actor, entradaEmpresa, f),
        registrarPagoManual(
          actor,
          { empresaId: EMPRESA, referencia: null },
          f,
          AHORA,
        ),
        activarDesactivarEmpresa(
          actor,
          { empresaId: EMPRESA, accion: "DESACTIVAR" },
          f,
          AHORA,
        ),
        cambiarPrecioPlan(actor, { planId: PLAN, precioMensual: 400 }, f),
      ]);
      for (const res of r) {
        expect(res.ok).toBe(false);
        if (!res.ok) expect(res.error.code).toBe(code);
      }
      expect(
        f.creadas.length + f.pagos.length + f.cambios.length + f.precios.length,
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

describe("registrarPagoManual", () => {
  it("primer pago: AL_DIA desde hoy por 30 días", async () => {
    const f = fakes();
    const r = await registrarPagoManual(
      superadmin,
      { empresaId: EMPRESA, referencia: "OP-1" },
      f,
      AHORA,
    );
    expect(r.ok && [r.value.inicio, r.value.fin]).toEqual([
      "2026-11-17",
      "2026-12-16",
    ]);
  });
  it("pago durante la gracia: empieza el día siguiente al vencimiento", async () => {
    const f = fakes({ finVigente: "2026-11-15" });
    const r = await registrarPagoManual(
      superadmin,
      { empresaId: EMPRESA, referencia: null },
      f,
      AHORA,
    );
    expect(r.ok && r.value.inicio).toBe("2026-11-16");
  });
  it("pago tras la gracia: empieza el día del pago", async () => {
    const f = fakes({ finVigente: "2026-11-10" });
    const r = await registrarPagoManual(
      superadmin,
      { empresaId: EMPRESA, referencia: null },
      f,
      AHORA,
    );
    expect(r.ok && r.value.inicio).toBe("2026-11-17");
  });
  it("empresa que no existe: NOT_FOUND", async () => {
    const f = fakes();
    const r = await registrarPagoManual(
      superadmin,
      { empresaId: PLAN, referencia: null },
      f,
      AHORA,
    );
    expect(!r.ok && r.error.code).toBe("NOT_FOUND");
  });
});

describe("activarDesactivarEmpresa", () => {
  it("vencida tras la gracia: motivo VENCIMIENTO", async () => {
    const f = fakes({ finVigente: "2026-11-10" });
    await activarDesactivarEmpresa(
      superadmin,
      { empresaId: EMPRESA, accion: "DESACTIVAR" },
      f,
      AHORA,
    );
    expect(f.cambios[0]).toEqual({ estado: "INACTIVA", motivo: "VENCIMIENTO" });
  });
  it("al día: motivo MANUAL", async () => {
    const f = fakes({ finVigente: "2026-12-10" });
    await activarDesactivarEmpresa(
      superadmin,
      { empresaId: EMPRESA, accion: "DESACTIVAR" },
      f,
      AHORA,
    );
    expect(f.cambios[0]).toEqual({ estado: "INACTIVA", motivo: "MANUAL" });
  });
  it("activar deja la empresa ACTIVA", async () => {
    const f = fakes();
    await activarDesactivarEmpresa(
      superadmin,
      { empresaId: EMPRESA, accion: "ACTIVAR" },
      f,
      AHORA,
    );
    expect(f.cambios[0]).toEqual({ estado: "ACTIVA" });
  });
});

describe("reactivarEmpresa", () => {
  const entrada = { empresaId: EMPRESA, planId: PLAN, referencia: null };
  it("vencida (pasó la gracia): reactiva con 30 días desde hoy", async () => {
    const f = fakes({ finVigente: "2026-10-31" });
    const r = await reactivarEmpresa(superadmin, entrada, f, AHORA);
    expect(r.ok && r.value).toEqual({
      inicio: "2026-11-17",
      fin: "2026-12-16",
    });
    expect(f.reactivadas).toHaveLength(1);
  });
  it("plan vigente o en gracia: CONFLICT y no cambia nada", async () => {
    for (const finVigente of ["2026-12-20", "2026-11-15"]) {
      const f = fakes({ finVigente });
      const r = await reactivarEmpresa(superadmin, entrada, f, AHORA);
      expect(!r.ok && r.error.code).toBe("CONFLICT");
      expect(f.reactivadas).toHaveLength(0);
    }
  });
  it("plan inexistente: VALIDATION", async () => {
    const f = fakes({ finVigente: "2026-10-31" });
    const r = await reactivarEmpresa(
      superadmin,
      { ...entrada, planId: "otro" },
      f,
      AHORA,
    );
    expect(!r.ok && r.error.code).toBe("VALIDATION");
  });
});

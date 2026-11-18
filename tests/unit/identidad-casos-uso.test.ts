import { describe, expect, it } from "vitest";
import { cambiarClave } from "@/modules/identidad/application/cambiar-clave";
import { cambiarRolCuenta } from "@/modules/identidad/application/cambiar-rol-cuenta";
import { crearUsuario } from "@/modules/identidad/application/crear-usuario";
import { darDeBajaPersona } from "@/modules/identidad/application/dar-de-baja-persona";
import { editarPersona } from "@/modules/identidad/application/editar-persona";
import type { PersonaEntrada } from "@/modules/identidad/application/esquemas";
import { reactivarPersona } from "@/modules/identidad/application/reactivar-persona";
import { reemplazarPersona } from "@/modules/identidad/application/reemplazar-persona";
import type {
  CuentaInfo,
  CuentasRepositorio,
  PersonaInfo,
  PersonasRepositorio,
  ServicioAuth,
} from "@/modules/identidad/application/repositorios";
import type { Actor } from "@/shared/kernel/actor";
import { DomainError } from "@/shared/kernel/errors";
import { err, ok } from "@/shared/kernel/result";

const A = "0190a1b2-0000-7000-8000-00000000000a";
const B = "0190a1b2-0000-7000-8000-00000000000b";

const actor = (rol: string, extra: Partial<Actor> = {}): Actor => ({
  id: `u-${rol}`,
  email: `${rol.toLowerCase()}@a.pe`,
  rol,
  empresaId: rol === "SUPERADMIN" ? null : A,
  personaId: rol === "SUPERADMIN" ? null : `p-${rol}`,
  habilitado: true,
  motivo: null,
  debeCambiarClave: false,
  ...extra,
});
const planificador = actor("PLANIFICADOR");
const superadmin = actor("SUPERADMIN");

const nueva: PersonaEntrada = {
  nombres: "Tito",
  apellidos: "Quispe",
  tipoDocumento: null,
  numeroDocumento: null,
  cargo: null,
  telefono: null,
  tipoVinculo: null,
};

function fakes(
  opts: { usados?: number; maximo?: number | null; insertFalla?: boolean } = {},
) {
  const personas = new Map<string, PersonaInfo>([
    ["p-libre", { id: "p-libre", empresaId: A, activa: true, cuenta: null }],
    ["p-baja", { id: "p-baja", empresaId: A, activa: false, cuenta: null }],
    [
      "p-con-cuenta",
      {
        id: "p-con-cuenta",
        empresaId: A,
        activa: true,
        cuenta: { id: "c-tec", rol: "TECNICO" },
      },
    ],
    [
      "p-planif",
      {
        id: "p-planif",
        empresaId: A,
        activa: true,
        cuenta: { id: "u-PLANIFICADOR", rol: "PLANIFICADOR" },
      },
    ],
    [
      "p-otro-planif",
      {
        id: "p-otro-planif",
        empresaId: A,
        activa: true,
        cuenta: { id: "c-plan2", rol: "PLANIFICADOR" },
      },
    ],
    ["p-de-b", { id: "p-de-b", empresaId: B, activa: true, cuenta: null }],
    ["p-baja", { id: "p-baja", empresaId: A, activa: false, cuenta: null }],
  ]);
  const cuentasMap = new Map<string, CuentaInfo>([
    [
      "c-libre",
      {
        id: "c-libre",
        empresaId: A,
        rol: "TECNICO",
        personaId: null,
        correo: "viejo@a.pe",
      },
    ],
    [
      "c-ocupada",
      {
        id: "c-ocupada",
        empresaId: A,
        rol: "TECNICO",
        personaId: "p-con-cuenta",
        correo: "t@a.pe",
      },
    ],
    [
      "c-plan-libre",
      {
        id: "c-plan-libre",
        empresaId: A,
        rol: "PLANIFICADOR",
        personaId: null,
        correo: "pl@a.pe",
      },
    ],
    [
      "u-PLANIFICADOR",
      {
        id: "u-PLANIFICADOR",
        empresaId: A,
        rol: "PLANIFICADOR",
        personaId: "p-planif",
        correo: "yo@a.pe",
      },
    ],
    [
      "c-de-b",
      {
        id: "c-de-b",
        empresaId: B,
        rol: "TECNICO",
        personaId: null,
        correo: "b@b.pe",
      },
    ],
  ]);
  const log: string[] = [];
  const repoPersonas: PersonasRepositorio = {
    crear: async (empresaId) => (
      log.push(`persona:${empresaId}`),
      ok({ id: "p-nueva" })
    ),
    obtener: async (id) => {
      const p = personas.get(id);
      return p ? ok(p) : err(new DomainError("NOT_FOUND", "no"));
    },
    darDeBaja: async (id) => (log.push(`baja:${id}`), ok(undefined)),
    reactivar: async (id) => (log.push(`retorno:${id}`), ok(undefined)),
    actualizar: async (id) => (log.push(`editar:${id}`), ok(undefined)),
  };
  const repoCuentas: CuentasRepositorio = {
    cupo: async () => ({
      usados: opts.usados ?? 3,
      maximo: opts.maximo === undefined ? 10 : opts.maximo,
    }),
    insertar: async (d) =>
      opts.insertFalla
        ? err(new DomainError("CONFLICT", "falló"))
        : (log.push(`cuenta:${d.rol}:${d.personaId}:${d.empresaId}`),
          ok(undefined)),
    obtener: async (id) => {
      const c = cuentasMap.get(id);
      return c ? ok(c) : err(new DomainError("NOT_FOUND", "no"));
    },
    cambiarRol: async (id, rol) => (
      log.push(`rol:${id}:${rol}`),
      ok(undefined)
    ),
    asignarPersona: async (id, personaId, correo) => (
      log.push(`asignar:${id}:${personaId}:${correo}`),
      ok(undefined)
    ),
    marcarClaveCambiada: async () => (log.push("clave-marcada"), ok(undefined)),
  };
  const auth: ServicioAuth = {
    crearCuenta: async (correo) => (
      log.push(`auth:${correo}`),
      ok({ id: "auth-1", clave: "Clave-Generada-14" })
    ),
    eliminarCuenta: async (id) => void log.push(`auth-borrada:${id}`),
    cambiarCorreoYClave: async (id, correo) => (
      log.push(`auth-cambio:${id}:${correo}`),
      ok({ clave: "Otra-Clave-14x" })
    ),
    verificarClave: async (_c, clave) => clave === "actual-correcta",
    cambiarMiClave: async () => (log.push("clave-cambiada"), ok(undefined)),
  };
  return { personas: repoPersonas, cuentas: repoCuentas, auth, log };
}

const entradaCuenta = {
  empresaId: null,
  rol: "TECNICO" as const,
  correo: "nuevo@a.pe",
  personaId: null,
  personaNueva: nueva,
};

describe("crearUsuario", () => {
  it("planificador crea un técnico con persona nueva y recibe la clave una vez", async () => {
    const f = fakes();
    const r = await crearUsuario(planificador, entradaCuenta, f);
    expect(r.ok && r.value).toEqual({
      cuentaId: "auth-1",
      correo: "nuevo@a.pe",
      clave: "Clave-Generada-14",
    });
    expect(f.log).toEqual([
      `persona:${A}`,
      "auth:nuevo@a.pe",
      `cuenta:TECNICO:p-nueva:${A}`,
    ]);
  });

  it("el planificador no puede crear otro planificador", async () => {
    const f = fakes();
    const r = await crearUsuario(
      planificador,
      { ...entradaCuenta, rol: "PLANIFICADOR" },
      f,
    );
    expect(!r.ok && r.error.code).toBe("FORBIDDEN");
    expect(f.log).toEqual([]);
  });

  it("la empresa que manda el cliente se ignora: el planificador crea en la suya", async () => {
    const f = fakes();
    await crearUsuario(planificador, { ...entradaCuenta, empresaId: B }, f);
    expect(f.log).toContain(`cuenta:TECNICO:p-nueva:${A}`);
  });

  it("superadmin crea el planificador de la empresa indicada", async () => {
    const f = fakes();
    const r = await crearUsuario(
      superadmin,
      { ...entradaCuenta, rol: "PLANIFICADOR", empresaId: B },
      f,
    );
    expect(r.ok).toBe(true);
    expect(f.log).toContain(`cuenta:PLANIFICADOR:p-nueva:${B}`);
  });

  it("sin cupo: no crea nada", async () => {
    const f = fakes({ usados: 10, maximo: 10 });
    const r = await crearUsuario(planificador, entradaCuenta, f);
    expect(!r.ok && r.error.code).toBe("LIMIT");
    expect(f.log).toEqual([]);
  });

  it("plan sin máximo: siempre hay cupo", async () => {
    const f = fakes({ usados: 300, maximo: null });
    expect((await crearUsuario(planificador, entradaCuenta, f)).ok).toBe(true);
  });

  it.each([
    ["con cuenta", "p-con-cuenta", "CONFLICT"],
    ["de otra empresa", "p-de-b", "VALIDATION"],
    ["de baja", "p-baja", "VALIDATION"],
  ])("rechaza persona %s", async (_n, personaId, code) => {
    const f = fakes();
    const r = await crearUsuario(
      planificador,
      { ...entradaCuenta, personaId, personaNueva: null },
      f,
    );
    expect(!r.ok && r.error.code).toBe(code);
    expect(f.log).toEqual([]);
  });

  it("si falla guardar la cuenta, se borra la cuenta de Auth", async () => {
    const f = fakes({ insertFalla: true });
    const r = await crearUsuario(planificador, entradaCuenta, f);
    expect(r.ok).toBe(false);
    expect(f.log).toContain("auth-borrada:auth-1");
  });

  it.each([
    ["supervisor", actor("SUPERVISOR"), "FORBIDDEN"],
    ["técnico", actor("TECNICO"), "FORBIDDEN"],
    ["gerente", actor("GERENTE"), "FORBIDDEN"],
    ["sin sesión", null, "UNAUTHENTICATED"],
    [
      "planificador sin acceso",
      actor("PLANIFICADOR", { habilitado: false }),
      "UNAUTHENTICATED",
    ],
  ])("%s no puede crear cuentas", async (_n, quien, code) => {
    const f = fakes();
    const r = await crearUsuario(quien, entradaCuenta, f);
    expect(!r.ok && r.error.code).toBe(code);
    expect(f.log).toEqual([]);
  });
});

describe("darDeBajaPersona", () => {
  it("planificador da de baja a una persona de su empresa", async () => {
    const f = fakes();
    expect(
      (await darDeBajaPersona(planificador, { personaId: "p-con-cuenta" }, f))
        .ok,
    ).toBe(true);
    expect(f.log).toEqual(["baja:p-con-cuenta"]);
  });
  it("no puede darse de baja a sí mismo", async () => {
    const f = fakes();
    const r = await darDeBajaPersona(
      planificador,
      { personaId: "p-planif" },
      f,
    );
    expect(!r.ok && r.error.code).toBe("FORBIDDEN");
  });
  it("no puede dar de baja a otro planificador; el superadmin sí", async () => {
    const f = fakes();
    const r = await darDeBajaPersona(
      planificador,
      { personaId: "p-otro-planif" },
      f,
    );
    expect(!r.ok && r.error.code).toBe("FORBIDDEN");
    expect(
      (await darDeBajaPersona(superadmin, { personaId: "p-otro-planif" }, f))
        .ok,
    ).toBe(true);
  });
  it("persona de otra empresa: NOT_FOUND", async () => {
    const f = fakes();
    const r = await darDeBajaPersona(planificador, { personaId: "p-de-b" }, f);
    expect(!r.ok && r.error.code).toBe("NOT_FOUND");
  });
  it("gerente no puede", async () => {
    const f = fakes();
    const r = await darDeBajaPersona(
      actor("GERENTE"),
      { personaId: "p-libre" },
      f,
    );
    expect(!r.ok && r.error.code).toBe("FORBIDDEN");
    expect(f.log).toEqual([]);
  });
});

describe("reactivarPersona", () => {
  it("planificador devuelve a la cuadrilla a una persona de baja", async () => {
    const f = fakes();
    expect(
      (await reactivarPersona(planificador, { personaId: "p-baja" }, f)).ok,
    ).toBe(true);
    expect(f.log).toEqual(["retorno:p-baja"]);
  });
  it("persona activa: CONFLICT; de otra empresa: NOT_FOUND; gerente: FORBIDDEN", async () => {
    const f = fakes();
    const a = await reactivarPersona(planificador, { personaId: "p-libre" }, f);
    expect(!a.ok && a.error.code).toBe("CONFLICT");
    const b = await reactivarPersona(planificador, { personaId: "p-de-b" }, f);
    expect(!b.ok && b.error.code).toBe("NOT_FOUND");
    const c = await reactivarPersona(
      actor("GERENTE"),
      { personaId: "p-baja" },
      f,
    );
    expect(!c.ok && c.error.code).toBe("FORBIDDEN");
    expect(f.log).toEqual([]);
  });
});

describe("editarPersona", () => {
  it("edita a una persona de su empresa, también a sí mismo", async () => {
    const f = fakes();
    for (const personaId of ["p-libre", "p-planif"]) {
      expect(
        (await editarPersona(planificador, { personaId, persona: nueva }, f))
          .ok,
      ).toBe(true);
    }
    expect(f.log).toEqual(["editar:p-libre", "editar:p-planif"]);
  });
  it("otro planificador: FORBIDDEN; otra empresa: NOT_FOUND; gerente: FORBIDDEN", async () => {
    const f = fakes();
    const codigo = async (a: Actor, personaId: string) => {
      const r = await editarPersona(a, { personaId, persona: nueva }, f);
      return !r.ok && r.error.code;
    };
    expect(await codigo(planificador, "p-otro-planif")).toBe("FORBIDDEN");
    expect(await codigo(planificador, "p-de-b")).toBe("NOT_FOUND");
    expect(await codigo(actor("GERENTE"), "p-libre")).toBe("FORBIDDEN");
    expect(f.log).toEqual([]);
  });
});

describe("cambiarRolCuenta", () => {
  it("planificador cambia el rol de una cuenta de su equipo", async () => {
    const f = fakes();
    const r = await cambiarRolCuenta(
      planificador,
      { cuentaId: "c-libre", rol: "SUPERVISOR" },
      f,
    );
    expect(r.ok).toBe(true);
    expect(f.log).toEqual(["rol:c-libre:SUPERVISOR"]);
  });
  it("rechaza: propio, a planificador, de planificador, mismo rol, otra empresa", async () => {
    const f = fakes();
    const codigo = async (
      cuentaId: string,
      rol: "PLANIFICADOR" | "TECNICO" | "GERENTE",
    ) => {
      const r = await cambiarRolCuenta(planificador, { cuentaId, rol }, f);
      return !r.ok && r.error.code;
    };
    expect(await codigo("u-PLANIFICADOR", "GERENTE")).toBe("FORBIDDEN");
    expect(await codigo("c-libre", "PLANIFICADOR")).toBe("FORBIDDEN");
    expect(await codigo("c-plan-libre", "GERENTE")).toBe("FORBIDDEN");
    expect(await codigo("c-libre", "TECNICO")).toBe("CONFLICT");
    expect(await codigo("c-de-b", "GERENTE")).toBe("NOT_FOUND");
    expect(f.log).toEqual([]);
  });
});

describe("reemplazarPersona", () => {
  const base = {
    correo: "nueva.persona@a.pe",
    personaId: "p-libre",
    personaNueva: null,
  };
  it("cuenta libre: cambia credenciales primero y luego asigna", async () => {
    const f = fakes();
    const r = await reemplazarPersona(
      planificador,
      { ...base, cuentaId: "c-libre" },
      f,
    );
    expect(r.ok && r.value).toEqual({
      correo: "nueva.persona@a.pe",
      clave: "Otra-Clave-14x",
    });
    expect(f.log).toEqual([
      "auth-cambio:c-libre:nueva.persona@a.pe",
      "asignar:c-libre:p-libre:nueva.persona@a.pe",
    ]);
  });
  it.each([
    ["cuenta ocupada", "c-ocupada", "CONFLICT"],
    ["cuenta de otra empresa", "c-de-b", "NOT_FOUND"],
    ["cuenta de planificador", "c-plan-libre", "FORBIDDEN"],
  ])("rechaza %s", async (_n, cuentaId, code) => {
    const f = fakes();
    const r = await reemplazarPersona(planificador, { ...base, cuentaId }, f);
    expect(!r.ok && r.error.code).toBe(code);
    expect(f.log).toEqual([]);
  });
});

describe("cambiarClave", () => {
  it("con la clave actual correcta, cambia y quita el aviso", async () => {
    const f = fakes();
    const r = await cambiarClave(
      planificador,
      { actual: "actual-correcta", nueva: "una-clave-nueva-larga" },
      f,
    );
    expect(r.ok).toBe(true);
    expect(f.log).toEqual(["clave-cambiada", "clave-marcada"]);
  });
  it("con la clave actual incorrecta, no cambia nada", async () => {
    const f = fakes();
    const r = await cambiarClave(
      planificador,
      { actual: "otra", nueva: "una-clave-nueva-larga" },
      f,
    );
    expect(!r.ok && r.error.code).toBe("VALIDATION");
    expect(f.log).toEqual([]);
  });
});

import { describe, expect, it } from "vitest";
import {
  puede,
  puedeValidar,
  rolesQuePuedeGestionar,
  type Accion,
  type Recurso,
  type Rol,
} from "@/modules/identidad/domain/permisos";
import { hayCupo } from "@/modules/identidad/domain/reglas-persona-cuenta";

const ACCIONES: Accion[] = ["leer", "crear", "editar", "dar_baja"];
const RECURSOS: Recurso[] = [
  "plataforma",
  "personas",
  "cuentas",
  "catalogos",
  "flota",
  "horometro",
  "trabajos",
  "informes_validados",
  "informes_sin_validar",
  "reportes",
];

// Matriz esperada escrita a mano: si alguien cambia permisos.ts, esta prueba lo obliga a decidirlo aquí.
// L = leer, C = crear, E = editar, B = dar de baja.
const ESPERADO: Record<Rol, Partial<Record<Recurso, string>>> = {
  SUPERADMIN: { plataforma: "LCEB", personas: "LCEB", cuentas: "LCEB" },
  PLANIFICADOR: {
    personas: "LCEB",
    cuentas: "LCEB",
    catalogos: "LCEB",
    flota: "LCEB",
    horometro: "LCE",
    trabajos: "LCE",
    informes_validados: "L",
    informes_sin_validar: "L",
    reportes: "L",
  },
  SUPERVISOR: {
    personas: "L",
    catalogos: "L",
    flota: "L",
    horometro: "LC",
    trabajos: "LCE",
    informes_validados: "L",
    informes_sin_validar: "L",
    reportes: "L",
  },
  TECNICO: { catalogos: "L", trabajos: "LCE", informes_validados: "L" },
  GERENTE: {
    personas: "L",
    cuentas: "L",
    catalogos: "L",
    flota: "L",
    horometro: "L",
    trabajos: "L",
    informes_validados: "L",
    informes_sin_validar: "L",
    reportes: "L",
  },
};
const LETRA: Record<Accion, string> = {
  leer: "L",
  crear: "C",
  editar: "E",
  dar_baja: "B",
};

describe("matriz de permisos", () => {
  for (const rol of Object.keys(ESPERADO) as Rol[]) {
    for (const recurso of RECURSOS) {
      for (const accion of ACCIONES) {
        const permitido = (ESPERADO[rol][recurso] ?? "").includes(
          LETRA[accion],
        );
        it(`${rol} ${permitido ? "puede" : "NO puede"} ${accion} ${recurso}`, () => {
          expect(puede(rol, accion, recurso)).toBe(permitido);
        });
      }
    }
  }

  it("el gerente no escribe nada", () => {
    for (const recurso of RECURSOS) {
      for (const accion of ["crear", "editar", "dar_baja"] as const) {
        expect(puede("GERENTE", accion, recurso)).toBe(false);
      }
    }
  });

  it("el técnico no ve la flota ni informes sin validar", () => {
    expect(puede("TECNICO", "leer", "flota")).toBe(false);
    expect(puede("TECNICO", "leer", "informes_sin_validar")).toBe(false);
  });

  it("rol desconocido o vacío no puede nada", () => {
    expect(puede(null, "leer", "personas")).toBe(false);
    expect(puede("ADMIN", "leer", "personas")).toBe(false);
  });
});

describe("roles que puede gestionar", () => {
  it("superadmin crea cualquier rol de empresa, incluido planificador", () => {
    expect(rolesQuePuedeGestionar("SUPERADMIN")).toEqual([
      "PLANIFICADOR",
      "SUPERVISOR",
      "TECNICO",
      "GERENTE",
    ]);
  });
  it("planificador crea supervisor, técnico y gerente, no planificadores", () => {
    expect(rolesQuePuedeGestionar("PLANIFICADOR")).toEqual([
      "SUPERVISOR",
      "TECNICO",
      "GERENTE",
    ]);
  });
  it.each(["SUPERVISOR", "TECNICO", "GERENTE", null])(
    "%s no crea cuentas",
    (rol) => {
      expect(rolesQuePuedeGestionar(rol)).toEqual([]);
    },
  );
});

describe("puedeValidar", () => {
  it("supervisor siempre", () => {
    expect(
      puedeValidar("SUPERVISOR", { planificadorPuedeValidar: false }),
    ).toBe(true);
  });
  it("planificador solo si la empresa lo autoriza", () => {
    expect(
      puedeValidar("PLANIFICADOR", { planificadorPuedeValidar: false }),
    ).toBe(false);
    expect(
      puedeValidar("PLANIFICADOR", { planificadorPuedeValidar: true }),
    ).toBe(true);
  });
  it.each(["TECNICO", "GERENTE", "SUPERADMIN"])("%s nunca", (rol) => {
    expect(puedeValidar(rol, { planificadorPuedeValidar: true })).toBe(false);
  });
});

describe("cupo", () => {
  it("Estándar: 10 cuentas como máximo", () => {
    expect(hayCupo({ usados: 9, maximo: 10 })).toBe(true);
    expect(hayCupo({ usados: 10, maximo: 10 })).toBe(false);
  });
  it("sin máximo: siempre hay cupo", () => {
    expect(hayCupo({ usados: 500, maximo: null })).toBe(true);
  });
});

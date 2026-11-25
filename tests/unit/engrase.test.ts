import { describe, expect, it } from "vitest";
import {
  calcularEstado,
  esRegistroCompleto,
  ordenarPorEstado,
  puntosEfectivos,
  validarHorometroEngrase,
  type Punto,
  type Umbral,
} from "@/modules/engrase/domain/estado-engrase";
import {
  configurarAvisoEngrase,
  guardarPlanEngrase,
  listarEngrase,
  registrarEngrase,
  verEngrase,
} from "@/modules/engrase/application/casos-uso";
import {
  avisoSchema,
  planSchema,
  registroSchema,
  type RegistroEntrada,
} from "@/modules/engrase/application/esquemas";
import type {
  EngraseRepositorio,
  EquipoEngrase,
  LectorEngrase,
  ReposEngrase,
} from "@/modules/engrase/application/repositorios";
import type { Actor } from "@/shared/kernel/actor";
import { ok } from "@/shared/kernel/result";

const HOY = "2026-11-25";
const PCT20: Umbral = { tipo: "PORCENTAJE", valor: 20 };
const H250 = { cadaHoras: 250, cadaDias: null };
const D10 = { cadaHoras: null, cadaDias: 10 };
const ULT = { fecha: HOY, horometro: 1000 };

describe("estado de engrase", () => {
  it("sin plan y sin registro completo", () => {
    expect(calcularEstado(null, ULT, 1000, HOY, PCT20).estado).toBe("SIN_PLAN");
    expect(calcularEstado(H250, null, 1000, HOY, PCT20).estado).toBe(
      "SIN_REGISTRO",
    );
  });

  it("horas con 20 %: 1199 al día, 1200 por vencer, 1249 por vencer, 1250 vencido", () => {
    const e = (l: number) => calcularEstado(H250, ULT, l, HOY, PCT20);
    expect(e(1199)).toEqual({
      estado: "AL_DIA",
      restanteHoras: 51,
      restanteDias: null,
    });
    expect(e(1200).estado).toBe("POR_VENCER");
    expect(e(1249).estado).toBe("POR_VENCER");
    expect(e(1250).estado).toBe("VENCIDO");
    expect(e(1300).restanteHoras).toBe(-50);
  });

  it("días con 20 %: día 7 al día, día 8 por vencer, día 10 vencido", () => {
    const ult = { fecha: "2026-11-15", horometro: 0 };
    const e = (hoy: string) => calcularEstado(D10, ult, 0, hoy, PCT20);
    expect(e("2026-11-22")).toEqual({
      estado: "AL_DIA",
      restanteHoras: null,
      restanteDias: 3,
    });
    expect(e("2026-11-23").estado).toBe("POR_VENCER");
    expect(e("2026-11-24").estado).toBe("POR_VENCER");
    expect(e("2026-11-25").estado).toBe("VENCIDO");
  });

  it("aviso en horas fijas: no avisa por días", () => {
    const u: Umbral = { tipo: "HORAS", valor: 30 };
    expect(calcularEstado(H250, ULT, 1219, HOY, u).estado).toBe("AL_DIA");
    expect(calcularEstado(H250, ULT, 1220, HOY, u).estado).toBe("POR_VENCER");
    const ult = { fecha: "2026-11-16", horometro: 0 };
    expect(calcularEstado(D10, ult, 0, HOY, u).estado).toBe("AL_DIA");
    expect(calcularEstado(D10, ult, 0, "2026-11-26", u).estado).toBe("VENCIDO");
  });

  it("aviso en días fijos: no avisa por horas", () => {
    const u: Umbral = { tipo: "DIAS", valor: 3 };
    expect(calcularEstado(H250, ULT, 1249, HOY, u).estado).toBe("AL_DIA");
    const ult = { fecha: "2026-11-15", horometro: 0 };
    expect(calcularEstado(D10, ult, 0, "2026-11-21", u).estado).toBe("AL_DIA");
    expect(calcularEstado(D10, ult, 0, "2026-11-22", u).estado).toBe(
      "POR_VENCER",
    );
  });

  it("horas y días: lo que venza primero manda", () => {
    const plan = { cadaHoras: 250, cadaDias: 10 };
    const ult = { fecha: "2026-11-15", horometro: 1000 };
    expect(calcularEstado(plan, ult, 1010, "2026-11-25", PCT20).estado).toBe(
      "VENCIDO",
    );
    expect(calcularEstado(plan, ult, 1250, "2026-11-16", PCT20).estado).toBe(
      "VENCIDO",
    );
    expect(calcularEstado(plan, ult, 1210, "2026-11-16", PCT20).estado).toBe(
      "POR_VENCER",
    );
    expect(calcularEstado(plan, ult, 1010, "2026-11-16", PCT20).estado).toBe(
      "AL_DIA",
    );
  });

  it("horómetro con decimales no deja restos de coma flotante", () => {
    const ult = { fecha: HOY, horometro: 1000.1 };
    expect(calcularEstado(H250, ult, 1200.1, HOY, PCT20).restanteHoras).toBe(
      50,
    );
  });

  it("ordena vencido, por vencer, sin registro, al día, sin plan", () => {
    const filas = [
      "SIN_PLAN",
      "AL_DIA",
      "VENCIDO",
      "SIN_REGISTRO",
      "POR_VENCER",
    ].map(
      (estado) =>
        ({ estado }) as {
          estado: Parameters<typeof ordenarPorEstado>[0][number]["estado"];
        },
    );
    expect(ordenarPorEstado(filas).map((f) => f.estado)).toEqual([
      "VENCIDO",
      "POR_VENCER",
      "SIN_REGISTRO",
      "AL_DIA",
      "SIN_PLAN",
    ]);
  });
});

describe("registro", () => {
  it("completo solo si engrasó todos y hay al menos uno", () => {
    expect(esRegistroCompleto(3, 3)).toBe(true);
    expect(esRegistroCompleto(3, 2)).toBe(false);
    expect(esRegistroCompleto(0, 0)).toBe(false);
  });

  it("horómetro: menor que el último engrase no; igual o mayor sí; sin engrase previo sí", () => {
    expect(validarHorometroEngrase(999, 1000, 1000).ok).toBe(false);
    expect(validarHorometroEngrase(1000, 1000, 1000).ok).toBe(true);
    expect(validarHorometroEngrase(1001, 1000, 1000).ok).toBe(true);
    expect(validarHorometroEngrase(5, null, 0).ok).toBe(true);
  });

  it("horómetro: tras una corrección a la baja no queda bloqueado", () => {
    // El actual (900) quedó por debajo del último engrase (1000): hubo corrección.
    expect(validarHorometroEngrase(950, 1000, 900).ok).toBe(true);
  });

  it("horómetro: negativo, fuera de rango o no numérico no", () => {
    expect(validarHorometroEngrase(-1, null, 0).ok).toBe(false);
    expect(validarHorometroEngrase(Number.NaN, null, 0).ok).toBe(false);
    expect(validarHorometroEngrase(1_000_001, null, 0).ok).toBe(false);
  });
});

describe("puntos efectivos", () => {
  const plantillas = [
    { id: "g", descripcion: "General", orden: 2, categoriaId: null },
    { id: "c", descripcion: "Tolva", orden: 1, categoriaId: "volquete" },
    { id: "x", descripcion: "Brazo", orden: 0, categoriaId: "excavadora" },
  ];

  it("sin puntos propios: plantillas de su categoría y generales, por orden", () => {
    expect(
      puntosEfectivos([], plantillas, "volquete").map((p) => p.id),
    ).toEqual(["c", "g"]);
  });

  it("con puntos propios: solo esos", () => {
    const propios = [{ id: "p", descripcion: "Cardán", orden: 0 }];
    expect(puntosEfectivos(propios, plantillas, "volquete")).toEqual(propios);
  });
});

const A = "0190a1b2-0000-7000-8000-00000000000a";
const U1 = "0190a1b2-0000-7000-8000-000000000001";
const U2 = "0190a1b2-0000-7000-8000-000000000002";
const AHORA = new Date("2026-11-25T15:00:00Z");
const actor = (rol: string, extra: Partial<Actor> = {}): Actor => ({
  id: `u-${rol}`,
  email: "x@a.pe",
  rol,
  empresaId: rol === "SUPERADMIN" ? null : A,
  personaId: `p-${rol}`,
  habilitado: true,
  motivo: null,
  debeCambiarClave: false,
  ...extra,
});

const equipo = (extra: Partial<EquipoEngrase> = {}): EquipoEngrase => ({
  id: "e1",
  codigo: "VOL-1",
  categoriaId: "volquete",
  medidor: "HORAS",
  horometro: 1000,
  plan: null,
  ultimoCompleto: null,
  ultimoRegistro: null,
  ...extra,
});

const P1 = "0190a1b2-0000-7000-8000-0000000000a1";
const P2 = "0190a1b2-0000-7000-8000-0000000000a2";
const PLANTILLAS = [
  { id: P1, descripcion: "Tolva", orden: 0, categoriaId: "volquete" },
  { id: P2, descripcion: "Cardán", orden: 1, categoriaId: null },
];

function repos(
  equipos: EquipoEngrase[],
  puntos: (Punto & { equipoId: string })[] = [],
) {
  const llamadas: string[] = [];
  const lector: LectorEngrase = {
    async equipos(id) {
      return id ? equipos.filter((e) => e.id === id) : equipos;
    },
    async empresa() {
      return { zonaHoraria: "America/Lima", aviso: PCT20 };
    },
    async grasas() {
      return [{ id: U2, nombre: "EP2" }];
    },
    async plantillas() {
      return PLANTILLAS;
    },
    async puntos(id) {
      return id ? puntos.filter((p) => p.equipoId === id) : puntos;
    },
    async registros() {
      return [];
    },
  };
  const engrase: EngraseRepositorio = {
    async guardarPlan() {
      llamadas.push("plan");
      return ok(undefined);
    },
    async registrar() {
      llamadas.push("registrar");
      return ok(undefined);
    },
    async configurarAviso() {
      llamadas.push("aviso");
      return ok(undefined);
    },
  };
  return { r: { lector, engrase } as ReposEngrase, llamadas };
}

describe("listar engrase", () => {
  const plan = { cadaHoras: 250, cadaDias: null, tipoGrasaId: "g" };
  const lista = [
    equipo({ id: "sin-plan", codigo: "A" }),
    equipo({
      id: "vencido",
      codigo: "B",
      plan,
      horometro: 1300,
      ultimoCompleto: ULT,
    }),
    equipo({
      id: "al-dia",
      codigo: "C",
      plan,
      horometro: 1010,
      ultimoCompleto: ULT,
    }),
  ];

  it("calcula el estado con el hoy de la empresa y ordena por urgencia", async () => {
    const r = await listarEngrase(actor("TECNICO"), repos(lista).r, AHORA);
    if (!r.ok) throw r.error;
    expect(r.value.hoy).toBe("2026-11-25");
    expect(r.value.filas.map((f) => [f.id, f.estado])).toEqual([
      ["vencido", "VENCIDO"],
      ["al-dia", "AL_DIA"],
      ["sin-plan", "SIN_PLAN"],
    ]);
    expect(r.value.filas[0].restanteHoras).toBe(-50);
  });

  it("superadmin y sin sesión no", async () => {
    const s = await listarEngrase(actor("SUPERADMIN"), repos(lista).r, AHORA);
    expect(s.ok || s.error.code).toBe("FORBIDDEN");
    const n = await listarEngrase(null, repos(lista).r, AHORA);
    expect(n.ok || n.error.code).toBe("UNAUTHENTICATED");
  });
});

describe("esquemas", () => {
  const plan = {
    equipoId: U1,
    cadaHoras: "250",
    cadaDias: "",
    tipoGrasaId: U2,
    puntos: ["Tolva", "Cardán"],
  };

  it("plan: horas, días o ambos; ninguno no", () => {
    expect(planSchema.safeParse(plan).success).toBe(true);
    expect(
      planSchema.safeParse({ ...plan, cadaHoras: "", cadaDias: "10" }).success,
    ).toBe(true);
    expect(planSchema.safeParse({ ...plan, cadaHoras: "" }).success).toBe(
      false,
    );
  });

  it("plan: horas en cero, con coma o enormes no; días fuera de rango no", () => {
    for (const cadaHoras of ["0", "1,5", "100001", "-1", "abc"]) {
      expect(planSchema.safeParse({ ...plan, cadaHoras }).success).toBe(false);
    }
    expect(planSchema.safeParse({ ...plan, cadaDias: "3651" }).success).toBe(
      false,
    );
  });

  it("plan: sin puntos, repetidos o con campo extra no", () => {
    expect(planSchema.safeParse({ ...plan, puntos: [] }).success).toBe(false);
    expect(
      planSchema.safeParse({ ...plan, puntos: ["Tolva", "tolva"] }).success,
    ).toBe(false);
    expect(planSchema.safeParse({ ...plan, empresaId: U1 }).success).toBe(
      false,
    );
  });

  const registro = {
    equipoId: U1,
    fecha: "2026-11-25",
    horometro: "1250.5",
    tipoGrasaId: U2,
    engrasados: [U1],
    observacion: "",
    clave: U2,
  };

  it("registro: horómetro con coma, negativo o vacío no", () => {
    expect(registroSchema.safeParse(registro).success).toBe(true);
    for (const horometro of ["1,250", "-5", "", "1e3"]) {
      expect(registroSchema.safeParse({ ...registro, horometro }).success).toBe(
        false,
      );
    }
  });

  it("registro: el cliente no manda si está completo", () => {
    expect(
      registroSchema.safeParse({ ...registro, completo: true }).success,
    ).toBe(false);
  });

  it("aviso: rango según el tipo", () => {
    const ok = (tipo: string, valor: string) =>
      avisoSchema.safeParse({ tipo, valor }).success;
    expect(ok("PORCENTAJE", "20")).toBe(true);
    expect(ok("PORCENTAJE", "101")).toBe(false);
    expect(ok("PORCENTAJE", "0")).toBe(false);
    expect(ok("HORAS", "500")).toBe(true);
    expect(ok("DIAS", "3651")).toBe(false);
    expect(ok("DIAS", "2.5")).toBe(false);
    expect(ok("SEMANAS", "2")).toBe(false);
  });
});

describe("plan y registro", () => {
  const plan = planSchema.parse({
    equipoId: U1,
    cadaHoras: "250",
    cadaDias: "",
    tipoGrasaId: U2,
    puntos: ["Tolva"],
  });

  it("plan: planificador y supervisor sí; técnico y gerente no", async () => {
    for (const rol of ["TECNICO", "GERENTE", "SUPERADMIN"]) {
      const { r, llamadas } = repos([]);
      const x = await guardarPlanEngrase(actor(rol), plan, r);
      expect(x.ok || x.error.code).toBe("FORBIDDEN");
      expect(llamadas).toEqual([]);
    }
    for (const rol of ["PLANIFICADOR", "SUPERVISOR"]) {
      const { r, llamadas } = repos([]);
      expect((await guardarPlanEngrase(actor(rol), plan, r)).ok).toBe(true);
      expect(llamadas).toEqual(["plan"]);
    }
  });

  const eq = equipo({
    id: U1,
    ultimoRegistro: { fecha: "2026-11-20", horometro: 990 },
  });
  const registro = (extra: Partial<RegistroEntrada> = {}): RegistroEntrada => ({
    equipoId: U1,
    fecha: "2026-11-25",
    horometro: 1005,
    tipoGrasaId: U2,
    engrasados: [P1, P2],
    observacion: null,
    clave: U2,
    ...extra,
  });
  const registrar = async (
    e: Partial<RegistroEntrada>,
    rol = "TECNICO",
    eqs = [eq],
  ) => {
    const { r, llamadas } = repos(eqs);
    const x = await registrarEngrase(actor(rol), registro(e), r, AHORA);
    return { x: x.ok ? "ok" : x.error.message, llamadas };
  };

  it("el técnico registra un engrase completo con los puntos de plantilla", async () => {
    expect(await registrar({})).toEqual({ x: "ok", llamadas: ["registrar"] });
  });

  it("el gerente no registra", async () => {
    expect((await registrar({}, "GERENTE")).llamadas).toEqual([]);
  });

  it("incompleto exige observación de 3 caracteres o más", async () => {
    expect((await registrar({ engrasados: [P1] })).x).toBe(
      "observacion_obligatoria",
    );
    expect((await registrar({ engrasados: [P1], observacion: "no" })).x).toBe(
      "observacion_obligatoria",
    );
    expect(
      (await registrar({ engrasados: [P1], observacion: "sin acceso" })).x,
    ).toBe("ok");
  });

  it("un punto que no es del equipo no se acepta", async () => {
    expect((await registrar({ engrasados: [P1, U1] })).x).toBe(
      "punto_no_valido",
    );
  });

  it("horómetro menor que el último engrase, fecha futura o anterior al último no", async () => {
    expect((await registrar({ horometro: 989 })).x).toBe("horometro_menor");
    expect((await registrar({ fecha: "2026-11-26" })).x).toBe("fecha_futura");
    expect((await registrar({ fecha: "2026-11-19" })).x).toBe("fecha_anterior");
  });

  it("equipo que no se engrasa (o de otra empresa) no se encuentra", async () => {
    expect((await registrar({}, "TECNICO", [])).x).toBe("equipo no existe");
  });

  it("sin puntos disponibles no se registra", async () => {
    const { r } = repos([equipo({ id: U1, categoriaId: "otra" })]);
    const sinPlantillas = {
      ...r,
      lector: { ...r.lector, plantillas: async () => [] },
    };
    const x = await registrarEngrase(
      actor("TECNICO"),
      registro({ engrasados: [] }),
      sinPlantillas,
      AHORA,
    );
    expect(x.ok || x.error.message).toBe("sin_puntos");
  });

  it("con puntos propios del plan, las plantillas no cuentan", async () => {
    const propios = [{ id: U1, descripcion: "Muelle", orden: 0, equipoId: U1 }];
    const { r } = repos([eq], propios);
    const x = await registrarEngrase(actor("TECNICO"), registro(), r, AHORA);
    expect(x.ok || x.error.message).toBe("punto_no_valido");
    const y = await registrarEngrase(
      actor("TECNICO"),
      registro({ engrasados: [U1] }),
      r,
      AHORA,
    );
    expect(y.ok).toBe(true);
  });
});

describe("aviso", () => {
  it("solo el planificador lo configura", async () => {
    for (const rol of ["SUPERVISOR", "TECNICO", "GERENTE", "SUPERADMIN"]) {
      const { r, llamadas } = repos([]);
      const x = await configurarAvisoEngrase(
        actor(rol),
        { tipo: "HORAS", valor: 30 },
        r,
      );
      expect(x.ok || x.error.code).toBe("FORBIDDEN");
      expect(llamadas).toEqual([]);
    }
    const { r, llamadas } = repos([]);
    const x = await configurarAvisoEngrase(
      actor("PLANIFICADOR"),
      { tipo: "HORAS", valor: 30 },
      r,
    );
    expect(x.ok).toBe(true);
    expect(llamadas).toEqual(["aviso"]);
  });
});

describe("ver engrase", () => {
  it("equipo que no se engrasa: no encontrado; el gerente lo lee", async () => {
    const { r } = repos([equipo({ id: U1 })]);
    const no = await verEngrase(actor("GERENTE"), U2, r, AHORA);
    expect(no.ok || no.error.code).toBe("NOT_FOUND");
    const si = await verEngrase(actor("GERENTE"), U1, r, AHORA);
    expect(si.ok && si.value.fila.puntos.map((p) => p.id)).toEqual([P1, P2]);
  });
});

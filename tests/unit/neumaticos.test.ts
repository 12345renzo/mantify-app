import { describe, expect, it } from "vitest";
import {
  definirPosiciones,
  guardarNeumatico,
  guardarUmbrales,
  listarNeumaticos,
  medirNeumaticos,
  montarNeumatico,
  recaparNeumatico,
} from "@/modules/neumaticos/application/casos-uso";
import {
  medirSchema,
  montarSchema,
  neumaticoSchema,
  recaparSchema,
  rotarSchema,
  umbralesSchema,
} from "@/modules/neumaticos/application/esquemas";
import type {
  LectorNeumaticos,
  Montaje,
  Neumatico,
  NeumaticosRepositorio,
  ReposNeumaticos,
  UmbralGuardado,
} from "@/modules/neumaticos/application/repositorios";
import type { Actor } from "@/shared/kernel/actor";
import { ok } from "@/shared/kernel/result";
import { costoPorHora, proyeccion } from "@/modules/neumaticos/domain/costos";
import { posicionesDePlantilla } from "@/modules/neumaticos/domain/posiciones";
import {
  cocada,
  desgasteIrregular,
  diferencia,
  ordenarPorSalud,
  saludCubierta,
  umbralesEfectivos,
  type Umbrales,
} from "@/modules/neumaticos/domain/salud";

const U: Umbrales = {
  cocadaMinima: 3,
  cocadaAlerta: 6,
  diasSinMedir: 30,
  diferenciaMaxima: 3,
};

describe("cocada y diferencia", () => {
  it("la cocada es el menor de los tres puntos", () => {
    expect(cocada({ interno: 8, centro: 5, externo: 9 })).toBe(5);
  });
  it("la diferencia es el mayor menos el menor", () => {
    expect(diferencia({ interno: 8, centro: 5, externo: 9 })).toBe(4);
  });
});

describe("salud", () => {
  it("3 cambiar, 3.1 alerta, 6 alerta, 6.1 ok", () => {
    expect(saludCubierta(3, U, 0)).toBe("CAMBIAR");
    expect(saludCubierta(2.5, U, 0)).toBe("CAMBIAR");
    expect(saludCubierta(3.1, U, 0)).toBe("ALERTA");
    expect(saludCubierta(6, U, 0)).toBe("ALERTA");
    expect(saludCubierta(6.1, U, 0)).toBe("OK");
  });

  it("medir: desde los días sin medición; cambiar y alerta mandan", () => {
    expect(saludCubierta(10, U, 29)).toBe("OK");
    expect(saludCubierta(10, U, 30)).toBe("MEDIR");
    expect(saludCubierta(5, U, 40)).toBe("ALERTA");
    expect(saludCubierta(3, U, 40)).toBe("CAMBIAR");
  });

  it("sin umbrales: sin umbral", () => {
    expect(saludCubierta(1, null, 99)).toBe("SIN_UMBRAL");
  });

  it("el umbral del equipo reemplaza al de la categoría", () => {
    const equipo = { ...U, cocadaMinima: 5, cocadaAlerta: 8 };
    expect(umbralesEfectivos(equipo, U)).toEqual(equipo);
    expect(umbralesEfectivos(null, U)).toEqual(U);
    expect(umbralesEfectivos(null, null)).toBeNull();
    expect(saludCubierta(5, umbralesEfectivos(equipo, U), 0)).toBe("CAMBIAR");
  });

  it("desgaste irregular desde la diferencia máxima", () => {
    expect(desgasteIrregular(2.9, U)).toBe(false);
    expect(desgasteIrregular(3, U)).toBe(true);
    expect(desgasteIrregular(null, U)).toBe(false);
    expect(desgasteIrregular(9, null)).toBe(false);
  });

  it("ordena cambiar, alerta, medir, sin umbral, ok", () => {
    const filas = (
      ["OK", "SIN_UMBRAL", "MEDIR", "CAMBIAR", "ALERTA"] as const
    ).map((salud) => ({ salud }));
    expect(ordenarPorSalud(filas).map((f) => f.salud)).toEqual([
      "CAMBIAR",
      "ALERTA",
      "MEDIR",
      "SIN_UMBRAL",
      "OK",
    ]);
  });
});

describe("costos", () => {
  it("1200 en 400 h: 3 por hora", () => {
    expect(costoPorHora(1200, 400)).toBe(3);
  });
  it("sin horas o sin costo: null, no cero", () => {
    expect(costoPorHora(1200, 0)).toBeNull();
    expect(costoPorHora(null, 400)).toBeNull();
  });
  it("redondea a dos decimales", () => {
    expect(costoPorHora(1000, 3)).toBe(333.33);
  });
});

describe("proyección", () => {
  it("sin mediciones o con una sola: null", () => {
    expect(proyeccion([], 3)).toBeNull();
    expect(proyeccion([{ horometro: 100, cocada: 15 }], 3)).toBeNull();
  });
  it("desgaste por hora y horas hasta la mínima", () => {
    expect(
      proyeccion(
        [
          { horometro: 1500, cocada: 10 },
          { horometro: 1000, cocada: 15 },
        ],
        3,
      ),
    ).toEqual({ desgastePorHora: 0.01, horasRestantes: 700 });
  });
  it("sin desgaste o sin horas entre mediciones: null", () => {
    expect(
      proyeccion(
        [
          { horometro: 1000, cocada: 15 },
          { horometro: 1500, cocada: 15 },
        ],
        3,
      ),
    ).toBeNull();
    expect(
      proyeccion(
        [
          { horometro: 1000, cocada: 15 },
          { horometro: 1000, cocada: 12 },
        ],
        3,
      ),
    ).toBeNull();
  });
  it("ya bajo la mínima: cero horas restantes", () => {
    expect(
      proyeccion(
        [
          { horometro: 0, cocada: 10 },
          { horometro: 100, cocada: 2 },
        ],
        3,
      )?.horasRestantes,
    ).toBe(0);
  });
});

describe("posiciones desde plantilla", () => {
  it("una línea por eje, posiciones separadas por |", () => {
    const r = posicionesDePlantilla("DEL-I | DEL-D\nP1-IE|P1-II| p1-di |P1-DE");
    expect(r.ok && r.value).toEqual([
      { codigo: "DEL-I", eje: 1, orden: 0 },
      { codigo: "DEL-D", eje: 1, orden: 1 },
      { codigo: "P1-IE", eje: 2, orden: 2 },
      { codigo: "P1-II", eje: 2, orden: 3 },
      { codigo: "P1-DI", eje: 2, orden: 4 },
      { codigo: "P1-DE", eje: 2, orden: 5 },
    ]);
  });
  it("posiciones repetidas o vacías no", () => {
    expect(posicionesDePlantilla("A | A").ok).toBe(false);
    expect(posicionesDePlantilla("A | ").ok).toBe(false);
    expect(posicionesDePlantilla("").ok).toBe(false);
  });
});

const A = "0190a1b2-0000-7000-8000-00000000000a";
const U1 = "0190a1b2-0000-7000-8000-000000000001";
const U2 = "0190a1b2-0000-7000-8000-000000000002";
const U3 = "0190a1b2-0000-7000-8000-000000000003";
const AHORA = new Date("2026-11-25T15:00:00Z");
const actor = (rol: string): Actor => ({
  id: `u-${rol}`,
  email: "x@a.pe",
  rol,
  empresaId: rol === "SUPERADMIN" ? null : A,
  personaId: `p-${rol}`,
  habilitado: true,
  motivo: null,
  debeCambiarClave: false,
});

const montaje = (extra: Partial<Montaje> = {}): Montaje => ({
  equipoId: "eq",
  equipoCodigo: "VOL-1",
  equipoHorometro: 1400,
  categoriaId: "cat",
  medidor: "HORAS",
  posicionId: "p1",
  posicionCodigo: "DEL-I",
  montadoEn: "2026-11-01",
  horometroMontaje: 1000,
  cocadaMontaje: 18,
  ...extra,
});

const cubierta = (extra: Partial<Neumatico> = {}): Neumatico => ({
  id: U1,
  codigo: "C-001",
  marca: "Michelin",
  modelo: null,
  medida: "12R22.5",
  cocadaNueva: 18,
  costo: 1200,
  costoRecapados: 0,
  estado: "MONTADO",
  recapados: 0,
  horasAcumuladas: 0,
  montaje: montaje(),
  ultimaMedicion: null,
  ...extra,
});

function repos(lista: Neumatico[], umbrales: UmbralGuardado[] = []) {
  const llamadas: string[] = [];
  const lector: LectorNeumaticos = {
    neumaticos: async (id) => (id ? lista.filter((n) => n.id === id) : lista),
    equipos: async () => [
      {
        id: "eq",
        codigo: "VOL-1",
        categoriaId: "cat",
        medidor: "HORAS",
        horometro: 1400,
      },
    ],
    posiciones: async () => [{ id: "p1", codigo: "DEL-I", eje: 1, orden: 0 }],
    umbrales: async () => umbrales,
    motivos: async () => [],
    plantillas: async () => [],
    categorias: async () => [],
    empresa: async () => ({ zonaHoraria: "America/Lima", esPro: false }),
    eventos: async () => [],
    mediciones: async () => [],
  };
  const registrar = (n: string) => async () => {
    llamadas.push(n);
    return ok(undefined);
  };
  const neumaticos: NeumaticosRepositorio = {
    guardar: async () => {
      llamadas.push("guardar");
      return ok(U1);
    },
    definirPosiciones: registrar("posiciones"),
    guardarUmbrales: registrar("umbrales"),
    montar: registrar("montar"),
    desmontar: registrar("desmontar"),
    rotar: registrar("rotar"),
    recapar: registrar("recapar"),
    medir: registrar("medir"),
  };
  return { r: { lector, neumaticos } as ReposNeumaticos, llamadas };
}

const DE_CATEGORIA: UmbralGuardado = {
  ...U,
  categoriaId: "cat",
  equipoId: null,
};

describe("listar neumáticos", () => {
  it("salud con la medición más reciente y los umbrales de la categoría", async () => {
    const n = cubierta({
      ultimaMedicion: {
        fecha: "2026-11-20",
        puntos: { interno: 8, centro: 5, externo: 9 },
        presion: null,
      },
    });
    const r = await listarNeumaticos(
      actor("PLANIFICADOR"),
      repos([n], [DE_CATEGORIA]).r,
      AHORA,
    );
    if (!r.ok) throw r.error;
    const f = r.value.filas[0];
    expect([
      f.cocadaActual,
      f.diferencia,
      f.salud,
      f.irregular,
      f.diasSinMedir,
    ]).toEqual([5, 4, "ALERTA", true, 5]);
  });

  it("los umbrales del equipo reemplazan a los de la categoría", async () => {
    const propio: UmbralGuardado = {
      ...U,
      cocadaMinima: 6,
      cocadaAlerta: 9,
      categoriaId: null,
      equipoId: "eq",
    };
    const n = cubierta({ montaje: montaje({ cocadaMontaje: 6 }) });
    const r = await listarNeumaticos(
      actor("PLANIFICADOR"),
      repos([n], [DE_CATEGORIA, propio]).r,
      AHORA,
    );
    expect(r.ok && r.value.filas[0].salud).toBe("CAMBIAR");
  });

  it("sin medir desde el montaje: días desde el montaje; costo por hora con las horas del montaje", async () => {
    const r = await listarNeumaticos(
      actor("GERENTE"),
      repos([cubierta()], [DE_CATEGORIA]).r,
      AHORA,
    );
    if (!r.ok) throw r.error;
    const f = r.value.filas[0];
    expect([f.cocadaActual, f.diasSinMedir, f.salud, f.costoPorHora]).toEqual([
      18,
      24,
      "OK",
      3,
    ]);
  });

  it("si se montó después de la última medición, manda la cocada del montaje", async () => {
    const n = cubierta({
      montaje: montaje({ montadoEn: "2026-11-22", cocadaMontaje: 12 }),
      ultimaMedicion: {
        fecha: "2026-11-20",
        puntos: { interno: 5, centro: 5, externo: 5 },
        presion: null,
      },
    });
    const r = await listarNeumaticos(
      actor("PLANIFICADOR"),
      repos([n], [DE_CATEGORIA]).r,
      AHORA,
    );
    expect(r.ok && r.value.filas[0].cocadaActual).toBe(12);
  });

  it("en stock no hay salud; sin costo (técnico) no hay costo por hora", async () => {
    const stock = cubierta({
      id: U2,
      estado: "STOCK",
      montaje: null,
      costo: null,
      horasAcumuladas: 500,
    });
    const r = await listarNeumaticos(
      actor("TECNICO"),
      repos([stock], [DE_CATEGORIA]).r,
      AHORA,
    );
    if (!r.ok) throw r.error;
    expect([
      r.value.filas[0].salud,
      r.value.filas[0].costoPorHora,
      r.value.veCostos,
    ]).toEqual([null, null, false]);
  });

  it("superadmin no", async () => {
    const r = await listarNeumaticos(actor("SUPERADMIN"), repos([]).r, AHORA);
    expect(r.ok || r.error.code).toBe("FORBIDDEN");
  });
});

describe("operaciones por rol", () => {
  const cubiertaNueva = neumaticoSchema.parse({
    id: "",
    codigo: "c-1",
    marca: "M",
    modelo: "",
    medida: "12R22.5",
    cocadaNueva: "18",
    costo: "",
    clave: U3,
  });

  it("cargar: planificador y supervisor; técnico y gerente no", async () => {
    for (const [rol, esperado] of [
      ["PLANIFICADOR", true],
      ["SUPERVISOR", true],
      ["TECNICO", false],
      ["GERENTE", false],
    ] as const) {
      const r = await guardarNeumatico(actor(rol), cubiertaNueva, repos([]).r);
      expect(r.ok).toBe(esperado);
    }
  });

  it("umbrales: solo el planificador", async () => {
    const entrada = umbralesSchema.parse({
      destino: "categoria",
      destinoId: U1,
      quitar: "",
      cocadaMinima: "3",
      cocadaAlerta: "6",
      diasSinMedir: "30",
      diferenciaMaxima: "3",
    });
    for (const rol of ["SUPERVISOR", "TECNICO", "GERENTE"]) {
      const r = await guardarUmbrales(actor(rol), entrada, repos([]).r);
      expect(r.ok || r.error.code).toBe("FORBIDDEN");
    }
    const { r, llamadas } = repos([]);
    expect((await guardarUmbrales(actor("PLANIFICADOR"), entrada, r)).ok).toBe(
      true,
    );
    expect(llamadas).toEqual(["umbrales"]);
  });

  it("montar: técnico sí; gerente no", async () => {
    const entrada = montarSchema.parse({
      neumaticoId: U1,
      posicionId: U2,
      fecha: "2026-11-25",
      horometro: "1400",
      cocada: "18",
      clave: U3,
    });
    expect(
      (await montarNeumatico(actor("TECNICO"), entrada, repos([]).r, AHORA)).ok,
    ).toBe(true);
    const g = await montarNeumatico(
      actor("GERENTE"),
      entrada,
      repos([]).r,
      AHORA,
    );
    expect(g.ok || g.error.code).toBe("FORBIDDEN");
  });

  it("montar con fecha futura no", async () => {
    const entrada = montarSchema.parse({
      neumaticoId: U1,
      posicionId: U2,
      fecha: "2026-11-26",
      horometro: "1400",
      cocada: "18",
      clave: U3,
    });
    const r = await montarNeumatico(
      actor("TECNICO"),
      entrada,
      repos([]).r,
      AHORA,
    );
    expect(r.ok || r.error.message).toBe("fecha_futura");
  });

  it("recapar: el técnico no", async () => {
    const entrada = recaparSchema.parse({
      neumaticoId: U1,
      costo: "300",
      cocadaNueva: "16",
      clave: U3,
    });
    const r = await recaparNeumatico(actor("TECNICO"), entrada, repos([]).r);
    expect(r.ok || r.error.code).toBe("FORBIDDEN");
  });

  it("medir: por encima de la cocada nueva + 5 no", async () => {
    const entrada = medirSchema.parse({
      equipoId: "0190a1b2-0000-7000-8000-0000000000e1",
      fecha: "2026-11-25",
      horometro: "1400",
      mediciones: [
        {
          neumaticoId: U1,
          interno: "24",
          centro: "10",
          externo: "10",
          presion: "",
        },
      ],
      clave: U3,
    });
    const { r, llamadas } = repos([
      cubierta({
        montaje: montaje({ equipoId: "0190a1b2-0000-7000-8000-0000000000e1" }),
      }),
    ]);
    const x = await medirNeumaticos(actor("TECNICO"), entrada, r, AHORA);
    expect(x.ok || x.error.message).toBe("medicion_fuera_de_rango");
    expect(llamadas).toEqual([]);
  });

  it("posiciones desde texto: repetidas no llegan a la base", async () => {
    const { r, llamadas } = repos([]);
    const x = await definirPosiciones(
      actor("SUPERVISOR"),
      { equipoId: U1, layout: "A | A" },
      r,
    );
    expect(x.ok || x.error.message).toBe("posiciones_no_validas");
    expect(llamadas).toEqual([]);
  });
});

describe("esquemas", () => {
  it("cocada con coma, costo negativo y campo extra no", () => {
    const base = {
      id: "",
      codigo: "C-1",
      marca: "M",
      modelo: "",
      medida: "12R22.5",
      cocadaNueva: "18",
      costo: "",
      clave: U3,
    };
    expect(neumaticoSchema.safeParse(base).success).toBe(true);
    expect(
      neumaticoSchema.safeParse({ ...base, cocadaNueva: "18,5" }).success,
    ).toBe(false);
    expect(neumaticoSchema.safeParse({ ...base, costo: "-1" }).success).toBe(
      false,
    );
    expect(
      neumaticoSchema.safeParse({ ...base, cocadaNueva: "0" }).success,
    ).toBe(false);
    expect(neumaticoSchema.safeParse({ ...base, estado: "BAJA" }).success).toBe(
      false,
    );
  });

  it("umbrales: la alerta debe ser mayor que la mínima; quitar no pide valores", () => {
    const base = {
      destino: "equipo",
      destinoId: U1,
      quitar: "",
      cocadaMinima: "6",
      cocadaAlerta: "6",
      diasSinMedir: "30",
      diferenciaMaxima: "3",
    };
    expect(umbralesSchema.safeParse(base).success).toBe(false);
    const q = umbralesSchema.safeParse({
      ...base,
      quitar: "on",
      cocadaMinima: "",
    });
    expect(q.success && q.data.datos).toBeNull();
  });

  it("rotar a la misma posición no", () => {
    expect(
      rotarSchema.safeParse({
        origenId: U1,
        destinoId: U1,
        fecha: "2026-11-25",
        horometro: "1",
        clave: U3,
      }).success,
    ).toBe(false);
  });
});

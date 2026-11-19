import { readSheet } from "read-excel-file/node";
import { describe, expect, it } from "vitest";
import {
  backlogDesdeHallazgo,
  cerrarParada,
  exportarDiario,
  exportarMensual,
  importarParadas,
  iniciarParada,
  rankingParadas,
  reporteParadas,
} from "@/modules/paradas/application/casos-uso";
import {
  cerrarSchema,
  iniciarSchema,
  type CerrarEntrada,
  type IniciarEntrada,
} from "@/modules/paradas/application/esquemas";
import {
  filaDiario,
  hojasMensual,
  pdfDiario,
} from "@/modules/paradas/application/reportes";
import type {
  Parada,
  ParadaDetalle,
  ReposParadas,
} from "@/modules/paradas/application/repositorios";
import {
  ahoraEn,
  duracionHoras,
  esFechaHora,
} from "@/modules/paradas/domain/duracion";
import { prepararImportacion } from "@/modules/paradas/domain/importacion";
import { rankingFallas } from "@/modules/paradas/domain/ranking-fallas";
import {
  esPlanificado,
  generaEngrase,
} from "@/modules/paradas/domain/reglas-motivo";
import { revisarParada } from "@/modules/paradas/domain/revision-parada";
import { crearPdf, textoPdf } from "@/shared/exportar/pdf";
import { crearXlsx, neutralizar } from "@/shared/exportar/xlsx";
import type { Actor } from "@/shared/kernel/actor";
import { ok } from "@/shared/kernel/result";
import { jpg } from "../imagenes";

describe("duración y fecha-hora", () => {
  it("sin cruce, cruzando la medianoche y cruzando varios días", () => {
    expect(duracionHoras("2026-11-19T08:00", "2026-11-19T12:30")).toBe(4.5);
    expect(duracionHoras("2026-11-19T22:00", "2026-11-20T02:00")).toBe(4);
    expect(duracionHoras("2026-11-30T20:00", "2026-12-02T08:00")).toBe(36);
    expect(duracionHoras("2026-11-19T10:00", "2026-11-19T09:00")).toBe(-1);
  });
  it("valida fechas y horas imposibles", () => {
    expect(esFechaHora("2026-11-19T08:30")).toBe(true);
    expect(esFechaHora("2026-02-30T08:30")).toBe(false);
    expect(esFechaHora("2026-11-19T24:00")).toBe(false);
    expect(esFechaHora("2026-11-19 08:30")).toBe(false);
  });
  it("ahora en la zona de la empresa (Lima es UTC-5)", () => {
    expect(ahoraEn("America/Lima", new Date("2026-11-20T03:15:00Z"))).toBe(
      "2026-11-19T22:15",
    );
  });
});

describe("motivo", () => {
  it("MCI nunca es planificado; PM y engrase sí; engrase genera engrase", () => {
    expect(esPlanificado("MCI")).toBe(false);
    expect(esPlanificado("MCP")).toBe(false);
    expect(esPlanificado("PM2")).toBe(true);
    expect(esPlanificado("ENGRASE")).toBe(true);
    expect(generaEngrase("ENGRASE")).toBe(true);
    expect(generaEngrase("MCI")).toBe(false);
  });
});

describe("revisión de la parada", () => {
  const base = {
    id: "p",
    equipoId: "eq",
    motivo: "MCI",
    inicio: "2026-11-19T08:00",
    fin: "2026-11-19T10:00",
    horometroInicio: 100,
    horometroFin: 102,
  };
  const codigos = (a: ReturnType<typeof revisarParada>) =>
    a.map((x) => `${x.codigo}${x.bloquea ? "!" : ""}`);

  it("sin problemas no hay avisos", () => {
    expect(revisarParada(base, [])).toEqual([]);
  });
  it("salida igual o anterior a la parada bloquea", () => {
    expect(codigos(revisarParada({ ...base, fin: base.inicio }, []))).toEqual([
      "SALIDA_ANTES!",
    ]);
  });
  it("horómetro de salida menor bloquea", () => {
    expect(codigos(revisarParada({ ...base, horometroFin: 99 }, []))).toEqual([
      "HOROMETRO_BAJA!",
    ]);
  });
  it("duplicado (mismo equipo, motivo y hora) bloquea; otro motivo no es duplicado", () => {
    const otra = {
      id: "o",
      equipoId: "eq",
      motivo: "MCI",
      inicio: base.inicio,
      fin: null,
    };
    expect(codigos(revisarParada(base, [otra]))).toEqual([
      "DUPLICADO!",
      "CRUCE",
    ]);
    expect(codigos(revisarParada(base, [{ ...otra, motivo: "PM1" }]))).toEqual([
      "CRUCE",
    ]);
  });
  it("cruce: se avisa sin bloquear; otro equipo, contigua o la misma parada no cuentan", () => {
    const o = {
      id: "o",
      equipoId: "eq",
      motivo: "PM1",
      inicio: "2026-11-19T09:00",
      fin: "2026-11-19T11:00",
    };
    expect(codigos(revisarParada(base, [o]))).toEqual(["CRUCE"]);
    expect(revisarParada(base, [{ ...o, equipoId: "otro" }])).toEqual([]);
    expect(
      revisarParada(base, [
        { ...o, inicio: "2026-11-19T10:00", fin: "2026-11-19T12:00" },
      ]),
    ).toEqual([]);
    expect(revisarParada(base, [{ ...o, id: "p" }])).toEqual([]);
    // Abierta (sin fin) se cruza con todo lo posterior a su inicio.
    expect(
      codigos(
        revisarParada(base, [{ ...o, inicio: "2026-11-01T00:00", fin: null }]),
      ),
    ).toEqual(["CRUCE"]);
  });
  it("todas las que bloquean a la vez (un tramo inválido no se cruza)", () => {
    const otra = {
      id: "o",
      equipoId: "eq",
      motivo: "MCI",
      inicio: base.inicio,
      fin: null,
    };
    expect(
      codigos(
        revisarParada({ ...base, fin: "2026-11-19T07:00", horometroFin: 1 }, [
          otra,
        ]),
      ),
    ).toEqual(["SALIDA_ANTES!", "HOROMETRO_BAJA!", "DUPLICADO!"]);
  });
});

describe("ranking de fallas", () => {
  const p = (equipoId: string, inicio: string, plan = false, horas = 1) => ({
    equipoId,
    equipo: equipoId.toUpperCase(),
    esPlanificado: plan,
    inicio,
    duracionHoras: horas,
  });
  const periodo = { desde: "2026-11-01", hasta: "2026-11-30" };
  it("por cantidad de no planificadas, solo del periodo", () => {
    const r = rankingFallas(
      [
        p("b", "2026-11-02T08:00"),
        p("b", "2026-11-03T08:00"),
        p("a", "2026-11-04T08:00", false, 10),
        p("a", "2026-11-05T08:00", true, 50),
        p("c", "2026-10-31T23:59"),
        p("c", "2026-12-01T00:00"),
      ],
      periodo,
    );
    expect(r.map((x) => [x.equipo, x.fallas, x.horas])).toEqual([
      ["B", 2, 2],
      ["A", 1, 10],
    ]);
  });
  it("empates: más horas primero, luego código; equipos sin fallas al final con 0", () => {
    const r = rankingFallas(
      [
        p("z", "2026-11-02T08:00", false, 1),
        p("y", "2026-11-02T08:00", false, 1),
        p("x", "2026-11-02T08:00", false, 3),
      ],
      periodo,
      [
        { id: "w", codigo: "W" },
        { id: "y", codigo: "Y" },
      ],
    );
    expect(r.map((x) => `${x.equipo}:${x.fallas}`)).toEqual([
      "X:1",
      "Y:1",
      "Z:1",
      "W:0",
    ]);
  });
});

describe("importación Excel", () => {
  const enc = [
    "ID_IMPORTACION",
    "EQUIPO",
    "MOTIVO",
    "INICIO",
    "FIN",
    "HOROMETRO_INICIO",
    "HOROMETRO_FIN",
    "DESCRIPCION",
    "RESPONSABLE",
    "HALLAZGO",
  ];
  const fila = (id: string, extra: Partial<Record<number, unknown>> = {}) => {
    const f: unknown[] = [
      id,
      "EQ-1",
      "MCI",
      "2026-11-19 08:00",
      "19/11/2026 10:30",
      100,
      "102.5",
      "Cambio",
      "Tito Tec",
      "",
    ];
    for (const [i, v] of Object.entries(extra)) f[Number(i)] = v;
    return f;
  };
  it("acepta fechas en texto o Date de Excel y números", () => {
    const r = prepararImportacion(
      [
        enc,
        fila("A"),
        fila("B", {
          3: new Date("2026-11-18T22:00:00Z"),
          4: new Date("2026-11-19T02:00:00Z"),
        }),
      ],
      1000,
    );
    if (!r.ok) throw new Error(r.error);
    expect(r.errores).toEqual([]);
    expect(r.validas[0]).toMatchObject({
      inicio: "2026-11-19T08:00",
      fin: "2026-11-19T10:30",
      horometroFin: 102.5,
    });
    expect(r.validas[1]).toMatchObject({
      inicio: "2026-11-18T22:00",
      fin: "2026-11-19T02:00",
    });
  });
  it("fórmulas, fechas imposibles, salida antes, horómetro que baja e ID repetido: error por fila", () => {
    const r = prepararImportacion(
      [
        enc,
        fila("A"),
        fila("B", { 7: '=HYPERLINK("x")' }),
        fila("C", { 3: "31/02/2026 08:00" }),
        fila("D", { 4: "2026-11-19 07:00" }),
        fila("E", { 6: 50 }),
        fila("A"),
        fila("F", { 6: "1,500" }),
        ["", "", ""],
      ],
      1000,
    );
    if (!r.ok) throw new Error(r.error);
    expect(r.validas.map((v) => v.idImportacion)).toEqual(["A"]);
    expect(r.errores.map((e) => e.fila)).toEqual([3, 4, 5, 6, 7, 8]);
    expect(r.errores[0].motivo).toMatch(/fórmula/);
    expect(r.errores[4].motivo).toMatch(/repite/);
  });
  it("sin columnas, vacío o demasiadas filas se rechaza entero", () => {
    expect(prepararImportacion([["EQUIPO"], ["x"]], 1000)).toEqual({
      ok: false,
      error: "COLUMNAS",
    });
    expect(prepararImportacion([enc], 1000)).toEqual({
      ok: false,
      error: "VACIO",
    });
    expect(prepararImportacion([enc, fila("A"), fila("B")], 1)).toEqual({
      ok: false,
      error: "DEMASIADAS_FILAS",
    });
  });
});

const parada = (extra: Partial<Parada> = {}): Parada => ({
  id: "0190a1b2-0000-7000-8000-000000000001",
  codigo: "ST-000001",
  equipoId: "eq",
  equipo: "EQ-1",
  motivoCodigo: "MCI",
  motivo: "Correctivo inmediato",
  esPlanificado: false,
  inicio: "2026-11-19T08:00",
  fin: "2026-11-19T10:00",
  duracionHoras: 2,
  horometroInicio: 100,
  horometroFin: 102,
  responsableId: null,
  responsable: "Taller (Pérez) & Hijos",
  descripcion: "=SUMA(A1) cambio de manguera",
  hallazgo: null,
  areaDemora: null,
  areaParada: "Mecánica",
  estado: "CERRADA",
  cruceConfirmado: false,
  backlog: null,
  ...extra,
});

describe("exportación: mismas filas que la consulta", () => {
  const filas = [
    parada(),
    parada({
      id: "2",
      codigo: "ST-000002",
      equipo: "EQ-2",
      equipoId: "eq2",
      motivoCodigo: "PM1",
      esPlanificado: true,
      estado: "ABIERTA",
      fin: null,
      duracionHoras: null,
      horometroFin: null,
      descripcion: null,
    }),
  ];

  it("Excel: neutraliza fórmulas y se relee con el mismo contenido", async () => {
    expect(neutralizar("=1+1")).toBe("'=1+1");
    expect(neutralizar("@x")).toBe("'@x");
    expect(neutralizar("normal")).toBe("normal");
    const hojas = hojasMensual("2026-11", filas);
    const bytes = crearXlsx(hojas);
    const detalle = await readSheet(Buffer.from(bytes), 2);
    expect(detalle.length).toBe(filas.length + 1);
    expect(detalle.map((f) => f[0])).toEqual([
      "Código",
      "ST-000001",
      "ST-000002",
    ]);
    expect(detalle[1][11]).toBe("'=SUMA(A1) cambio de manguera");
    expect(detalle[1][7]).toBe(2);
    const resumen = await readSheet(Buffer.from(bytes), 1);
    expect(resumen.slice(1).map((f) => [f[0], f[1], f[3], f[5]])).toEqual([
      ["EQ-1", 1, 1, 1],
      ["EQ-2", 1, 0, null],
    ]);
  });

  it("PDF: cada fila del reporte está en el archivo, con el texto escapado", () => {
    const tabla = pdfDiario("Minera <Sur>", "2026-11-19", filas);
    expect(tabla.filas).toEqual(filas.map(filaDiario));
    const pdf = Buffer.from(crearPdf(tabla)).toString("latin1");
    expect(pdf.startsWith("%PDF-1.4")).toBe(true);
    expect(pdf.trimEnd().endsWith("%%EOF")).toBe(true);
    for (const f of tabla.filas) {
      expect(pdf).toContain(textoPdf(f[0]));
      expect(pdf).toContain(textoPdf(f[1]));
    }
    // Paréntesis escapados: el texto no rompe la estructura del PDF.
    expect(pdf).toContain("(Taller \\(Pérez\\) & Hijos)".replace("é", "\xe9"));
    expect(pdf).toContain("Minera <Sur>");
  });

  it("PDF con muchas filas: varias páginas y el xref apunta a cada objeto", () => {
    const muchas = Array.from({ length: 120 }, (_, i) =>
      parada({ id: String(i), codigo: `ST-${String(i).padStart(6, "0")}` }),
    );
    const pdf = Buffer.from(
      crearPdf(pdfDiario("X", "2026-11-19", muchas)),
    ).toString("latin1");
    const paginas = Number(/\/Count (\d+)/.exec(pdf)![1]);
    expect(paginas).toBeGreaterThan(2);
    const xref = Number(/startxref\n(\d+)/.exec(pdf)![1]);
    expect(pdf.slice(xref, xref + 4)).toBe("xref");
    const offsets = [...pdf.slice(xref).matchAll(/^(\d{10}) 00000 n $/gm)].map(
      (m) => Number(m[1]),
    );
    offsets.forEach((o, i) =>
      expect(pdf.slice(o).startsWith(`${i + 1} 0 obj`)).toBe(true),
    );
    expect(pdf).toContain(textoPdf("ST-000119"));
  });
});

const A = "0190a1b2-0000-7000-8000-00000000000a";
const UUID = "0190a1b2-0000-7000-8000-000000000001";
const AHORA = new Date("2026-11-19T17:00:00Z"); // 12:00 en Lima

const actor = (rol: string): Actor => ({
  id: `u-${rol}`,
  email: "x@a.pe",
  rol,
  empresaId: A,
  personaId: `p-${rol}`,
  habilitado: true,
  motivo: null,
  debeCambiarClave: false,
});

function repos(
  opciones: { otras?: Parada[]; detalle?: ParadaDetalle | null } = {},
) {
  const llamadas: string[] = [];
  const filtros: unknown[] = [];
  const r: ReposParadas = {
    lector: {
      reporte: async (f) => {
        filtros.push(f);
        return opciones.otras ?? [];
      },
      obtener: async () => opciones.detalle ?? null,
      opciones: async () => ({
        equipos: [
          { id: "eq", codigo: "EQ-1", movilizado: true, horometro: 100 },
        ],
        motivos: [
          {
            id: "m-mci",
            codigo: "MCI",
            nombre: "Correctivo",
            esPlanificado: false,
          },
        ],
        areas: [],
        personas: [],
      }),
      nombreEmpresa: async () => "Minera Sur",
    },
    paradas: {
      iniciar: async (_d, fotos, confirmar) => {
        llamadas.push(`iniciar:${fotos.length}:${confirmar}`);
        return ok({ id: UUID });
      },
      cerrar: async (_id, _d, _f, confirmar) => {
        llamadas.push(`cerrar:${confirmar}`);
        return ok(undefined);
      },
      importar: async (filas) =>
        ok([
          {
            fila: filas[0].fila,
            accion: "CREADO" as const,
            cruce: true,
            backlog: true,
          },
          { fila: filas[1].fila, accion: "OMITIDO" as const },
        ]),
    },
    trabajos: {
      lector: {
        listar: async () => [],
        obtener: async () => null,
        opciones: async () => ({ equipos: [], sistemas: [] }),
        responsables: async () => [],
        empresa: async () => ({
          planificadorPuedeValidar: false,
          zonaHoraria: "America/Lima",
        }),
        miFirma: async () => null,
      },
      trabajos: {
        subirImagen: async (_e, carpeta) => {
          llamadas.push(`subir:${carpeta}`);
          return ok(`${A}/${carpeta}/x.jpg`);
        },
        crear: async (datos, _f, clave) => {
          llamadas.push(
            `backlog:${clave}:${datos.paradaId}:${datos.fechaObservacion}`,
          );
          return ok({ id: "bk" });
        },
        editar: async () => ok(undefined),
        abrirOt: async () => ok(undefined),
        crearRequisicion: async () => ok(undefined),
        cambiarRequisicion: async () => ok(undefined),
        cerrar: async () => ok(undefined),
        validar: async () => ok(undefined),
        reabrir: async () => ok(undefined),
        guardarFirma: async () => ok(undefined),
      },
    },
    excel: {
      leer: async () =>
        ok([
          [
            "ID_IMPORTACION",
            "EQUIPO",
            "MOTIVO",
            "INICIO",
            "FIN",
            "HOROMETRO_INICIO",
            "HOROMETRO_FIN",
            "DESCRIPCION",
            "RESPONSABLE",
          ],
          [
            "A",
            "EQ-1",
            "MCI",
            "2026-11-19 08:00",
            "2026-11-19 09:00",
            1,
            2,
            "x",
            "Tito",
          ],
          [
            "B",
            "EQ-1",
            "MCI",
            "2026-11-18 08:00",
            "2026-11-18 09:00",
            1,
            2,
            "x",
            "Tito",
          ],
          [
            "C",
            "EQ-1",
            "MCI",
            "2026-11-18 08:00",
            "2026-11-18 07:00",
            1,
            2,
            "x",
            "Tito",
          ],
        ]),
    },
  };
  return { r, llamadas, filtros };
}

const inicio = (extra: Partial<IniciarEntrada> = {}): IniciarEntrada => ({
  ...iniciarSchema.parse({
    equipoId: UUID,
    motivoId: UUID,
    inicio: "2026-11-19T08:00",
    horometroInicio: "100",
    responsableId: "",
    responsableExterno: "Taller X",
    clave: UUID,
  }),
  equipoId: "eq",
  motivoId: "m-mci",
  ...extra,
});

describe("casos de uso", () => {
  it("iniciar: no en el futuro; el cruce se pide confirmar; confirmado sube fotos a paradas", async () => {
    const { r, llamadas } = repos({
      otras: [
        parada({
          estado: "ABIERTA",
          fin: null,
          motivoCodigo: "PM1",
          inicio: "2026-11-19T06:00",
        }),
      ],
    });
    const f = await iniciarParada(
      actor("TECNICO"),
      inicio({ inicio: "2026-11-19T12:01" }),
      [],
      r,
      AHORA,
    );
    expect(f.ok || f.error.message).toBe("fecha_futura");
    const c = await iniciarParada(actor("TECNICO"), inicio(), [], r, AHORA);
    expect(c.ok || c.error.message).toBe("cruce");
    const s = await iniciarParada(
      actor("TECNICO"),
      inicio({ confirmarCruce: true }),
      [jpg(640, 480)],
      r,
      AHORA,
    );
    expect(s.ok).toBe(true);
    expect(llamadas).toEqual(["subir:paradas", "iniciar:1:true"]);
  });

  it("iniciar: duplicado bloquea aunque se confirme; el gerente no registra", async () => {
    const { r } = repos({
      otras: [parada({ inicio: "2026-11-19T08:00", fin: "2026-11-19T09:00" })],
    });
    const d = await iniciarParada(
      actor("SUPERVISOR"),
      inicio({ confirmarCruce: true }),
      [],
      r,
      AHORA,
    );
    expect(d.ok || d.error.message).toBe("duplicado");
    const g = await iniciarParada(actor("GERENTE"), inicio(), [], r, AHORA);
    expect(g.ok || g.error.code).toBe("FORBIDDEN");
  });

  const cierre = (extra: Partial<CerrarEntrada> = {}): CerrarEntrada => ({
    ...cerrarSchema.parse({
      paradaId: UUID,
      fin: "2026-11-19T11:00",
      horometroFin: "104",
      descripcion: "Cambio",
      areaDemoraId: "",
      areaParadaId: "",
      hallazgo: "",
      clave: UUID,
    }),
    ...extra,
  });
  const abierta: ParadaDetalle = {
    ...parada({
      estado: "ABIERTA",
      fin: null,
      duracionHoras: null,
      horometroFin: null,
    }),
    fotos: [],
  };

  it("cerrar: salida antes y horómetro que baja bloquean; ya cerrada es conflicto", async () => {
    const { r, llamadas } = repos({ detalle: abierta });
    const a = await cerrarParada(
      actor("TECNICO"),
      cierre({ fin: "2026-11-19T07:00" }),
      [],
      r,
      AHORA,
    );
    expect(a.ok || a.error.message).toBe("salida_antes");
    const b = await cerrarParada(
      actor("TECNICO"),
      cierre({ horometroFin: 99 }),
      [],
      r,
      AHORA,
    );
    expect(b.ok || b.error.message).toBe("horometro_baja");
    expect(
      (await cerrarParada(actor("TECNICO"), cierre(), [], r, AHORA)).ok,
    ).toBe(true);
    expect(llamadas).toEqual(["cerrar:false"]);
    const c = await cerrarParada(
      actor("TECNICO"),
      cierre(),
      [],
      repos({ detalle: { ...abierta, estado: "CERRADA" } }).r,
      AHORA,
    );
    expect(c.ok || c.error.code).toBe("CONFLICT");
  });

  it("cerrar: máximo 5 fotos entre todas", async () => {
    const llena = {
      ...abierta,
      fotos: Array.from({ length: 5 }, (_, i) => ({
        id: String(i),
        url: null,
      })),
    };
    const x = await cerrarParada(
      actor("TECNICO"),
      cierre(),
      [jpg(640, 480)],
      repos({ detalle: llena }).r,
      AHORA,
    );
    expect(x.ok || x.error.message).toBe("fotos_maximo");
  });

  it("backlog desde hallazgo: clave = id de la parada, observado el día de la salida", async () => {
    const conHallazgo = {
      ...parada({ hallazgo: "Abrazadera rota" }),
      fotos: [],
    };
    const { r, llamadas } = repos({ detalle: conHallazgo });
    const x = await backlogDesdeHallazgo(
      actor("TECNICO"),
      { paradaId: UUID, componente: "Abrazadera", criticidad: "ALTA" },
      r,
      AHORA,
    );
    expect(x.ok).toBe(true);
    expect(llamadas).toEqual([
      `backlog:${conHallazgo.id}:${conHallazgo.id}:2026-11-19`,
    ]);
    const sin = await backlogDesdeHallazgo(
      actor("TECNICO"),
      { paradaId: UUID, componente: "x", criticidad: "ALTA" },
      repos({ detalle: { ...parada(), fotos: [] } }).r,
      AHORA,
    );
    expect(sin.ok || sin.error.message).toBe("parada_no_valida");
  });

  it("importar: resume creadas, ya importadas, cruces, backlogs y errores; el técnico no importa", async () => {
    const xlsx = crearXlsx([{ nombre: "x", filas: [["a"]] }]);
    const { r } = repos();
    const x = await importarParadas(actor("PLANIFICADOR"), xlsx, r);
    expect(x.ok && x.value).toEqual({
      creadas: 1,
      repetidas: 1,
      conCruce: 1,
      backlogs: 1,
      errores: [
        { fila: 4, motivo: "La salida debe ser posterior a la parada." },
      ],
    });
    const t = await importarParadas(actor("TECNICO"), xlsx, r);
    expect(t.ok || t.error.code).toBe("FORBIDDEN");
    const n = await importarParadas(
      actor("PLANIFICADOR"),
      new Uint8Array([1, 2, 3, 4, 5]),
      r,
    );
    expect(n.ok || n.error.message).toBe("NO_XLSX");
  });

  it("reportes: rango máximo de 366 días; ranking y exportaciones usan la misma consulta", async () => {
    const { r, filtros } = repos({ otras: [parada()] });
    const largo = await reporteParadas(
      actor("GERENTE"),
      { desde: "2025-01-01", hasta: "2026-11-19" },
      r,
    );
    expect(largo.ok || largo.error.message).toBe("rango_no_valido");
    const rk = await rankingParadas(
      actor("GERENTE"),
      { desde: "2026-11-01", hasta: "2026-11-30" },
      r,
    );
    expect(rk.ok && rk.value).toEqual([
      { equipoId: "eq", equipo: "EQ-1", fallas: 1, horas: 2 },
    ]);
    const pdf = await exportarDiario(actor("GERENTE"), "2026-11-19", r);
    expect(pdf.ok && pdf.value.nombre).toBe("paradas-2026-11-19.pdf");
    const xl = await exportarMensual(actor("GERENTE"), "2026-02", r);
    expect(xl.ok && xl.value.nombre).toBe("paradas-2026-02.xlsx");
    expect(filtros).toEqual([
      { desde: "2026-11-01", hasta: "2026-11-30" },
      { desde: "2026-11-19", hasta: "2026-11-19" },
      { desde: "2026-02-01", hasta: "2026-02-28" },
    ]);
    const sin = await exportarDiario(null, "2026-11-19", r);
    expect(sin.ok || sin.error.code).toBe("UNAUTHENTICATED");
  });
});

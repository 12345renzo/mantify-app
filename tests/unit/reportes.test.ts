import { describe, expect, it } from "vitest";
import {
  mesDe,
  obtenerDashboard,
} from "@/modules/reportes/application/obtener-dashboard";
import {
  exportarJsonEmpresa,
  exportarRespaldo,
  hojasModulo,
  tablaOrden,
} from "@/modules/reportes/application/exportar";
import { permitir } from "@/modules/reportes/application/limite-frecuencia";
import { armarBandeja } from "@/modules/reportes/domain/bandeja";
import {
  ordenarBandeja,
  type ItemBandeja,
} from "@/modules/reportes/domain/orden-bandeja";
import {
  backlogsPorCriticidad,
  enMes,
  horasDeTrabajo,
  resumenEngrase,
  resumenFlota,
  resumenNeumaticos,
  resumenOT,
  resumenPreventivos,
  trabajosPorTecnico,
} from "@/modules/reportes/domain/indicadores";

const HOY = "2026-11-26";

const item = (p: Partial<ItemBandeja> & { codigo: string }): ItemBandeja => ({
  tipo: "BACKLOG",
  criticidad: "MEDIA",
  atrasoDias: 0,
  devuelto: false,
  ...p,
});

describe("ordenarBandeja", () => {
  it("devueltos primero, luego criticidad, luego más atraso", () => {
    const r = ordenarBandeja([
      item({ codigo: "A", criticidad: "BAJA", atrasoDias: 30 }),
      item({ codigo: "B", criticidad: "ALTA", atrasoDias: 1 }),
      item({ codigo: "C", criticidad: "BAJA", devuelto: true }),
      item({ codigo: "D", criticidad: "ALTA", atrasoDias: 5 }),
      item({ codigo: "E", criticidad: null, atrasoDias: 99 }),
    ]);
    expect(r.map((i) => i.codigo)).toEqual(["C", "D", "B", "A", "E"]);
  });

  it("empate total de criticidad y atraso: desempate fijo por tipo y luego código", () => {
    const entrada = [
      item({ codigo: "Z", tipo: "NEUMATICO" }),
      item({ codigo: "B", tipo: "BACKLOG" }),
      item({ codigo: "A", tipo: "BACKLOG" }),
      item({ codigo: "Y", tipo: "PARADA" }),
      item({ codigo: "X", tipo: "VALIDACION" }),
    ];
    const esperado = ["Y", "X", "A", "B", "Z"];
    expect(ordenarBandeja(entrada).map((i) => i.codigo)).toEqual(esperado);
    // La misma entrada en otro orden da el mismo resultado.
    expect(ordenarBandeja([...entrada].reverse()).map((i) => i.codigo)).toEqual(
      esperado,
    );
  });

  it("no modifica la lista original", () => {
    const entrada = [item({ codigo: "B" }), item({ codigo: "A" })];
    ordenarBandeja(entrada);
    expect(entrada.map((i) => i.codigo)).toEqual(["B", "A"]);
  });
});

describe("enMes", () => {
  it("acepta fechas y fechas con hora del mes, rechaza las demás y nulos", () => {
    expect(enMes("2026-11-01", "2026-11")).toBe(true);
    expect(enMes("2026-11-30T23:00:00-05:00", "2026-11")).toBe(true);
    expect(enMes("2026-10-31", "2026-11")).toBe(false);
    expect(enMes(null, "2026-11")).toBe(false);
  });
});

describe("resumenPreventivos", () => {
  const base = {
    horometroProgramado: null,
    horometroActual: null,
    ejecutadoEn: null,
  };
  it("cuenta vencidos, por vencer, ejecutados y reprogramados del mes", () => {
    const r = resumenPreventivos(
      [
        { ...base, estado: "PROGRAMADO", fechaProgramada: "2026-11-20" }, // vencido
        { ...base, estado: "PROGRAMADO", fechaProgramada: "2026-11-30" }, // alerta (4 días)
        { ...base, estado: "PROGRAMADO", fechaProgramada: "2026-12-30" }, // al día
        {
          ...base,
          estado: "PROGRAMADO",
          fechaProgramada: "2026-12-30",
          horometroProgramado: 1000,
          horometroActual: 980,
        }, // alerta por horómetro
        {
          ...base,
          estado: "COMPLETADO",
          fechaProgramada: "2026-11-02",
          ejecutadoEn: "2026-11-03T08:00:00-05:00",
        },
        {
          ...base,
          estado: "VALIDADO",
          fechaProgramada: "2026-10-02",
          ejecutadoEn: "2026-10-03T08:00:00-05:00",
        }, // de otro mes
      ],
      3,
      HOY,
    );
    expect(r).toEqual({
      vencidos: 1,
      porVencer: 2,
      ejecutados: 1,
      reprogramados: 3,
    });
  });
});

describe("backlogsPorCriticidad", () => {
  it("solo cuenta los que no están completados", () => {
    expect(
      backlogsPorCriticidad([
        { estado: "PENDIENTE", criticidad: "ALTA" },
        { estado: "EN_PROCESO", criticidad: "ALTA" },
        { estado: "PENDIENTE_VALIDACION", criticidad: "BAJA" },
        { estado: "COMPLETADO", criticidad: "ALTA" },
      ]),
    ).toEqual({ ALTA: 2, MEDIA: 0, BAJA: 1, total: 3 });
  });
});

describe("resumenFlota", () => {
  it("cuenta por movilización y los operativos", () => {
    expect(
      resumenFlota([
        { estadoMovilizacion: "MOVILIZADO", estadoOperativo: "OPERATIVO" },
        {
          estadoMovilizacion: "MOVILIZADO",
          estadoOperativo: "EN_MANTENIMIENTO",
        },
        { estadoMovilizacion: "DESMOVILIZADO", estadoOperativo: "OPERATIVO" },
        { estadoMovilizacion: "PENDIENTE", estadoOperativo: "INOPERATIVO" },
      ]),
    ).toEqual({
      movilizados: 2,
      desmovilizados: 1,
      pendientes: 1,
      operativos: 2,
      total: 4,
    });
  });
});

describe("resumenOT", () => {
  it("pendientes, vencidas (abiertas con fecha pasada) y cerradas del mes", () => {
    expect(
      resumenOT(
        [
          { estado: "ABIERTA", fechaProgramada: "2026-11-30", cerradaEn: null },
          { estado: "ABIERTA", fechaProgramada: "2026-11-10", cerradaEn: null },
          {
            estado: "CERRADA",
            fechaProgramada: "2026-11-01",
            cerradaEn: "2026-11-05T10:00:00-05:00",
          },
          {
            estado: "CERRADA",
            fechaProgramada: "2026-10-01",
            cerradaEn: "2026-10-05T10:00:00-05:00",
          },
        ],
        HOY,
      ),
    ).toEqual({ pendientes: 2, vencidas: 1, cerradas: 1 });
  });
});

describe("trabajosPorTecnico", () => {
  it("agrupa por técnico y estado, ordenado por nombre", () => {
    expect(
      trabajosPorTecnico([
        { tecnico: "Rosa", estado: "EN_PROCESO", devuelto: false },
        { tecnico: "Ana", estado: "EN_PROCESO", devuelto: true },
        { tecnico: "Rosa", estado: "PENDIENTE_VALIDACION", devuelto: false },
        { tecnico: "Rosa", estado: "EN_PROCESO", devuelto: false },
      ]),
    ).toEqual([
      { tecnico: "Ana", enProceso: 0, devueltos: 1, porValidar: 0, total: 1 },
      { tecnico: "Rosa", enProceso: 2, devueltos: 0, porValidar: 1, total: 3 },
    ]);
  });
});

describe("horasDeTrabajo", () => {
  it("suma las horas de paradas cerradas por equipo, de mayor a menor, y el total", () => {
    expect(
      horasDeTrabajo([
        { equipo: "VOL-01", duracionHoras: 2.5 },
        { equipo: "EXC-02", duracionHoras: 10 },
        { equipo: "VOL-01", duracionHoras: 1.25 },
        { equipo: "EXC-02", duracionHoras: null },
      ]),
    ).toEqual({
      total: 13.75,
      porEquipo: [
        { equipo: "EXC-02", horas: 10 },
        { equipo: "VOL-01", horas: 3.75 },
      ],
    });
  });
  it("sin paradas: total 0 y lista vacía", () => {
    expect(horasDeTrabajo([])).toEqual({ total: 0, porEquipo: [] });
  });
});

describe("resumenEngrase", () => {
  it("al día, por vencer y vencidos; sin plan y sin registro aparte", () => {
    expect(
      resumenEngrase([
        "AL_DIA",
        "AL_DIA",
        "POR_VENCER",
        "VENCIDO",
        "SIN_REGISTRO",
        "SIN_PLAN",
      ]),
    ).toEqual({
      alDia: 2,
      porVencer: 1,
      vencidos: 1,
      sinRegistro: 1,
      sinPlan: 1,
    });
  });
});

describe("resumenNeumaticos", () => {
  it("cuenta por salud, con todas las claves aunque sean cero", () => {
    expect(resumenNeumaticos(["CAMBIAR", "OK", "OK", "MEDIR"])).toEqual({
      CAMBIAR: 1,
      ALERTA: 0,
      MEDIR: 1,
      OK: 2,
      SIN_UMBRAL: 0,
    });
  });
});

describe("armarBandeja", () => {
  const datos = {
    backlogs: [
      {
        id: "b1",
        codigo: "BKL-1",
        equipo: "E1",
        criticidad: "BAJA" as const,
        estado: "PENDIENTE" as const,
        fecha_programada: "2026-11-20",
        devuelto: false,
        tecnico: null,
      },
      {
        id: "b2",
        codigo: "BKL-2",
        equipo: "E1",
        criticidad: "MEDIA" as const,
        estado: "EN_PROCESO" as const,
        fecha_programada: "2026-11-30",
        devuelto: true,
        tecnico: "Rosa",
      },
      {
        id: "b3",
        codigo: "BKL-3",
        equipo: "E2",
        criticidad: "ALTA" as const,
        estado: "PENDIENTE_VALIDACION" as const,
        fecha_programada: "2026-11-01",
        devuelto: false,
        tecnico: "Rosa",
      },
    ],
    preventivos: [
      {
        id: "p1",
        codigo: "PM-1",
        equipo: "E1",
        estado: "PROGRAMADO" as const,
        fecha_programada: "2026-11-21",
        horometro_programado: null,
        horometro_actual: null,
        ejecutado_en: null,
      },
      {
        id: "p2",
        codigo: "PM-2",
        equipo: "E1",
        estado: "PROGRAMADO" as const,
        fecha_programada: "2027-01-30",
        horometro_programado: null,
        horometro_actual: null,
        ejecutado_en: null,
      },
      {
        id: "p3",
        codigo: "PM-3",
        equipo: "E2",
        estado: "DEVUELTO" as const,
        fecha_programada: "2026-11-25",
        horometro_programado: null,
        horometro_actual: null,
        ejecutado_en: "2026-11-25",
      },
      {
        id: "p4",
        codigo: "PM-4",
        equipo: "E2",
        estado: "COMPLETADO" as const,
        fecha_programada: "2026-11-24",
        horometro_programado: null,
        horometro_actual: null,
        ejecutado_en: "2026-11-24",
      },
    ],
    paradas_abiertas: [
      { id: "s1", codigo: "ST-1", equipo: "E2", inicio: "2026-11-24" },
    ],
  };
  const engrase = [
    { id: "e1", codigo: "E1", estado: "VENCIDO" as const, restanteDias: -4 },
    { id: "e2", codigo: "E2", estado: "AL_DIA" as const, restanteDias: 20 },
  ];
  const neumaticos = [
    { id: "n1", codigo: "C-1", salud: "CAMBIAR" as const },
    { id: "n2", codigo: "C-2", salud: "OK" as const },
    { id: "n3", codigo: "C-3", salud: null },
  ];

  it("planificador: todo lo pendiente, ordenado, con enlace a su módulo", () => {
    const r = armarBandeja({ ...datos, engrase, neumaticos }, HOY, {
      validaciones: true,
    });
    expect(r.map((i) => `${i.tipo}:${i.codigo}`)).toEqual([
      "BACKLOG:BKL-2", // devuelto
      "PREVENTIVO:PM-3", // devuelto
      "PARADA:ST-1", // ALTA, 2 días
      "VALIDACION:BKL-3", // ALTA, sin atraso; empata con C-1 y gana por tipo
      "NEUMATICO:C-1", // ALTA, sin atraso
      "BACKLOG:BKL-1", // BAJA, 6 días
      "PREVENTIVO:PM-1", // sin criticidad, 5 días (vencido)
      "ENGRASE:E1", // sin criticidad, 4 días
      "VALIDACION:PM-4",
    ]);
    expect(r.find((i) => i.codigo === "ST-1")?.href).toBe("/paradas/s1");
    expect(r.find((i) => i.codigo === "PM-4")?.href).toBe("/preventivos/p4");
    expect(r.find((i) => i.codigo === "E1")?.href).toBe("/engrase/e1");
  });

  it("sin validaciones (técnico): no las incluye; lo al día no entra", () => {
    const r = armarBandeja({ ...datos, engrase: [], neumaticos: [] }, HOY, {
      validaciones: false,
    });
    expect(r.some((i) => i.tipo === "VALIDACION")).toBe(false);
    expect(r.some((i) => i.codigo === "PM-2")).toBe(false);
  });
});

describe("mesDe", () => {
  it("del día 1 al último, también en febrero bisiesto", () => {
    expect(mesDe("2026-11-26")).toEqual({
      desde: "2026-11-01",
      hasta: "2026-11-30",
    });
    expect(mesDe("2028-02-10")).toEqual({
      desde: "2028-02-01",
      hasta: "2028-02-29",
    });
  });
});

describe("obtenerDashboard por rol", () => {
  const actor = (rol: string) => ({
    id: "u",
    email: "u@a.pe",
    rol,
    empresaId: rol === "SUPERADMIN" ? null : "emp",
    personaId: "p",
    habilitado: true,
    motivo: null,
    debeCambiarClave: false,
  });
  const datos = {
    backlogs: [
      {
        id: "b1",
        codigo: "BKL-1",
        equipo: "E1",
        criticidad: "ALTA" as const,
        estado: "PENDIENTE_VALIDACION" as const,
        fecha_programada: "2026-11-20",
        devuelto: false,
        tecnico: "Rosa",
      },
    ],
    ots: [],
    preventivos: [],
    reprogramados: 0,
    equipos: [
      { estado_movilizacion: "MOVILIZADO", estado_operativo: "OPERATIVO" },
    ],
    paradas_abiertas: [],
    paradas_cerradas: [],
  };
  const llamadas: string[] = [];
  const repos = {
    lector: {
      zonaHoraria: async () => "America/Lima",
      datos: async () => datos,
    },
    fuentes: {
      engrase: async () => (llamadas.push("engrase"), []),
      neumaticos: async () => (llamadas.push("neumaticos"), []),
      ranking: async () => (llamadas.push("ranking"), []),
    },
  };
  const ahora = new Date("2026-11-26T15:00:00Z");

  it("superadmin y sin sesión: no hay dashboard", async () => {
    const r = await obtenerDashboard(actor("SUPERADMIN"), repos, ahora);
    expect(!r.ok && r.error.code).toBe("FORBIDDEN");
    const s = await obtenerDashboard(null, repos, ahora);
    expect(!s.ok && s.error.code).toBe("UNAUTHENTICATED");
  });

  it("gerente: solo flota, sin leer los otros módulos", async () => {
    llamadas.length = 0;
    const r = await obtenerDashboard(actor("GERENTE"), repos, ahora);
    expect(r.ok && r.value.tipo).toBe("GERENTE");
    expect(r.ok && r.value.tipo === "GERENTE" && r.value.flota.total).toBe(1);
    expect(llamadas).toEqual([]);
  });

  it("técnico: sus trabajos y su bandeja sin validaciones", async () => {
    const r = await obtenerDashboard(actor("TECNICO"), repos, ahora);
    expect(r.ok && r.value.tipo).toBe("TECNICO");
    if (r.ok && r.value.tipo === "TECNICO") {
      expect(r.value.trabajos).toHaveLength(1);
      expect(r.value.bandeja.some((i) => i.tipo === "VALIDACION")).toBe(false);
    }
  });

  it("supervisor: cola de validaciones; planificador: sin ella", async () => {
    const sup = await obtenerDashboard(actor("SUPERVISOR"), repos, ahora);
    const plan = await obtenerDashboard(actor("PLANIFICADOR"), repos, ahora);
    expect(
      sup.ok && sup.value.tipo === "GESTION" && sup.value.validaciones,
    ).toEqual({ trabajos: 1, preventivos: 0 });
    expect(
      plan.ok && plan.value.tipo === "GESTION" && plan.value.validaciones,
    ).toBe(null);
    expect(
      plan.ok && plan.value.tipo === "GESTION" && plan.value.periodo,
    ).toEqual({ desde: "2026-11-01", hasta: "2026-11-30" });
  });
});

describe("límite de frecuencia", () => {
  it("deja 3 en un minuto, corta la cuarta y vuelve a dejar pasado el minuto", () => {
    const t0 = 1_000_000;
    let h: number[] = [];
    for (let i = 0; i < 3; i++) {
      const r = permitir(h, t0 + i * 1000);
      expect(r.ok).toBe(true);
      h = r.historial;
    }
    expect(permitir(h, t0 + 5000).ok).toBe(false);
    expect(permitir(h, t0 + 60_001).ok).toBe(true);
  });
});

describe("hojas de Excel por módulo", () => {
  it("trabajos: encabezado + una fila por backlog, con etiquetas legibles", () => {
    const [hoja] = hojasModulo("trabajos", [
      {
        id: "1",
        codigo: "BKL-1",
        equipo: "E1",
        componente: "=SUMA(A1)",
        criticidad: "ALTA",
        estado: "EN_PROCESO",
        fechaProgramada: "2026-11-20",
      },
    ] as never);
    expect(hoja.nombre).toBe("Trabajos");
    expect(hoja.filas).toHaveLength(2);
    expect(hoja.filas[1]).toEqual([
      "BKL-1",
      "E1",
      "=SUMA(A1)",
      "Alta",
      "En proceso",
      "2026-11-20",
    ]);
  });
  it("neumáticos: el costo por hora va vacío si el rol no lo ve (null)", () => {
    const [hoja] = hojasModulo("neumaticos", [
      {
        codigo: "C-1",
        marca: "M",
        medida: "12R",
        estado: "MONTADO",
        montaje: { equipoCodigo: "E1", posicionCodigo: "DEL-I" },
        cocadaActual: 9,
        salud: "OK",
        costoPorHora: null,
      },
    ] as never);
    expect(hoja.filas[1]).toEqual([
      "C-1",
      "M",
      "12R",
      "Montado",
      "E1",
      "DEL-I",
      9,
      "OK",
      null,
    ]);
  });
  it("no pasa de 5000 filas de datos", () => {
    const filas = Array.from({ length: 5100 }, (_, i) => ({
      codigo: `E${i}`,
      marca: null,
      modelo: null,
      categoria: "C",
      ubicacion: null,
      estadoMovilizacion: "MOVILIZADO",
      estadoOperativo: "OPERATIVO",
      horometroActual: 1,
    }));
    const [hoja] = hojasModulo("equipos", filas as never);
    expect(hoja.filas).toHaveLength(5001);
  });
});

describe("PDF de la OT", () => {
  it("trae datos, RM, requisiciones, historial y firmas como texto", () => {
    const t = tablaOrden(
      {
        codigo: "BKL-9",
        equipo: "E1",
        componente: "Bomba",
        criticidad: "ALTA",
        estado: "PENDIENTE_VALIDACION",
        fechaProgramada: "2026-11-20",
        descripcion: "Fuga",
        ot: { codigo: "OT-2026-001", responsable: "Rosa" },
        rm: {
          codigo: "RM-2026-001",
          fecha: "2026-11-21",
          horometro: 1200,
          notas: "Cambio",
        },
        requisiciones: [
          {
            codigo: "RQ-1",
            descripcion: "Sello",
            cantidad: 2,
            unidad: "u",
            estado: "ENTREGADA",
          },
        ],
        historial: [
          {
            evento: "ABRIR_OT",
            nota: null,
            usuario: "Ana",
            creadoEn: "2026-11-20T08:00:00-05:00",
          },
        ],
        firmas: [
          {
            tipo: "CIERRE",
            nombre: "Rosa",
            vigente: true,
            creadoEn: "2026-11-21T10:00:00-05:00",
          },
        ],
      } as never,
      "Empresa X",
    );
    const texto = t.filas.map((f) => f.join(" | ")).join("\n");
    expect(t.titulo).toContain("OT-2026-001");
    expect(texto).toContain("RM-2026-001");
    expect(texto).toContain("RQ-1");
    expect(texto).toContain("Sello");
    expect(texto).toContain("Firmado por Rosa");
    expect(texto).toContain("ABRIR_OT");
  });
});

describe("exportarJsonEmpresa", () => {
  const actor = (rol: string, id = `u-${rol}-${Math.random()}`) => ({
    id,
    email: "x@a.pe",
    rol,
    empresaId: "emp",
    personaId: "p",
    habilitado: true,
    motivo: null,
    debeCambiarClave: false,
  });
  const fuente = {
    empresa: async (id: string) => ({
      empresa_id: id,
      tablas: { backlogs: [] },
    }),
  };

  it("planificador: JSON de su empresa", async () => {
    const r = await exportarJsonEmpresa(
      actor("PLANIFICADOR"),
      fuente,
      "2026-11-26",
    );
    expect(r.ok && r.value.nombre).toBe("respaldo-2026-11-26.json");
    expect(
      r.ok && JSON.parse(new TextDecoder().decode(r.value.bytes)).empresa_id,
    ).toBe("emp");
  });
  it.each(["SUPERVISOR", "GERENTE", "TECNICO"])(
    "%s no descarga el JSON",
    async (rol) => {
      const r = await exportarJsonEmpresa(actor(rol), fuente, "2026-11-26");
      expect(!r.ok && r.error.code).toBe("FORBIDDEN");
    },
  );
});

describe("exportarRespaldo (superadmin)", () => {
  const sa = {
    id: `sa-${Math.random()}`,
    email: "sa@m.pe",
    rol: "SUPERADMIN",
    empresaId: null,
    personaId: null,
    habilitado: true,
    motivo: null,
    debeCambiarClave: false,
  };
  const deps = () => {
    const log: string[] = [];
    return {
      log,
      auth: {
        verificarClave: async (correo: string, clave: string) => (
          log.push(`verificar:${correo}`),
          clave === "buena"
        ),
      },
      fuente: {
        empresa: async (id: string, completo?: boolean) => (
          log.push(`respaldo:${id}:${completo}`),
          { empresa_id: id }
        ),
      },
    };
  };
  const EMP = "0190a1b2-0000-7000-8000-00000000000a";

  it("con la clave correcta: respaldo completo de esa empresa", async () => {
    const d = deps();
    const r = await exportarRespaldo(
      sa,
      { empresaId: EMP, clave: "buena" },
      d,
      "2026-11-26",
    );
    expect(r.ok && r.value.nombre).toBe(`respaldo-${EMP}-2026-11-26.json`);
    expect(d.log).toEqual(["verificar:sa@m.pe", `respaldo:${EMP}:true`]);
  });
  it("clave incorrecta: VALIDATION y no pide el respaldo (no queda auditado)", async () => {
    const d = deps();
    const r = await exportarRespaldo(
      { ...sa, id: "otro" },
      { empresaId: EMP, clave: "mala" },
      d,
      "2026-11-26",
    );
    expect(!r.ok && r.error.code).toBe("VALIDATION");
    expect(d.log).toEqual(["verificar:sa@m.pe"]);
  });
  it.each(["PLANIFICADOR", "GERENTE"])(
    "%s: FORBIDDEN sin verificar nada",
    async (rol) => {
      const d = deps();
      const r = await exportarRespaldo(
        { ...sa, rol, empresaId: EMP },
        { empresaId: EMP, clave: "buena" },
        d,
        "2026-11-26",
      );
      expect(!r.ok && r.error.code).toBe("FORBIDDEN");
      expect(d.log).toEqual([]);
    },
  );
});

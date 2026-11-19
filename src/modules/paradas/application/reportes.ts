import type { FechaISO } from "@/shared/kernel/fechas";
import type { ColumnaPdf, TablaPdf } from "@/shared/exportar/pdf";
import type { Hoja } from "@/shared/exportar/xlsx";
import { rankingFallas } from "../domain/ranking-fallas";
import type { Parada } from "./repositorios";

const nf = new Intl.NumberFormat("es-PE", { maximumFractionDigits: 2 });
const hora = (t: string | null) => (t ? t.replace("T", " ") : "");

// Una sola definición de las filas: la tabla en pantalla, el PDF y el Excel muestran exactamente lo mismo.
export const COLUMNAS_DIARIO: ColumnaPdf[] = [
  { titulo: "Código", ancho: 58 },
  { titulo: "Equipo", ancho: 58 },
  { titulo: "Motivo", ancho: 40 },
  { titulo: "Plan.", ancho: 28 },
  { titulo: "Parada", ancho: 66 },
  { titulo: "Salida", ancho: 66 },
  { titulo: "Horas", ancho: 34 },
  { titulo: "Horóm. ini/fin", ancho: 70 },
  { titulo: "Responsable", ancho: 90 },
  { titulo: "Tarea", ancho: 150 },
  { titulo: "Área parada", ancho: 70 },
  { titulo: "Estado", ancho: 48 },
];

export function filaDiario(p: Parada): string[] {
  return [
    p.codigo,
    p.equipo,
    p.motivoCodigo,
    p.esPlanificado ? "Sí" : "No",
    hora(p.inicio),
    hora(p.fin),
    p.duracionHoras === null ? "" : nf.format(p.duracionHoras),
    `${nf.format(p.horometroInicio)} / ${p.horometroFin === null ? "—" : nf.format(p.horometroFin)}`,
    p.responsable,
    p.descripcion ?? "",
    p.areaParada ?? "",
    p.estado === "ABIERTA" ? "Abierta" : "Cerrada",
  ];
}

export function pdfDiario(
  empresa: string,
  fecha: FechaISO,
  paradas: Parada[],
): TablaPdf {
  return {
    titulo: `Reporte diario de paradas · ${fecha.split("-").reverse().join("/")}`,
    subtitulo: `${empresa} · ${paradas.length} ${paradas.length === 1 ? "intervención" : "intervenciones"}`,
    columnas: COLUMNAS_DIARIO,
    filas: paradas.map(filaDiario),
  };
}

// Mensual: resumen por equipo (ranking incluido) y el detalle de cada parada.
export function hojasMensual(mes: string, paradas: Parada[]): Hoja[] {
  const [anio, m] = mes.split("-");
  const ultimo = new Date(Date.UTC(Number(anio), Number(m), 0)).getUTCDate();
  const periodo = { desde: `${mes}-01`, hasta: `${mes}-${ultimo}` };
  const ranking = new Map(
    rankingFallas(paradas, periodo).map((r, i) => [
      r.equipoId,
      { ...r, puesto: i + 1 },
    ]),
  );
  const porEquipo = new Map<
    string,
    { equipo: string; paradas: number; horas: number }
  >();
  for (const p of paradas) {
    const e = porEquipo.get(p.equipoId) ?? {
      equipo: p.equipo,
      paradas: 0,
      horas: 0,
    };
    e.paradas++;
    e.horas = Math.round((e.horas + (p.duracionHoras ?? 0)) * 100) / 100;
    porEquipo.set(p.equipoId, e);
  }
  const resumen = [...porEquipo.entries()]
    .map(([id, e]) => ({ ...e, falla: ranking.get(id) }))
    .sort(
      (a, b) =>
        (a.falla?.puesto ?? Infinity) - (b.falla?.puesto ?? Infinity) ||
        a.equipo.localeCompare(b.equipo),
    );
  return [
    {
      nombre: "Resumen",
      filas: [
        [
          "Equipo",
          "Paradas",
          "Horas paradas",
          "No planificadas",
          "Horas no planificadas",
          "Puesto en fallas",
        ],
        ...resumen.map((e) => [
          e.equipo,
          e.paradas,
          e.horas,
          e.falla?.fallas ?? 0,
          e.falla?.horas ?? 0,
          e.falla ? e.falla.puesto : null,
        ]),
      ],
    },
    {
      nombre: "Paradas",
      filas: [
        [
          "Código",
          "Equipo",
          "Motivo",
          "Nombre del motivo",
          "Planificada",
          "Parada",
          "Salida",
          "Horas",
          "Horómetro parada",
          "Horómetro salida",
          "Responsable",
          "Tarea",
          "Hallazgo",
          "Área demora",
          "Área parada",
          "Estado",
          "Backlog",
        ],
        ...paradas.map((p) => [
          p.codigo,
          p.equipo,
          p.motivoCodigo,
          p.motivo,
          p.esPlanificado ? "Sí" : "No",
          hora(p.inicio),
          hora(p.fin),
          p.duracionHoras,
          p.horometroInicio,
          p.horometroFin,
          p.responsable,
          p.descripcion,
          p.hallazgo,
          p.areaDemora,
          p.areaParada,
          p.estado === "ABIERTA" ? "Abierta" : "Cerrada",
          p.backlog?.codigo ?? null,
        ]),
      ],
    },
  ];
}

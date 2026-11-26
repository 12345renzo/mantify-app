import type { EstadoEngrase } from "@/modules/engrase/domain/estado-engrase";
import type { Salud } from "@/modules/neumaticos/domain/salud";
import type { EstadoPreventivo } from "@/modules/preventivos/domain/preventivo-estado";
import { situacion } from "@/modules/preventivos/domain/vencimiento";
import type {
  Criticidad,
  EstadoBacklog,
} from "@/modules/trabajos/domain/backlog-estado";
import { diasEntre, type FechaISO } from "@/shared/kernel/fechas";
import { ordenarBandeja, type ItemBandeja } from "./orden-bandeja";

export type FilaBacklog = {
  id: string;
  codigo: string;
  equipo: string;
  criticidad: Criticidad;
  estado: EstadoBacklog;
  fecha_programada: FechaISO;
  devuelto: boolean;
  tecnico: string | null;
};
export type FilaPreventivo = {
  id: string;
  codigo: string;
  equipo: string;
  estado: EstadoPreventivo;
  fecha_programada: FechaISO;
  horometro_programado: number | null;
  horometro_actual: number | null;
  ejecutado_en: FechaISO | null;
};
export type FilaParadaAbierta = {
  id: string;
  codigo: string;
  equipo: string;
  inicio: FechaISO;
};

export type EntradaBandeja = {
  backlogs: FilaBacklog[];
  preventivos: FilaPreventivo[];
  paradas_abiertas: FilaParadaAbierta[];
  engrase: {
    id: string;
    codigo: string;
    estado: EstadoEngrase;
    restanteDias: number | null;
  }[];
  neumaticos: { id: string; codigo: string; salud: Salud | null }[];
};

export type ItemBandejaVista = ItemBandeja & { href: string; detalle: string };

const atraso = (desde: FechaISO, hoy: FechaISO) =>
  Math.max(0, diasEntre(desde, hoy));

// Lo que espera atención, de todas las fuentes, ya ordenado por urgencia.
// Criticidad propia solo en backlogs; una parada abierta (equipo detenido) y una cubierta
// por cambiar cuentan como ALTA. El resto no tiene criticidad y va por atraso.
export function armarBandeja(
  e: EntradaBandeja,
  hoy: FechaISO,
  opciones: { validaciones: boolean },
): ItemBandejaVista[] {
  const items: ItemBandejaVista[] = [];
  for (const s of e.paradas_abiertas) {
    items.push({
      tipo: "PARADA",
      codigo: s.codigo,
      criticidad: "ALTA",
      atrasoDias: atraso(s.inicio, hoy),
      devuelto: false,
      href: `/paradas/${s.id}`,
      detalle: `${s.equipo} · equipo detenido`,
    });
  }
  for (const b of e.backlogs) {
    if (b.estado === "PENDIENTE_VALIDACION") {
      if (opciones.validaciones)
        items.push({
          tipo: "VALIDACION",
          codigo: b.codigo,
          criticidad: b.criticidad,
          atrasoDias: 0,
          devuelto: false,
          href: `/trabajos/${b.id}`,
          detalle: `${b.equipo} · trabajo por validar`,
        });
      continue;
    }
    items.push({
      tipo: "BACKLOG",
      codigo: b.codigo,
      criticidad: b.criticidad,
      atrasoDias: atraso(b.fecha_programada, hoy),
      devuelto: b.devuelto,
      href: `/trabajos/${b.id}`,
      detalle: `${b.equipo}${b.tecnico ? ` · ${b.tecnico}` : ""}`,
    });
  }
  for (const p of e.preventivos) {
    const href = `/preventivos/${p.id}`;
    if (p.estado === "COMPLETADO") {
      if (opciones.validaciones)
        items.push({
          tipo: "VALIDACION",
          codigo: p.codigo,
          criticidad: null,
          atrasoDias: 0,
          devuelto: false,
          href,
          detalle: `${p.equipo} · preventivo por validar`,
        });
      continue;
    }
    const devuelto = p.estado === "DEVUELTO";
    const s = situacion(
      {
        estado: p.estado,
        fechaProgramada: p.fecha_programada,
        horometroProgramado: p.horometro_programado,
      },
      hoy,
      p.horometro_actual,
    );
    if (!devuelto && s !== "VENCIDO" && s !== "ALERTA") continue;
    items.push({
      tipo: "PREVENTIVO",
      codigo: p.codigo,
      criticidad: null,
      atrasoDias: atraso(p.fecha_programada, hoy),
      devuelto,
      href,
      detalle: `${p.equipo} · ${devuelto ? "devuelto" : s === "VENCIDO" ? "vencido" : "por vencer"}`,
    });
  }
  for (const g of e.engrase) {
    if (g.estado !== "VENCIDO" && g.estado !== "POR_VENCER") continue;
    items.push({
      tipo: "ENGRASE",
      codigo: g.codigo,
      criticidad: null,
      atrasoDias: Math.max(0, -(g.restanteDias ?? 0)),
      devuelto: false,
      href: `/engrase/${g.id}`,
      detalle:
        g.estado === "VENCIDO" ? "engrase vencido" : "engrase por vencer",
    });
  }
  for (const n of e.neumaticos) {
    if (n.salud !== "CAMBIAR" && n.salud !== "ALERTA" && n.salud !== "MEDIR")
      continue;
    items.push({
      tipo: "NEUMATICO",
      codigo: n.codigo,
      criticidad: n.salud === "CAMBIAR" ? "ALTA" : null,
      atrasoDias: 0,
      devuelto: false,
      href: `/neumaticos/${n.id}`,
      detalle: { CAMBIAR: "cambiar", ALERTA: "en alerta", MEDIR: "medir" }[
        n.salud
      ],
    });
  }
  return ordenarBandeja(items);
}

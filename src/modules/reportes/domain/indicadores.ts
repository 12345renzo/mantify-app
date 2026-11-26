import type { EstadoEngrase } from "@/modules/engrase/domain/estado-engrase";
import { SALUDES, type Salud } from "@/modules/neumaticos/domain/salud";
import type { EstadoPreventivo } from "@/modules/preventivos/domain/preventivo-estado";
import { situacion } from "@/modules/preventivos/domain/vencimiento";
import type {
  Criticidad,
  EstadoBacklog,
} from "@/modules/trabajos/domain/backlog-estado";
import type { FechaISO } from "@/shared/kernel/fechas";

// Cada indicador recibe filas ya leídas y reusa la regla de su módulo, para que el número
// del dashboard sea el mismo que el del detalle. Período = mes de "hoy" (formato AAAA-MM).

const mesDe = (hoy: FechaISO) => hoy.slice(0, 7);

// Fecha o fecha con hora ISO; el mes son sus 7 primeros caracteres.
export function enMes(fecha: string | null, mes: string): boolean {
  return fecha !== null && fecha.slice(0, 7) === mes;
}

export function resumenPreventivos(
  filas: {
    estado: EstadoPreventivo;
    fechaProgramada: FechaISO;
    horometroProgramado: number | null;
    horometroActual: number | null;
    ejecutadoEn: string | null;
  }[],
  reprogramadosEnMes: number,
  hoy: FechaISO,
) {
  let vencidos = 0;
  let porVencer = 0;
  let ejecutados = 0;
  for (const f of filas) {
    const s = situacion(f, hoy, f.horometroActual);
    if (s === "VENCIDO") vencidos++;
    else if (s === "ALERTA") porVencer++;
    if (f.estado !== "PROGRAMADO" && enMes(f.ejecutadoEn, mesDe(hoy)))
      ejecutados++;
  }
  return { vencidos, porVencer, ejecutados, reprogramados: reprogramadosEnMes };
}

export function backlogsPorCriticidad(
  filas: { estado: EstadoBacklog; criticidad: Criticidad }[],
) {
  const r = { ALTA: 0, MEDIA: 0, BAJA: 0, total: 0 };
  for (const f of filas) {
    if (f.estado === "COMPLETADO") continue;
    r[f.criticidad]++;
    r.total++;
  }
  return r;
}

export function resumenFlota(
  filas: { estadoMovilizacion: string; estadoOperativo: string }[],
) {
  const cuenta = (v: string) =>
    filas.filter((f) => f.estadoMovilizacion === v).length;
  return {
    movilizados: cuenta("MOVILIZADO"),
    desmovilizados: cuenta("DESMOVILIZADO"),
    pendientes: cuenta("PENDIENTE"),
    operativos: filas.filter((f) => f.estadoOperativo === "OPERATIVO").length,
    total: filas.length,
  };
}

// Vencida = abierta con la fecha programada de su backlog ya pasada (misma regla que el atraso).
export function resumenOT(
  filas: {
    estado: "ABIERTA" | "CERRADA";
    fechaProgramada: FechaISO;
    cerradaEn: string | null;
  }[],
  hoy: FechaISO,
) {
  const abiertas = filas.filter((f) => f.estado === "ABIERTA");
  return {
    pendientes: abiertas.length,
    vencidas: abiertas.filter((f) => f.fechaProgramada < hoy).length,
    cerradas: filas.filter(
      (f) => f.estado === "CERRADA" && enMes(f.cerradaEn, mesDe(hoy)),
    ).length,
  };
}

// Estado de cada OT abierta del técnico, según el backlog que trabaja.
export function trabajosPorTecnico(
  filas: { tecnico: string; estado: EstadoBacklog; devuelto: boolean }[],
) {
  const porTecnico = new Map<
    string,
    { enProceso: number; devueltos: number; porValidar: number }
  >();
  for (const f of filas) {
    const t = porTecnico.get(f.tecnico) ?? {
      enProceso: 0,
      devueltos: 0,
      porValidar: 0,
    };
    if (f.estado === "PENDIENTE_VALIDACION") t.porValidar++;
    else if (f.devuelto) t.devueltos++;
    else t.enProceso++;
    porTecnico.set(f.tecnico, t);
  }
  return [...porTecnico]
    .map(([tecnico, t]) => ({
      tecnico,
      ...t,
      total: t.enProceso + t.devueltos + t.porValidar,
    }))
    .sort((a, b) => a.tecnico.localeCompare(b.tecnico));
}

const redondear = (n: number) => Math.round(n * 100) / 100;

// Horas de trabajo = horas de paradas cerradas del período, por equipo (decisión del corte 10).
export function horasDeTrabajo(
  filas: { equipo: string; duracionHoras: number | null }[],
) {
  const porEquipo = new Map<string, number>();
  for (const f of filas) {
    if (f.duracionHoras === null) continue;
    porEquipo.set(f.equipo, (porEquipo.get(f.equipo) ?? 0) + f.duracionHoras);
  }
  const lista = [...porEquipo]
    .map(([equipo, horas]) => ({ equipo, horas: redondear(horas) }))
    .sort((a, b) => b.horas - a.horas || a.equipo.localeCompare(b.equipo));
  return {
    total: redondear(lista.reduce((s, e) => s + e.horas, 0)),
    porEquipo: lista,
  };
}

export function resumenEngrase(estados: EstadoEngrase[]) {
  const cuenta = (e: EstadoEngrase) => estados.filter((x) => x === e).length;
  return {
    alDia: cuenta("AL_DIA"),
    porVencer: cuenta("POR_VENCER"),
    vencidos: cuenta("VENCIDO"),
    sinRegistro: cuenta("SIN_REGISTRO"),
    sinPlan: cuenta("SIN_PLAN"),
  };
}

export function resumenNeumaticos(saludes: Salud[]): Record<Salud, number> {
  return Object.fromEntries(
    SALUDES.map((s) => [s, saludes.filter((x) => x === s).length]),
  ) as Record<Salud, number>;
}

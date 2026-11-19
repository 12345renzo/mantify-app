import type { FechaISO } from "@/shared/kernel/fechas";
import { fechaDe, type FechaHora } from "./duracion";

export type ParadaRanking = {
  equipoId: string;
  equipo: string;
  esPlanificado: boolean;
  inicio: FechaHora;
  duracionHoras: number | null;
};

export type FilaRanking = {
  equipoId: string;
  equipo: string;
  fallas: number;
  horas: number;
};

// Equipos con más paradas NO planificadas en el periodo (por cantidad, no por duración).
// Empates: más horas paradas primero y luego el código del equipo, para que el orden sea siempre el mismo.
// Los equipos que se pasan sin fallas entran al final con 0.
export function rankingFallas(
  paradas: ParadaRanking[],
  periodo: { desde: FechaISO; hasta: FechaISO },
  equipos: { id: string; codigo: string }[] = [],
): FilaRanking[] {
  const porEquipo = new Map<string, FilaRanking>(
    equipos.map((e) => [
      e.id,
      { equipoId: e.id, equipo: e.codigo, fallas: 0, horas: 0 },
    ]),
  );
  for (const p of paradas) {
    const dia = fechaDe(p.inicio);
    if (p.esPlanificado || dia < periodo.desde || dia > periodo.hasta) continue;
    const f = porEquipo.get(p.equipoId) ?? {
      equipoId: p.equipoId,
      equipo: p.equipo,
      fallas: 0,
      horas: 0,
    };
    f.fallas++;
    f.horas = Math.round((f.horas + (p.duracionHoras ?? 0)) * 100) / 100;
    porEquipo.set(p.equipoId, f);
  }
  return [...porEquipo.values()].sort(
    (a, b) =>
      b.fallas - a.fallas ||
      b.horas - a.horas ||
      a.equipo.localeCompare(b.equipo),
  );
}

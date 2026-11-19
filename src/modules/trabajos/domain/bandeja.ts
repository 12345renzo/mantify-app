import { diasEntre, type FechaISO } from "@/shared/kernel/fechas";
import type { Criticidad, EstadoBacklog } from "./backlog-estado";

export type ItemBandeja = {
  codigo: string;
  estado: EstadoBacklog;
  criticidad: Criticidad;
  fechaProgramada: FechaISO;
  devuelto: boolean;
};

const PESO: Record<Criticidad, number> = { ALTA: 0, MEDIA: 1, BAJA: 2 };

// Días de atraso respecto a la fecha programada; 0 si aún no vence o ya se cerró.
export function atraso(item: ItemBandeja, hoy: FechaISO): number {
  if (item.estado !== "PENDIENTE" && item.estado !== "EN_PROCESO") return 0;
  return Math.max(0, diasEntre(item.fechaProgramada, hoy));
}

// Devueltos primero, luego criticidad, luego atraso; desempate fijo por código.
export function ordenarBandeja<T extends ItemBandeja>(
  items: T[],
  hoy: FechaISO,
): T[] {
  return [...items].sort(
    (a, b) =>
      Number(b.devuelto) - Number(a.devuelto) ||
      PESO[a.criticidad] - PESO[b.criticidad] ||
      atraso(b, hoy) - atraso(a, hoy) ||
      a.codigo.localeCompare(b.codigo),
  );
}

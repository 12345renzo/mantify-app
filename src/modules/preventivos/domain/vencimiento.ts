import { diasEntre, type FechaISO } from "@/shared/kernel/fechas";
import type { EstadoPreventivo } from "./preventivo-estado";

export const DIAS_ALERTA = 7;
// shortcut: margen fijo de horómetro para la alerta; pasarlo a la configuración de la empresa si lo piden.
export const MARGEN_HORAS = 50;

// Vencido no se guarda: es un PROGRAMADO cuya fecha ya pasó. "hoy" sale del servidor.
export function estaVencido(
  p: { estado: EstadoPreventivo; fechaProgramada: FechaISO },
  hoy: FechaISO,
): boolean {
  return p.estado === "PROGRAMADO" && p.fechaProgramada < hoy;
}

// Alerta desde 7 días antes hasta el mismo día (después ya es vencido).
export function enAlerta(
  fechaProgramada: FechaISO,
  hoy: FechaISO,
  diasAnticipacion = DIAS_ALERTA,
): boolean {
  const faltan = diasEntre(hoy, fechaProgramada);
  return faltan >= 0 && faltan <= diasAnticipacion;
}

export function horometroEnAlerta(
  actual: number | null,
  programado: number | null,
  margen = MARGEN_HORAS,
): boolean {
  return (
    actual !== null && programado !== null && actual >= programado - margen
  );
}

export type Situacion = "VENCIDO" | "ALERTA" | "AL_DIA";

// Solo aplica a lo que falta ejecutar; lo ejecutado no tiene situación.
export function situacion(
  p: {
    estado: EstadoPreventivo;
    fechaProgramada: FechaISO;
    horometroProgramado: number | null;
  },
  hoy: FechaISO,
  horometroActual: number | null,
): Situacion | null {
  if (p.estado !== "PROGRAMADO") return null;
  if (estaVencido(p, hoy)) return "VENCIDO";
  return enAlerta(p.fechaProgramada, hoy) ||
    horometroEnAlerta(horometroActual, p.horometroProgramado)
    ? "ALERTA"
    : "AL_DIA";
}

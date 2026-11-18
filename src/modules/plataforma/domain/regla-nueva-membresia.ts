import { diasEntre, sumarDias, type FechaISO } from "@/shared/kernel/fechas";

export const DIAS_MEMBRESIA = 30;

// Antes del vencimiento o durante la gracia: empieza el día siguiente al fin actual.
// Después de la gracia, o si nunca pagó: empieza el día del pago.
export function calcularInicioNuevaMembresia(
  finActual: FechaISO | null,
  hoy: FechaISO,
  diasGracia: number,
): FechaISO {
  if (finActual === null) return hoy;
  const diasVencida = diasEntre(finActual, hoy);
  if (diasVencida <= diasGracia) return sumarDias(finActual, 1);
  return hoy;
}

// 30 días contando el de inicio: del 1 al 30 de noviembre.
export function calcularFinMembresia(inicio: FechaISO): FechaISO {
  return sumarDias(inicio, DIAS_MEMBRESIA - 1);
}

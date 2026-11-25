import { diasEntre, sumarDias, type FechaISO } from "@/shared/kernel/fechas";

export const DIAS_MEMBRESIA = 30;

// Antes del vencimiento: día siguiente al fin. En gracia: al terminar la gracia (esos días son gratis).
// Pasada la gracia, si nunca pagó o si fue dada de baja: el día del pago.
export function calcularInicioNuevaMembresia(
  finActual: FechaISO | null,
  hoy: FechaISO,
  diasGracia: number,
  deBaja = false,
): FechaISO {
  if (finActual === null) return hoy;
  const diasVencida = diasEntre(finActual, hoy);
  // Baja el mismo día: ese día ya está en el periodo anterior.
  if (diasVencida <= 0) return sumarDias(finActual, 1);
  if (!deBaja && diasVencida <= diasGracia) {
    return sumarDias(finActual, diasGracia + 1);
  }
  return hoy;
}

// 30 días contando el de inicio: del 1 al 30 de noviembre.
export function calcularFinMembresia(inicio: FechaISO): FechaISO {
  return sumarDias(inicio, DIAS_MEMBRESIA - 1);
}

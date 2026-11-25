import { diasEntre, type FechaISO } from "@/shared/kernel/fechas";

export const ESTADOS_MEMBRESIA = [
  "AL_DIA",
  "POR_VENCER",
  "EN_GRACIA",
  "VENCIDA",
  "INACTIVA",
] as const;

export type EstadoMembresia = (typeof ESTADOS_MEMBRESIA)[number];

export const DIAS_AVISO_POR_VENCER = 7;

export type FechasMembresia = {
  // Fin de la membresía VIGENTE más lejana. Nulo si nunca pagó.
  fin: FechaISO | null;
  // INACTIVA manual o por vencimiento: gana sobre cualquier otra condición.
  empresaInactiva: boolean;
};

// Misma regla que la vista v_empresas_estado de la base. Si cambia una, cambia la otra.
export function calcularEstadoMembresia(
  fechas: FechasMembresia,
  diasGracia: number,
  hoy: FechaISO,
): EstadoMembresia {
  if (fechas.empresaInactiva || fechas.fin === null) return "INACTIVA";
  const restantes = diasEntre(hoy, fechas.fin);
  if (restantes > DIAS_AVISO_POR_VENCER) return "AL_DIA";
  if (restantes >= 0) return "POR_VENCER";
  if (-restantes <= diasGracia) return "EN_GRACIA";
  return "VENCIDA";
}

export function puedeRenovar(estado: EstadoMembresia): boolean {
  return estado !== "AL_DIA";
}

export function empresaActiva(estado: EstadoMembresia): boolean {
  return (
    estado === "AL_DIA" || estado === "POR_VENCER" || estado === "EN_GRACIA"
  );
}

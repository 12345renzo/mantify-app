// Misma regla que la columna generada motivos_parada.es_planificado; MCI nunca es planificado.
const PLANIFICADOS = ["PM1", "PM2", "PM3", "PM4", "ENGRASE", "PREDICTIVO"];

export function esPlanificado(codigoMotivo: string): boolean {
  return codigoMotivo !== "MCI" && PLANIFICADOS.includes(codigoMotivo);
}

// Una parada por engrase genera su registro de engrase (llega en el corte 8).
export const generaEngrase = (codigoMotivo: string) =>
  codigoMotivo === "ENGRASE";

import { sumarDias, type FechaISO } from "@/shared/kernel/fechas";

export type Recurrencia = { cadaDias: number | null; cadaHoras: number | null };

// Propuesta para programar el siguiente desde la última ejecución. El sistema no lo crea solo.
export function siguienteProgramacion(
  plan: Recurrencia,
  ultimo: { fecha: FechaISO; horometro: number | null },
): { fecha: FechaISO | null; horometro: number | null } {
  return {
    fecha: plan.cadaDias ? sumarDias(ultimo.fecha, plan.cadaDias) : null,
    horometro:
      plan.cadaHoras && ultimo.horometro !== null
        ? Math.round((ultimo.horometro + plan.cadaHoras) * 100) / 100
        : null,
  };
}

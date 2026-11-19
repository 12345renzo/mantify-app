import { DomainError } from "@/shared/kernel/errors";
import { err, ok, type Result } from "@/shared/kernel/result";

export const RESULTADOS = {
  OK: "OK",
  OBSERVADO: "Observado",
  NO_APLICA: "No aplica",
} as const;
export type Resultado = keyof typeof RESULTADOS;

export const MIN_OBSERVACION = 3;

export type ActividadEjecutada = {
  id: string;
  resultado: Resultado | null;
  observacion: string | null;
};

// Todas las actividades con resultado; una OBSERVADO exige su observación.
export function revisarActividades(
  esperadas: string[],
  actividades: ActividadEjecutada[],
): Result<void> {
  const porId = new Map(actividades.map((a) => [a.id, a]));
  for (const id of esperadas) {
    const a = porId.get(id);
    if (!a?.resultado) {
      return err(new DomainError("VALIDATION", "actividades_incompletas"));
    }
    if (
      a.resultado === "OBSERVADO" &&
      (a.observacion?.trim().length ?? 0) < MIN_OBSERVACION
    ) {
      return err(new DomainError("VALIDATION", "observacion_obligatoria"));
    }
  }
  return ok(undefined);
}

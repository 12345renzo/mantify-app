import { DomainError } from "@/shared/kernel/errors";
import { err, ok, type Result } from "@/shared/kernel/result";

export type PosicionNueva = { codigo: string; eje: number; orden: number };

// Mismo formato que el catálogo de disposición: una línea por eje, posiciones separadas por "|".
const CODIGO = /^[A-Z0-9-]{1,10}$/;

export function posicionesDePlantilla(layout: string): Result<PosicionNueva[]> {
  const lineas = layout.split("\n").filter((l) => l.trim() !== "");
  const posiciones: PosicionNueva[] = [];
  lineas.forEach((linea, i) => {
    for (const p of linea.split("|")) {
      posiciones.push({
        codigo: p.trim().toUpperCase(),
        eje: i + 1,
        orden: posiciones.length,
      });
    }
  });
  const codigos = posiciones.map((p) => p.codigo);
  if (
    posiciones.length === 0 ||
    posiciones.length > 40 ||
    codigos.some((c) => !CODIGO.test(c)) ||
    new Set(codigos).size !== codigos.length
  ) {
    return err(new DomainError("VALIDATION", "posiciones_no_validas"));
  }
  return ok(posiciones);
}

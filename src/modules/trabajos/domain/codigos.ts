// Mismo formato que siguiente_codigo() en la base: BKL-000001, y con año OT-2026-001, RM-2026-001, RQ-2026-001.
export function formatearCodigo(
  prefijo: string,
  numero: number,
  anio?: number,
): string {
  return anio === undefined
    ? `${prefijo}-${String(numero).padStart(6, "0")}`
    : `${prefijo}-${anio}-${String(numero).padStart(3, "0")}`;
}

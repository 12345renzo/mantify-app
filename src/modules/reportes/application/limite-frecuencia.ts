import { DomainError } from "@/shared/kernel/errors";
import { err, ok, type Result } from "@/shared/kernel/result";

export const MAX_DESCARGAS = 3;
export const VENTANA_MS = 60_000;

// Núcleo puro: con las descargas recientes de una cuenta, ¿entra una más?
export function permitir(
  historial: number[],
  ahora: number,
  max = MAX_DESCARGAS,
  ventana = VENTANA_MS,
): { ok: boolean; historial: number[] } {
  const recientes = historial.filter((t) => ahora - t < ventana);
  if (recientes.length >= max) return { ok: false, historial: recientes };
  return { ok: true, historial: [...recientes, ahora] };
}

// shortcut: en memoria del servidor (como el bloqueo del login); se reinicia con el servidor y no se
// comparte entre instancias. Pasarlo a la base o a un almacén compartido si la app corre en varias.
const descargas = new Map<string, number[]>();

export function exigirFrecuencia(
  cuentaId: string,
  ahora = Date.now(),
): Result<void> {
  const r = permitir(descargas.get(cuentaId) ?? [], ahora);
  descargas.set(cuentaId, r.historial);
  return r.ok
    ? ok(undefined)
    : err(new DomainError("RATE_LIMITED", "demasiadas descargas"));
}

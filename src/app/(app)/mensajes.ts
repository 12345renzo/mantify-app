import type { DomainError, DomainErrorCode } from "@/shared/kernel/errors";

// Texto para la persona según el código. Nunca el mensaje interno ni el de la base.
const BASE: Record<DomainErrorCode, string> = {
  UNAUTHENTICATED: "Tu sesión terminó. Vuelve a ingresar.",
  FORBIDDEN: "No tienes permiso para esta acción.",
  NOT_FOUND: "No encontramos el registro. Recarga la página.",
  VALIDATION: "Revisa los datos del formulario.",
  CONFLICT: "El registro cambió mientras trabajabas. Recarga la página.",
  RATE_LIMITED: "Demasiados intentos. Espera un momento.",
  LIMIT: "Llegaste al límite de cuentas de tu plan.",
};

export function mensajeError(
  error: DomainError,
  propios: Partial<Record<DomainErrorCode, string>> = {},
): string {
  return propios[error.code] ?? BASE[error.code];
}

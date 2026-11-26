export const DOMAIN_ERROR_CODES = [
  "UNAUTHENTICATED",
  "FORBIDDEN",
  "NOT_FOUND",
  "VALIDATION",
  "CONFLICT",
  "RATE_LIMITED",
  "LIMIT",
  // Un catálogo que usa un registro activo (p. ej. categoría con equipos).
  "EN_USO",
  // Quitar al último planificador activo de una empresa.
  "SIN_PLANIFICADOR",
] as const;

export type DomainErrorCode = (typeof DOMAIN_ERROR_CODES)[number];

// El mensaje es para logs y pruebas. La interfaz muestra un texto genérico según el código.
export class DomainError extends Error {
  constructor(
    readonly code: DomainErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "DomainError";
  }
}

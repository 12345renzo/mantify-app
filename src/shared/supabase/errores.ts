import { DomainError, type DomainErrorCode } from "@/shared/kernel/errors";

type ErrorPostgrest = { code?: string; message: string };

const CODIGOS: Record<string, DomainErrorCode> = {
  "23505": "CONFLICT", // único repetido (RUC)
  "23P01": "CONFLICT", // exclusión: membresías solapadas
  "23514": "VALIDATION", // CHECK
  "23502": "VALIDATION", // NOT NULL
  "22P02": "VALIDATION", // formato inválido
  "23503": "VALIDATION", // FK
  "42501": "FORBIDDEN", // RLS o permiso
  P0002: "NOT_FOUND",
  MT001: "LIMIT", // cupo de usuarios del plan (trigger usuarios_cupo)
  MT002: "CONFLICT", // lectura menor que el horómetro (otra lectura entró antes)
  MT003: "EN_USO", // catálogo usado por equipos activos
  PGRST116: "NOT_FOUND",
};

// Traduce el error de la base a un DomainError. Un error desconocido se lanza: lo atrapa error.tsx
// y el usuario ve un mensaje genérico, nunca el texto de la base.
export function aDomainError(error: ErrorPostgrest): DomainError {
  const code = error.code ? CODIGOS[error.code] : undefined;
  if (!code) {
    console.error("[supabase] error inesperado", { code: error.code });
    throw new Error("Error inesperado de base de datos");
  }
  return new DomainError(code, error.message);
}

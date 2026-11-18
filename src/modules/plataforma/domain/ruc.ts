import { DomainError } from "@/shared/kernel/errors";
import { err, ok, type Result } from "@/shared/kernel/result";

export function validarRuc(texto: string): Result<string> {
  const ruc = texto.trim();
  if (!/^\d{11}$/.test(ruc)) {
    return err(new DomainError("VALIDATION", "El RUC debe tener 11 dígitos."));
  }
  return ok(ruc);
}

import { DomainError } from "@/shared/kernel/errors";
import { err, ok, type Result } from "@/shared/kernel/result";

// Quién hace la acción. Sale de la base (función mi_acceso), nunca de datos del cliente.
export type Actor = {
  readonly id: string;
  readonly email: string;
  readonly rol: string | null;
  // Nulo para el superadmin.
  readonly empresaId: string | null;
  readonly personaId: string | null;
  // Falso si no tiene persona, su empresa está vencida o su sesión fue revocada.
  readonly habilitado: boolean;
  readonly motivo: string | null;
  readonly debeCambiarClave: boolean;
};

export function exigirSuperadmin(actor: Actor | null): Result<Actor> {
  if (!actor || !actor.habilitado) {
    return err(new DomainError("UNAUTHENTICATED", "sin sesión válida"));
  }
  if (actor.rol !== "SUPERADMIN") {
    return err(new DomainError("FORBIDDEN", "no es superadmin"));
  }
  return ok(actor);
}

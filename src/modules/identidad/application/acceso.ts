import type { Actor } from "@/shared/kernel/actor";
import { DomainError } from "@/shared/kernel/errors";
import { err, ok, type Result } from "@/shared/kernel/result";
import { puede, type Accion, type Recurso } from "../domain/permisos";

export function exigirPermiso(
  actor: Actor | null,
  accion: Accion,
  recurso: Recurso,
): Result<Actor> {
  if (!actor || !actor.habilitado) {
    return err(new DomainError("UNAUTHENTICATED", "sin acceso habilitado"));
  }
  if (!puede(actor.rol, accion, recurso)) {
    return err(
      new DomainError(
        "FORBIDDEN",
        `${actor.rol} no puede ${accion} ${recurso}`,
      ),
    );
  }
  return ok(actor);
}

// El superadmin indica la empresa; los demás solo trabajan sobre la suya (lo que mande el cliente se ignora).
export function empresaDeTrabajo(
  actor: Actor,
  empresaIdPedida: string | null | undefined,
): Result<string> {
  if (actor.rol === "SUPERADMIN") {
    return empresaIdPedida
      ? ok(empresaIdPedida)
      : err(new DomainError("VALIDATION", "falta la empresa"));
  }
  return actor.empresaId
    ? ok(actor.empresaId)
    : err(new DomainError("FORBIDDEN", "usuario sin empresa"));
}

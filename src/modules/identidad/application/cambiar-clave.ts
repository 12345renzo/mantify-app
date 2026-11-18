import type { Actor } from "@/shared/kernel/actor";
import { DomainError } from "@/shared/kernel/errors";
import { err, type Result } from "@/shared/kernel/result";
import type { CuentasRepositorio, ServicioAuth } from "./repositorios";

// Cambio de la clave asignada. No es obligatorio, pero se avisa hasta que se haga.
export async function cambiarClave(
  actor: Actor | null,
  entrada: { actual: string; nueva: string },
  repos: { cuentas: CuentasRepositorio; auth: ServicioAuth },
): Promise<Result<void>> {
  if (!actor || !actor.habilitado) {
    return err(new DomainError("UNAUTHENTICATED", "sin sesión válida"));
  }
  if (!(await repos.auth.verificarClave(actor.email, entrada.actual))) {
    return err(new DomainError("VALIDATION", "clave actual incorrecta"));
  }
  const cambiada = await repos.auth.cambiarMiClave(entrada.nueva);
  if (!cambiada.ok) return cambiada;
  return repos.cuentas.marcarClaveCambiada();
}

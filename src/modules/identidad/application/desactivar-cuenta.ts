import type { Actor } from "@/shared/kernel/actor";
import { DomainError } from "@/shared/kernel/errors";
import { err, type Result } from "@/shared/kernel/result";
import { rolesQuePuedeGestionar } from "../domain/permisos";
import { empresaDeTrabajo, exigirPermiso } from "./acceso";
import type { CuentasRepositorio } from "./repositorios";

// Baja lógica de la cuenta: queda INACTIVA, su persona queda libre y deja de contar en el cupo.
// Que no quede la empresa sin planificador lo garantiza la base (MT006), salvo para el superadmin.
export async function desactivarCuenta(
  actor: Actor | null,
  entrada: { cuentaId: string },
  repos: { cuentas: CuentasRepositorio },
): Promise<Result<void>> {
  const permiso = exigirPermiso(actor, "editar", "cuentas");
  if (!permiso.ok) return permiso;
  const quien = permiso.value;

  const cuenta = await repos.cuentas.obtener(entrada.cuentaId);
  if (!cuenta.ok) return cuenta;
  const c = cuenta.value;

  const empresa = empresaDeTrabajo(quien, c.empresaId);
  if (!empresa.ok) return empresa;
  if (c.empresaId !== empresa.value) {
    return err(new DomainError("NOT_FOUND", "cuenta de otra empresa"));
  }
  if (c.id === quien.id) {
    return err(
      new DomainError("FORBIDDEN", "no puede desactivar su propia cuenta"),
    );
  }
  if (!rolesQuePuedeGestionar(quien.rol).some((r) => r === c.rol)) {
    return err(
      new DomainError("FORBIDDEN", `no puede desactivar una cuenta ${c.rol}`),
    );
  }
  if (!c.activa) return err(new DomainError("CONFLICT", "ya está inactiva"));
  return repos.cuentas.desactivar(c.id);
}

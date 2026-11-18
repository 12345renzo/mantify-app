import type { Actor } from "@/shared/kernel/actor";
import { DomainError } from "@/shared/kernel/errors";
import { err, type Result } from "@/shared/kernel/result";
import { rolesQuePuedeGestionar, type RolEmpresa } from "../domain/permisos";
import { empresaDeTrabajo, exigirPermiso } from "./acceso";
import type { CuentasRepositorio } from "./repositorios";

// De una cuenta solo se cambia el rol: el correo y la persona tienen sus propios flujos.
export async function cambiarRolCuenta(
  actor: Actor | null,
  entrada: { cuentaId: string; rol: RolEmpresa },
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
    return err(new DomainError("FORBIDDEN", "no puede cambiar su propio rol"));
  }
  const gestionables = rolesQuePuedeGestionar(quien.rol);
  if (
    !gestionables.some((r) => r === c.rol) ||
    !gestionables.includes(entrada.rol)
  ) {
    return err(new DomainError("FORBIDDEN", `no puede asignar ${entrada.rol}`));
  }
  if (c.rol === entrada.rol) {
    return err(new DomainError("CONFLICT", "ya tiene ese rol"));
  }
  return repos.cuentas.cambiarRol(c.id, entrada.rol);
}

import type { Actor } from "@/shared/kernel/actor";
import { DomainError } from "@/shared/kernel/errors";
import { err, ok, type Result } from "@/shared/kernel/result";
import { rolesQuePuedeGestionar, type RolEmpresa } from "../domain/permisos";
import { hayCupo } from "../domain/reglas-persona-cuenta";
import { empresaDeTrabajo, exigirPermiso } from "./acceso";
import { resolverPersonaParaCuenta } from "./crear-persona";
import type { PersonaEntrada } from "./esquemas";
import type {
  CuentasRepositorio,
  PersonasRepositorio,
  ServicioAuth,
} from "./repositorios";

export type CuentaCreada = { cuentaId: string; correo: string; clave: string };

// La clave se genera en el servidor y se devuelve una sola vez para que quien crea la cuenta la entregue.
export async function crearUsuario(
  actor: Actor | null,
  entrada: {
    empresaId: string | null;
    rol: RolEmpresa;
    correo: string;
    personaId: string | null;
    personaNueva: PersonaEntrada | null;
  },
  repos: {
    personas: PersonasRepositorio;
    cuentas: CuentasRepositorio;
    auth: ServicioAuth;
  },
): Promise<Result<CuentaCreada>> {
  const permiso = exigirPermiso(actor, "crear", "cuentas");
  if (!permiso.ok) return permiso;
  const quien = permiso.value;
  if (!rolesQuePuedeGestionar(quien.rol).includes(entrada.rol)) {
    return err(new DomainError("FORBIDDEN", `no puede crear ${entrada.rol}`));
  }
  const empresa = empresaDeTrabajo(quien, entrada.empresaId);
  if (!empresa.ok) return empresa;

  // La base vuelve a comprobar el cupo con la fila bloqueada; esto evita crear la cuenta de Auth en vano.
  if (!hayCupo(await repos.cuentas.cupo(empresa.value))) {
    return err(new DomainError("LIMIT", "sin cupo de usuarios"));
  }

  const persona = await resolverPersonaParaCuenta(
    quien,
    empresa.value,
    entrada.personaId,
    entrada.personaNueva,
    repos.personas,
  );
  if (!persona.ok) return persona;

  const cuenta = await repos.auth.crearCuenta(entrada.correo);
  if (!cuenta.ok) return cuenta;

  const guardada = await repos.cuentas.insertar({
    id: cuenta.value.id,
    empresaId: empresa.value,
    personaId: persona.value,
    rol: entrada.rol,
    correo: entrada.correo,
    creadoPor: quien.id,
  });
  if (!guardada.ok) {
    // Sin fila en usuarios la cuenta de Auth no sirve: se borra para no dejar accesos sueltos.
    await repos.auth.eliminarCuenta(cuenta.value.id);
    return guardada;
  }
  return ok({
    cuentaId: cuenta.value.id,
    correo: entrada.correo,
    clave: cuenta.value.clave,
  });
}

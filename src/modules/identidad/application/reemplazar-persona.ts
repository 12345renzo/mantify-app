import type { Actor } from "@/shared/kernel/actor";
import { DomainError } from "@/shared/kernel/errors";
import { err, ok, type Result } from "@/shared/kernel/result";
import { rolesQuePuedeGestionar } from "../domain/permisos";
import { empresaDeTrabajo, exigirPermiso } from "./acceso";
import { resolverPersonaParaCuenta } from "./crear-persona";
import type { PersonaEntrada } from "./esquemas";
import type {
  CuentasRepositorio,
  PersonasRepositorio,
  ServicioAuth,
} from "./repositorios";

// Asigna una cuenta libre (su persona fue dada de baja) a otra persona, con correo y clave nuevos.
export async function reemplazarPersona(
  actor: Actor | null,
  entrada: {
    cuentaId: string;
    correo: string;
    personaId: string | null;
    personaNueva: PersonaEntrada | null;
  },
  repos: {
    personas: PersonasRepositorio;
    cuentas: CuentasRepositorio;
    auth: ServicioAuth;
  },
): Promise<Result<{ correo: string; clave: string }>> {
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
  if (!rolesQuePuedeGestionar(quien.rol).some((r) => r === c.rol)) {
    return err(
      new DomainError("FORBIDDEN", `no puede reasignar una cuenta ${c.rol}`),
    );
  }
  if (c.personaId)
    return err(new DomainError("CONFLICT", "la cuenta ya tiene persona"));

  const persona = await resolverPersonaParaCuenta(
    quien,
    empresa.value,
    entrada.personaId,
    entrada.personaNueva,
    repos.personas,
  );
  if (!persona.ok) return persona;

  // Primero se cambian las credenciales: si lo siguiente falla, la cuenta queda libre y nadie conoce la clave nueva.
  const credenciales = await repos.auth.cambiarCorreoYClave(
    c.id,
    entrada.correo,
  );
  if (!credenciales.ok) return credenciales;

  const asignada = await repos.cuentas.asignarPersona(
    c.id,
    persona.value,
    entrada.correo,
  );
  if (!asignada.ok) return asignada;
  return ok({ correo: entrada.correo, clave: credenciales.value.clave });
}

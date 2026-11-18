import type { Actor } from "@/shared/kernel/actor";
import { DomainError } from "@/shared/kernel/errors";
import { err, type Result } from "@/shared/kernel/result";
import { rolesQuePuedeGestionar } from "../domain/permisos";
import { empresaDeTrabajo, exigirPermiso } from "./acceso";
import type { PersonaEntrada } from "./esquemas";
import type { PersonasRepositorio } from "./repositorios";

// Edita todos los datos de una persona. No toca su cuenta ni su estado.
export async function editarPersona(
  actor: Actor | null,
  entrada: { personaId: string; persona: PersonaEntrada },
  repos: { personas: PersonasRepositorio },
): Promise<Result<void>> {
  const permiso = exigirPermiso(actor, "editar", "personas");
  if (!permiso.ok) return permiso;
  const quien = permiso.value;

  const persona = await repos.personas.obtener(entrada.personaId);
  if (!persona.ok) return persona;
  const p = persona.value;

  const empresa = empresaDeTrabajo(quien, p.empresaId);
  if (!empresa.ok) return empresa;
  if (p.empresaId !== empresa.value) {
    return err(new DomainError("NOT_FOUND", "persona de otra empresa"));
  }
  // Los datos propios sí se pueden editar; los de otra cuenta, solo si el rol es gestionable.
  const cuenta = p.cuenta;
  if (
    cuenta &&
    cuenta.id !== quien.id &&
    !rolesQuePuedeGestionar(quien.rol).some((r) => r === cuenta.rol)
  ) {
    return err(
      new DomainError("FORBIDDEN", `no puede editar a un ${cuenta.rol}`),
    );
  }
  return repos.personas.actualizar(p.id, entrada.persona);
}

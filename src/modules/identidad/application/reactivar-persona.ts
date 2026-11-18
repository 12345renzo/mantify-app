import type { Actor } from "@/shared/kernel/actor";
import { DomainError } from "@/shared/kernel/errors";
import { err, type Result } from "@/shared/kernel/result";
import { empresaDeTrabajo, exigirPermiso } from "./acceso";
import type { PersonasRepositorio } from "./repositorios";

// Vuelve a la cuadrilla: queda ACTIVA y sin cuenta (la que tuvo ya pudo asignarse a otra persona).
export async function reactivarPersona(
  actor: Actor | null,
  entrada: { personaId: string },
  repos: { personas: PersonasRepositorio },
): Promise<Result<void>> {
  const permiso = exigirPermiso(actor, "dar_baja", "personas");
  if (!permiso.ok) return permiso;

  const persona = await repos.personas.obtener(entrada.personaId);
  if (!persona.ok) return persona;

  const empresa = empresaDeTrabajo(permiso.value, persona.value.empresaId);
  if (!empresa.ok) return empresa;
  if (persona.value.empresaId !== empresa.value) {
    return err(new DomainError("NOT_FOUND", "persona de otra empresa"));
  }
  if (persona.value.activa) {
    return err(new DomainError("CONFLICT", "ya está activa"));
  }
  return repos.personas.reactivar(persona.value.id);
}

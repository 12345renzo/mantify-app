import type { Actor } from "@/shared/kernel/actor";
import { DomainError } from "@/shared/kernel/errors";
import { err, ok, type Result } from "@/shared/kernel/result";
import { empresaDeTrabajo, exigirPermiso } from "./acceso";
import type { PersonaEntrada } from "./esquemas";
import type { PersonasRepositorio } from "./repositorios";

// Una persona puede existir sin cuenta (técnico de cuadrilla): figura en el personal pero no entra a la app.
export async function crearPersona(
  actor: Actor | null,
  entrada: { empresaId: string | null; persona: PersonaEntrada },
  repos: { personas: PersonasRepositorio },
): Promise<Result<{ id: string }>> {
  const permiso = exigirPermiso(actor, "crear", "personas");
  if (!permiso.ok) return permiso;
  const empresa = empresaDeTrabajo(permiso.value, entrada.empresaId);
  if (!empresa.ok) return empresa;
  return repos.personas.crear(empresa.value, entrada.persona, permiso.value.id);
}

// Persona para una cuenta: una existente (activa, de la empresa y sin cuenta) o una nueva.
export async function resolverPersonaParaCuenta(
  actor: Actor,
  empresaId: string,
  personaId: string | null,
  nueva: PersonaEntrada | null,
  personas: PersonasRepositorio,
): Promise<Result<string>> {
  if (personaId) {
    const p = await personas.obtener(personaId);
    if (!p.ok) return p;
    if (p.value.empresaId !== empresaId || !p.value.activa) {
      return err(
        new DomainError("VALIDATION", "persona de otra empresa o de baja"),
      );
    }
    if (p.value.cuenta) {
      return err(new DomainError("CONFLICT", "la persona ya tiene cuenta"));
    }
    return ok(p.value.id);
  }
  if (!nueva) return err(new DomainError("VALIDATION", "falta la persona"));
  const creada = await personas.crear(empresaId, nueva, actor.id);
  if (!creada.ok) return creada;
  return ok(creada.value.id);
}

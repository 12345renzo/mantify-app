import type { Actor } from "@/shared/kernel/actor";
import { DomainError } from "@/shared/kernel/errors";
import { err, type Result } from "@/shared/kernel/result";
import { rolesQuePuedeGestionar } from "../domain/permisos";
import { empresaDeTrabajo, exigirPermiso } from "./acceso";
import type { PersonasRepositorio } from "./repositorios";

// Baja lógica: la persona queda en BAJA con su historial, su cuenta queda libre y sin acceso
// hasta que se le asigne otra persona.
export async function darDeBajaPersona(
  actor: Actor | null,
  entrada: { personaId: string },
  repos: { personas: PersonasRepositorio },
): Promise<Result<void>> {
  const permiso = exigirPermiso(actor, "dar_baja", "personas");
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
  if (!p.activa) return err(new DomainError("CONFLICT", "ya está de baja"));
  if (p.cuenta) {
    if (p.cuenta.id === quien.id) {
      return err(
        new DomainError("FORBIDDEN", "no puede darse de baja a sí mismo"),
      );
    }
    if (!rolesQuePuedeGestionar(quien.rol).some((r) => r === p.cuenta?.rol)) {
      return err(
        new DomainError(
          "FORBIDDEN",
          `no puede dar de baja a un ${p.cuenta.rol}`,
        ),
      );
    }
  }
  return repos.personas.darDeBaja(p.id);
}

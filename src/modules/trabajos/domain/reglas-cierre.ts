import { DomainError } from "@/shared/kernel/errors";
import { err, ok, type Result } from "@/shared/kernel/result";
import { transicionar, type EstadoBacklog } from "./backlog-estado";
import { MAX_FOTOS } from "./fotos";

export type UsuarioCierre = {
  id: string;
  rol: string | null;
  personaId: string | null;
  tieneFirma: boolean;
};

export type TrabajoCierre = {
  estado: EstadoBacklog;
  ot: { responsableId: string; abierta: boolean } | null;
  fotosDespues: number;
};

// Sin OT abierta no pasa a validación; sin firma no se cierra; el técnico solo cierra su OT.
export function puedeCerrar(
  usuario: UsuarioCierre,
  trabajo: TrabajoCierre,
  empresa: { planificadorPuedeValidar: boolean },
  fotosNuevas = 0,
): Result<void> {
  const t = transicionar(trabajo.estado, "CERRAR_RM", usuario.rol, {
    esPropio: false,
    planificadorPuedeValidar: empresa.planificadorPuedeValidar,
  });
  if (!t.ok) return t;
  if (!trabajo.ot?.abierta) {
    return err(new DomainError("VALIDATION", "sin_ot"));
  }
  if (
    usuario.rol === "TECNICO" &&
    trabajo.ot.responsableId !== usuario.personaId
  ) {
    return err(new DomainError("FORBIDDEN", "no_responsable"));
  }
  if (!usuario.tieneFirma) {
    return err(new DomainError("VALIDATION", "sin_firma"));
  }
  if (trabajo.fotosDespues + fotosNuevas > MAX_FOTOS) {
    return err(new DomainError("VALIDATION", "fotos_maximo"));
  }
  return ok(undefined);
}

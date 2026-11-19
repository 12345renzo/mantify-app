import { DomainError } from "@/shared/kernel/errors";
import { err, ok, type Result } from "@/shared/kernel/result";
import { puedeValidar } from "@/modules/identidad/domain/permisos";

export const ESTADOS_BACKLOG = {
  PENDIENTE: "Pendiente",
  EN_PROCESO: "En proceso",
  PENDIENTE_VALIDACION: "Por validar",
  COMPLETADO: "Completado",
} as const;
export type EstadoBacklog = keyof typeof ESTADOS_BACKLOG;

export const CRITICIDADES = {
  ALTA: "Alta",
  MEDIA: "Media",
  BAJA: "Baja",
} as const;
export type Criticidad = keyof typeof CRITICIDADES;

export type EventoBacklog =
  "ABRIR_OT" | "CERRAR_RM" | "APROBAR" | "DEVOLVER" | "REABRIR";

export const EVENTOS: readonly EventoBacklog[] = [
  "ABRIR_OT",
  "CERRAR_RM",
  "APROBAR",
  "DEVOLVER",
  "REABRIR",
];

const TRANSICIONES: Record<
  EventoBacklog,
  { desde: EstadoBacklog; hacia: EstadoBacklog }
> = {
  ABRIR_OT: { desde: "PENDIENTE", hacia: "EN_PROCESO" },
  CERRAR_RM: { desde: "EN_PROCESO", hacia: "PENDIENTE_VALIDACION" },
  APROBAR: { desde: "PENDIENTE_VALIDACION", hacia: "COMPLETADO" },
  DEVOLVER: { desde: "PENDIENTE_VALIDACION", hacia: "EN_PROCESO" },
  REABRIR: { desde: "COMPLETADO", hacia: "EN_PROCESO" },
};

export type ContextoTransicion = {
  // Quien valida es quien cerró el RM.
  esPropio: boolean;
  planificadorPuedeValidar: boolean;
};

function rolPermitido(
  evento: EventoBacklog,
  rol: string | null,
  ctx: ContextoTransicion,
): boolean {
  switch (evento) {
    case "ABRIR_OT":
      return rol === "PLANIFICADOR" || rol === "SUPERVISOR";
    case "CERRAR_RM":
      return (
        rol === "PLANIFICADOR" || rol === "SUPERVISOR" || rol === "TECNICO"
      );
    default:
      return puedeValidar(rol, {
        planificadorPuedeValidar: ctx.planificadorPuedeValidar,
      });
  }
}

// La misma máquina que aplican las funciones de la base. Devuelve el estado nuevo o por qué no.
export function transicionar(
  estado: EstadoBacklog,
  evento: EventoBacklog,
  rol: string | null,
  ctx: ContextoTransicion,
): Result<EstadoBacklog> {
  if (!rolPermitido(evento, rol, ctx)) {
    return err(new DomainError("FORBIDDEN", "no autorizado"));
  }
  // Nadie valida su propio cierre; el planificador autorizado es la excepción.
  if (
    (evento === "APROBAR" || evento === "DEVOLVER") &&
    ctx.esPropio &&
    rol !== "PLANIFICADOR"
  ) {
    return err(new DomainError("FORBIDDEN", "propio_cierre"));
  }
  const t = TRANSICIONES[evento];
  if (estado !== t.desde) {
    return err(new DomainError("CONFLICT", "estado_cambio"));
  }
  return ok(t.hacia);
}

// Botones que se muestran en el detalle.
export function eventosDisponibles(
  estado: EstadoBacklog,
  rol: string | null,
  ctx: ContextoTransicion,
): EventoBacklog[] {
  return EVENTOS.filter((e) => transicionar(estado, e, rol, ctx).ok);
}

// Abierto: planificador, supervisor o el técnico que lo creó. Cerrado: solo un validador, con motivo
// (queda en auditoría como CORRECCION).
export function puedeEditar(
  estado: EstadoBacklog,
  rol: string | null,
  esCreador: boolean,
  ctx: { planificadorPuedeValidar: boolean },
): { permitido: boolean; exigeMotivo: boolean } {
  if (estado === "PENDIENTE_VALIDACION" || estado === "COMPLETADO") {
    return { permitido: puedeValidar(rol, ctx), exigeMotivo: true };
  }
  return {
    permitido:
      rol === "PLANIFICADOR" ||
      rol === "SUPERVISOR" ||
      (rol === "TECNICO" && esCreador),
    exigeMotivo: false,
  };
}

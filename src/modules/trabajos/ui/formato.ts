import type { Criticidad, EstadoBacklog } from "../domain/backlog-estado";

export const COLOR_ESTADO_BACKLOG: Record<EstadoBacklog, string> = {
  PENDIENTE: "bg-surface-2 text-muted",
  EN_PROCESO: "bg-primary-soft text-primary",
  PENDIENTE_VALIDACION: "bg-warn-soft text-warn",
  COMPLETADO: "bg-ok-soft text-ok",
};

export const COLOR_CRITICIDAD: Record<Criticidad, string> = {
  ALTA: "bg-bad-soft text-bad",
  MEDIA: "bg-warn-soft text-warn",
  BAJA: "bg-surface-2 text-muted",
};

export const EVENTOS_HISTORIAL: Record<string, string> = {
  CREAR: "Backlog creado",
  ABRIR_OT: "OT abierta",
  CERRAR_RM: "Cerrado con RM",
  APROBAR: "Aprobado",
  DEVOLVER: "Devuelto",
  REABRIR: "Reabierto",
  CORRECCION: "Corrección tras cierre",
};

export const ESTADOS_REQUISICION = {
  SOLICITADA: "Solicitada",
  ENTREGADA: "Entregada",
  ANULADA: "Anulada",
} as const;

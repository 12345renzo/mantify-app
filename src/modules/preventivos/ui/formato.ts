import type { Resultado } from "../domain/actividad-observada";
import type { EstadoPreventivo } from "../domain/preventivo-estado";
import type { Situacion } from "../domain/vencimiento";

export const COLOR_ESTADO_PREVENTIVO: Record<EstadoPreventivo, string> = {
  PROGRAMADO: "bg-surface-2 text-muted",
  DEVUELTO: "bg-bad-soft text-bad",
  COMPLETADO: "bg-warn-soft text-warn",
  VALIDADO: "bg-ok-soft text-ok",
};

export const SITUACION: Record<Situacion, { texto: string; color: string }> = {
  VENCIDO: { texto: "Vencido", color: "bg-bad-soft text-bad" },
  ALERTA: { texto: "Próximo", color: "bg-warn-soft text-warn" },
  AL_DIA: { texto: "Al día", color: "bg-surface-2 text-muted" },
};

export const COLOR_RESULTADO: Record<Resultado, string> = {
  OK: "bg-ok-soft text-ok",
  OBSERVADO: "bg-warn-soft text-warn",
  NO_APLICA: "bg-surface-2 text-muted",
};

export const EVENTOS_PREVENTIVO: Record<string, string> = {
  PROGRAMAR: "Programado",
  IMPORTAR: "Importado",
  EJECUTAR: "Ejecutado",
  APROBAR: "Validado",
  DEVOLVER: "Devuelto",
  REPROGRAMAR: "Reprogramado",
};

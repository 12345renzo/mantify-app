import { puedeValidar } from "@/modules/identidad/domain/permisos";

export const ESTADOS_PREVENTIVO = {
  PROGRAMADO: "Programado",
  DEVUELTO: "Devuelto",
  COMPLETADO: "Por validar",
  VALIDADO: "Validado",
} as const;
export type EstadoPreventivo = keyof typeof ESTADOS_PREVENTIVO;

export const TIPOS_PM = ["PM1", "PM2", "PM3", "PM4"] as const;
export type TipoPM = (typeof TIPOS_PM)[number];

export const TURNOS = { DIA: "Día", NOCHE: "Noche" } as const;
export type Turno = keyof typeof TURNOS;

const ESCRIBEN = ["PLANIFICADOR", "SUPERVISOR", "TECNICO"];

// Programar, importar y reprogramar: planificación.
export const programa = (rol: string | null) =>
  rol === "PLANIFICADOR" || rol === "SUPERVISOR";

// Se ejecuta lo programado o lo devuelto. El técnico solo lo que tiene asignado.
export function puedeEjecutar(
  estado: EstadoPreventivo,
  rol: string | null,
  esResponsable: boolean,
): boolean {
  if (estado !== "PROGRAMADO" && estado !== "DEVUELTO") return false;
  if (rol === "TECNICO") return esResponsable;
  return rol !== null && ESCRIBEN.includes(rol);
}

// Nadie valida lo que ejecutó; el planificador autorizado es la excepción (como en backlogs).
export function puedeValidarPreventivo(
  estado: EstadoPreventivo,
  rol: string | null,
  ctx: { esPropio: boolean; planificadorPuedeValidar: boolean },
): boolean {
  return (
    estado === "COMPLETADO" &&
    puedeValidar(rol, ctx) &&
    (!ctx.esPropio || rol === "PLANIFICADOR")
  );
}

// Código del equipo: mayúsculas y sin espacios. "eq 001" y "EQ001" son el mismo equipo.
export function normalizarCodigo(texto: string): string {
  return texto.normalize("NFKC").replace(/\s+/g, "").toUpperCase();
}

// Misma regla que el CHECK de la base.
export const CODIGO_VALIDO = /^[A-Z0-9][A-Z0-9._/-]{0,29}$/;

export const ESTADOS_OPERATIVOS = {
  OPERATIVO: "Operativo",
  INOPERATIVO: "Inoperativo",
  EN_MANTENIMIENTO: "En mantenimiento",
} as const;
export type EstadoOperativo = keyof typeof ESTADOS_OPERATIVOS;

export const ESTADOS_MOVILIZACION = {
  MOVILIZADO: "Movilizado",
  PENDIENTE: "Pendiente",
  DESMOVILIZADO: "Desmovilizado",
} as const;
export type EstadoMovilizacion = keyof typeof ESTADOS_MOVILIZACION;

export const ORIGENES_LECTURA = {
  MANUAL: "Manual",
  IMPORTACION: "Importación",
  BACKLOG: "Backlog / OT",
  PREVENTIVO: "Preventivo",
  PARADA: "Parada",
  ENGRASE: "Engrase",
  NEUMATICO: "Neumático",
} as const;
export type OrigenLectura = keyof typeof ORIGENES_LECTURA;

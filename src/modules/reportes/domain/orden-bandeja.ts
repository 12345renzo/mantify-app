import type { Criticidad } from "@/modules/trabajos/domain/backlog-estado";

// Orden fijo de desempate entre tipos, el mismo en que el corte 10 los lista.
export const TIPOS_BANDEJA = [
  "PARADA",
  "VALIDACION",
  "BACKLOG",
  "PREVENTIVO",
  "ENGRASE",
  "NEUMATICO",
] as const;
export type TipoBandeja = (typeof TIPOS_BANDEJA)[number];

// Cada fuente calcula su propio atraso y criticidad al leer; aquí solo se ordena.
export type ItemBandeja = {
  tipo: TipoBandeja;
  codigo: string;
  // Null cuando el tipo no tiene criticidad propia: va después de BAJA.
  criticidad: Criticidad | null;
  atrasoDias: number;
  devuelto: boolean;
};

const PESO: Record<Criticidad, number> = { ALTA: 0, MEDIA: 1, BAJA: 2 };
const peso = (c: Criticidad | null) => (c === null ? 3 : PESO[c]);

// Devueltos primero, luego criticidad, luego más atraso; desempate fijo por tipo y código.
export function ordenarBandeja<T extends ItemBandeja>(items: T[]): T[] {
  return [...items].sort(
    (a, b) =>
      Number(b.devuelto) - Number(a.devuelto) ||
      peso(a.criticidad) - peso(b.criticidad) ||
      b.atrasoDias - a.atrasoDias ||
      TIPOS_BANDEJA.indexOf(a.tipo) - TIPOS_BANDEJA.indexOf(b.tipo) ||
      a.codigo.localeCompare(b.codigo),
  );
}

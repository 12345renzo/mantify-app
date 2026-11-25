// Mismos topes que los CHECK de la base.
export const COCADA_MAX = 150;
export const MARGEN_MEDICION = 5;
export const PRESION_MAX = 200;

export type Puntos = { interno: number; centro: number; externo: number };

export type Umbrales = {
  cocadaMinima: number;
  cocadaAlerta: number;
  diasSinMedir: number;
  diferenciaMaxima: number;
};

export const SALUDES = [
  "CAMBIAR",
  "ALERTA",
  "MEDIR",
  "SIN_UMBRAL",
  "OK",
] as const;
export type Salud = (typeof SALUDES)[number];

export const cocada = (p: Puntos) => Math.min(p.interno, p.centro, p.externo);

const redondear = (n: number) => Math.round(n * 100) / 100;
export const diferencia = (p: Puntos) =>
  redondear(
    Math.max(p.interno, p.centro, p.externo) -
      Math.min(p.interno, p.centro, p.externo),
  );

// Los del equipo reemplazan a los de su categoría.
export function umbralesEfectivos(
  equipo: Umbrales | null,
  categoria: Umbrales | null,
): Umbrales | null {
  return equipo ?? categoria;
}

export function saludCubierta(
  cocadaActual: number,
  umbrales: Umbrales | null,
  diasSinMedir: number,
): Salud {
  if (!umbrales) return "SIN_UMBRAL";
  if (cocadaActual <= umbrales.cocadaMinima) return "CAMBIAR";
  if (cocadaActual <= umbrales.cocadaAlerta) return "ALERTA";
  if (diasSinMedir >= umbrales.diasSinMedir) return "MEDIR";
  return "OK";
}

// Se avisa aparte: no cambia la salud.
export function desgasteIrregular(
  dif: number | null,
  umbrales: Umbrales | null,
): boolean {
  return dif !== null && umbrales !== null && dif >= umbrales.diferenciaMaxima;
}

export function ordenarPorSalud<T extends { salud: Salud }>(filas: T[]): T[] {
  return [...filas].sort(
    (a, b) => SALUDES.indexOf(a.salud) - SALUDES.indexOf(b.salud),
  );
}

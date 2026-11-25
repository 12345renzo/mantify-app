import type { EstadoNeumatico, Medidor } from "../application/repositorios";
import type { Salud } from "../domain/salud";

export const SALUD: Record<
  Salud,
  { texto: string; color: string; indicador: string }
> = {
  CAMBIAR: {
    texto: "Cambiar",
    color: "bg-bad-soft text-bad",
    indicador: "text-bad",
  },
  ALERTA: {
    texto: "Alerta",
    color: "bg-warn-soft text-warn",
    indicador: "text-warn",
  },
  MEDIR: {
    texto: "Medir",
    color: "bg-primary-soft text-primary",
    indicador: "text-primary",
  },
  SIN_UMBRAL: {
    texto: "Sin umbral",
    color: "bg-surface-2 text-muted",
    indicador: "text-fg",
  },
  OK: { texto: "OK", color: "bg-ok-soft text-ok", indicador: "text-ok" },
};

export const ESTADO_NEUMATICO: Record<EstadoNeumatico, string> = {
  STOCK: "En stock",
  MONTADO: "Montado",
  RECAPADO: "En recapado",
  BAJA: "De baja",
};

export const EVENTO_NEUMATICO: Record<string, string> = {
  CARGA: "Carga",
  EDICION: "Edición",
  MONTAJE: "Montaje",
  ROTACION: "Rotación",
  DESMONTAJE: "Desmontaje",
  RECAPADO: "Recapado",
};

const nf = new Intl.NumberFormat("es-PE", { maximumFractionDigits: 2 });
// Los costos de neumáticos van en soles (decisión del corte 9).
const soles = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
});

export const unidad = (m: Medidor) => (m === "KILOMETROS" ? "km" : "h");
export const mm = (n: number) => `${nf.format(n)} mm`;
export const numero = (n: number) => nf.format(n);
export const moneda = (n: number | null) =>
  n === null ? "—" : soles.format(n);
export const costoUnidad = (n: number | null, m: Medidor) =>
  n === null ? "—" : `${soles.format(n)} / ${unidad(m)}`;

import type { Medidor } from "../application/repositorios";
import type { EstadoEngrase, TipoAviso } from "../domain/estado-engrase";

export const ESTADO_ENGRASE: Record<
  EstadoEngrase,
  { texto: string; color: string; indicador: string }
> = {
  VENCIDO: {
    texto: "Vencido",
    color: "bg-bad-soft text-bad",
    indicador: "text-bad",
  },
  POR_VENCER: {
    texto: "Por vencer",
    color: "bg-warn-soft text-warn",
    indicador: "text-warn",
  },
  SIN_REGISTRO: {
    texto: "Sin registro",
    color: "bg-primary-soft text-primary",
    indicador: "text-primary",
  },
  AL_DIA: {
    texto: "Al día",
    color: "bg-ok-soft text-ok",
    indicador: "text-ok",
  },
  SIN_PLAN: {
    texto: "Sin plan",
    color: "bg-surface-2 text-muted",
    indicador: "text-fg",
  },
};

export const TIPO_AVISO: Record<TipoAviso, string> = {
  PORCENTAJE: "Porcentaje del intervalo",
  HORAS: "Horas (o km) fijas",
  DIAS: "Días fijos",
};

const nf = new Intl.NumberFormat("es-PE", { maximumFractionDigits: 2 });

export const unidad = (m: Medidor) => (m === "KILOMETROS" ? "km" : "h");

// "40 h · 2 d"; negativo = ya se pasó.
export function formatoRestante(f: {
  restanteHoras: number | null;
  restanteDias: number | null;
  medidor: Medidor;
}): string {
  const partes: string[] = [];
  if (f.restanteHoras !== null) {
    partes.push(`${nf.format(f.restanteHoras)} ${unidad(f.medidor)}`);
  }
  if (f.restanteDias !== null) partes.push(`${f.restanteDias} d`);
  return partes.join(" · ") || "—";
}

export function formatoFrecuencia(
  plan: { cadaHoras: number | null; cadaDias: number | null },
  medidor: Medidor,
): string {
  const partes: string[] = [];
  if (plan.cadaHoras !== null) {
    partes.push(`cada ${nf.format(plan.cadaHoras)} ${unidad(medidor)}`);
  }
  if (plan.cadaDias !== null) partes.push(`cada ${plan.cadaDias} días`);
  return partes.join(" o ");
}

export const formatoNumero = (n: number) => nf.format(n);

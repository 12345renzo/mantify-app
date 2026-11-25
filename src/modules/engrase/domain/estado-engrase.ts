import { HOROMETRO_MAX } from "@/modules/equipos/domain/horometro";
import { DomainError } from "@/shared/kernel/errors";
import { diasEntre, sumarDias, type FechaISO } from "@/shared/kernel/fechas";
import { err, ok, type Result } from "@/shared/kernel/result";

export const ESTADOS_ENGRASE = [
  "VENCIDO",
  "POR_VENCER",
  "SIN_REGISTRO",
  "AL_DIA",
  "SIN_PLAN",
] as const;
export type EstadoEngrase = (typeof ESTADOS_ENGRASE)[number];

export const TIPOS_AVISO = ["PORCENTAJE", "HORAS", "DIAS"] as const;
export type TipoAviso = (typeof TIPOS_AVISO)[number];
// Mismos rangos que el CHECK de empresas.
export const RANGO_AVISO: Record<TipoAviso, { min: number; max: number }> = {
  PORCENTAJE: { min: 1, max: 100 },
  HORAS: { min: 1, max: 100_000 },
  DIAS: { min: 1, max: 3650 },
};

export type Umbral = { tipo: TipoAviso; valor: number };
export type Frecuencia = { cadaHoras: number | null; cadaDias: number | null };
export type UltimoCompleto = { fecha: FechaISO; horometro: number };
export type Situacion = {
  estado: EstadoEngrase;
  // Negativo = pasado. Null si el plan no mide en esa unidad (o no aplica el estado).
  restanteHoras: number | null;
  restanteDias: number | null;
};

const redondear = (n: number) => Math.round(n * 100) / 100;

function margen(intervalo: number, umbral: Umbral, unidad: "HORAS" | "DIAS") {
  if (umbral.tipo === "PORCENTAJE") return (intervalo * umbral.valor) / 100;
  return umbral.tipo === unidad ? umbral.valor : null;
}

// Lo que venza primero manda. Cumplido justo el intervalo ya es vencido.
export function calcularEstado(
  plan: Frecuencia | null,
  ultimo: UltimoCompleto | null,
  lectura: number,
  hoy: FechaISO,
  umbral: Umbral,
): Situacion {
  if (!plan)
    return { estado: "SIN_PLAN", restanteHoras: null, restanteDias: null };
  if (!ultimo) {
    return { estado: "SIN_REGISTRO", restanteHoras: null, restanteDias: null };
  }
  const restanteHoras =
    plan.cadaHoras === null
      ? null
      : redondear(ultimo.horometro + plan.cadaHoras - lectura);
  const restanteDias =
    plan.cadaDias === null
      ? null
      : diasEntre(hoy, sumarDias(ultimo.fecha, plan.cadaDias));
  const partes = [
    {
      restante: restanteHoras,
      margen: plan.cadaHoras && margen(plan.cadaHoras, umbral, "HORAS"),
    },
    {
      restante: restanteDias,
      margen: plan.cadaDias && margen(plan.cadaDias, umbral, "DIAS"),
    },
  ].filter((p) => p.restante !== null) as {
    restante: number;
    margen: number | null;
  }[];

  const estado = partes.some((p) => p.restante <= 0)
    ? "VENCIDO"
    : partes.some((p) => p.margen !== null && p.restante <= p.margen)
      ? "POR_VENCER"
      : "AL_DIA";
  return { estado, restanteHoras, restanteDias };
}

export function ordenarPorEstado<T extends { estado: EstadoEngrase }>(
  filas: T[],
): T[] {
  return [...filas].sort(
    (a, b) =>
      ESTADOS_ENGRASE.indexOf(a.estado) - ESTADOS_ENGRASE.indexOf(b.estado),
  );
}

// Solo un registro completo reinicia el vencimiento.
export function esRegistroCompleto(total: number, engrasados: number): boolean {
  return total > 0 && engrasados === total;
}

// No menor que el último engrase. Si el horómetro actual quedó por debajo de ese engrase,
// el planificador lo corrigió a la baja: se omite la comparación para no bloquear el equipo.
export function validarHorometroEngrase(
  nuevo: number,
  ultimoEngrase: number | null,
  actual: number,
): Result<void> {
  if (!Number.isFinite(nuevo) || nuevo < 0 || nuevo > HOROMETRO_MAX) {
    return err(new DomainError("VALIDATION", "horometro_no_valido"));
  }
  if (
    ultimoEngrase !== null &&
    actual >= ultimoEngrase &&
    nuevo < ultimoEngrase
  ) {
    return err(new DomainError("VALIDATION", "horometro_menor"));
  }
  return ok(undefined);
}

export type Punto = { id: string; descripcion: string; orden: number };
export type Plantilla = Punto & { categoriaId: string | null };

// Puntos propios del equipo; si no tiene, las plantillas de su categoría y las generales.
// La base repite esta regla en registrar_engrase.
export function puntosEfectivos(
  propios: Punto[],
  plantillas: Plantilla[],
  categoriaId: string,
): Punto[] {
  if (propios.length > 0) return propios;
  return plantillas
    .filter((p) => p.categoriaId === null || p.categoriaId === categoriaId)
    .sort(
      (a, b) => a.orden - b.orden || a.descripcion.localeCompare(b.descripcion),
    )
    .map(({ id, descripcion, orden }) => ({ id, descripcion, orden }));
}

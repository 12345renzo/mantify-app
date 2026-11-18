// Fechas de calendario como texto ISO "YYYY-MM-DD". Se opera en UTC para que no influya la zona del servidor.
export type FechaISO = string;

const DIA_MS = 86_400_000;

function aUtc(fecha: FechaISO): number {
  const [anio, mes, dia] = fecha.split("-").map(Number);
  return Date.UTC(anio, mes - 1, dia);
}

export function diasEntre(desde: FechaISO, hasta: FechaISO): number {
  return Math.round((aUtc(hasta) - aUtc(desde)) / DIA_MS);
}

export function sumarDias(fecha: FechaISO, dias: number): FechaISO {
  return new Date(aUtc(fecha) + dias * DIA_MS).toISOString().slice(0, 10);
}

export function esFechaISO(texto: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(texto)) return false;
  return sumarDias(texto, 0) === texto;
}

// "Hoy" de la empresa: el negocio corre en hora de Perú.
export function hoyEn(zonaHoraria: string, ahora: Date = new Date()): FechaISO {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: zonaHoraria,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(ahora);
}

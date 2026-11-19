// Fecha y hora local de la empresa como texto "YYYY-MM-DDTHH:MM" (lo que da un <input type="datetime-local">).
// Se opera en UTC para que no influya la zona del servidor: inicio y fin están en la misma zona.
export type FechaHora = string;

const FORMATO = /^(\d{4})-(\d{2})-(\d{2})T([01]\d|2[0-3]):([0-5]\d)$/;

function aMs(t: FechaHora): number {
  const m = FORMATO.exec(t);
  if (!m) return NaN;
  const [, a, mes, d, h, min] = m.map(Number);
  return Date.UTC(a, mes - 1, d, h, min);
}

export function esFechaHora(t: string): t is FechaHora {
  const ms = aMs(t);
  return !Number.isNaN(ms) && new Date(ms).toISOString().slice(0, 16) === t;
}

// Horas entre dos momentos, también cruzando días. Negativo si el fin es anterior.
export function duracionHoras(inicio: FechaHora, fin: FechaHora): number {
  return Math.round(((aMs(fin) - aMs(inicio)) / 3_600_000) * 100) / 100;
}

export const fechaDe = (t: FechaHora) => t.slice(0, 10);

// "Ahora" en la zona de la empresa, del reloj del servidor.
export function ahoraEn(
  zonaHoraria: string,
  ahora: Date = new Date(),
): FechaHora {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: zonaHoraria,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(ahora)
      .map((x) => [x.type, x.value]),
  );
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}

// "HH:MM" de 00:00 a 23:59.
export const HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

const minutos = (h: string) => {
  const [hh, mm] = h.split(":").map(Number);
  return hh * 60 + mm;
};

// Si la hora de fin es menor que la de inicio, el trabajo cruzó la medianoche: se suman 24 h.
// Misma regla que la función ejecutar_preventivo de la base. Inicio = fin da 0 (no válido).
export function duracionHoras(inicio: string, fin: string): number {
  let m = minutos(fin) - minutos(inicio);
  if (m < 0) m += 24 * 60;
  return Math.round((m / 60) * 100) / 100;
}

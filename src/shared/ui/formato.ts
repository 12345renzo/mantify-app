// es-PE escribe "USD 380"; en Perú se lee mejor "US$ 380" (y "S/ 380" para soles, que ya sale así).
export function formatoMoneda(monto: number, moneda: string): string {
  const texto = new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: moneda,
    minimumFractionDigits: monto % 1 === 0 ? 0 : 2,
  }).format(monto);
  return moneda === "USD" ? texto.replace("USD", "US$") : texto;
}

// Fecha de calendario "YYYY-MM-DD" → "17 nov 2026". Se lee en UTC para que no cambie de día.
export function formatoFecha(fecha: string | null): string {
  if (!fecha) return "—";
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  })
    .format(new Date(`${fecha.slice(0, 10)}T00:00:00Z`))
    .replace(".", "");
}

export function formatoFechaHora(
  instante: string,
  zonaHoraria = "America/Lima",
): string {
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: zonaHoraria,
  }).format(new Date(instante));
}

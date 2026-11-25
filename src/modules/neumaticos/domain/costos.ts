const redondear = (n: number) => Math.round(n * 100) / 100;

// Sin costo o sin horas no hay costo por hora: null, nunca cero. En equipos de km es por km.
export function costoPorHora(
  costoTotal: number | null,
  horas: number,
): number | null {
  return costoTotal === null || horas <= 0
    ? null
    : redondear(costoTotal / horas);
}

export type PuntoDesgaste = { horometro: number; cocada: number };

// Solo con mediciones del ciclo actual (después del último recapado). Es del plan Pro.
export function proyeccion(
  mediciones: PuntoDesgaste[],
  cocadaMinima: number,
): { desgastePorHora: number; horasRestantes: number } | null {
  if (mediciones.length < 2) return null;
  const orden = [...mediciones].sort((a, b) => a.horometro - b.horometro);
  const primera = orden[0];
  const ultima = orden[orden.length - 1];
  const horas = ultima.horometro - primera.horometro;
  const desgaste = primera.cocada - ultima.cocada;
  if (horas <= 0 || desgaste <= 0) return null;
  const porHora = desgaste / horas;
  return {
    desgastePorHora: Math.round(porHora * 10000) / 10000,
    horasRestantes: Math.max(
      0,
      Math.round((ultima.cocada - cocadaMinima) / porHora),
    ),
  };
}

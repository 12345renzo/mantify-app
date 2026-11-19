import { duracionHoras, type FechaHora } from "./duracion";

export type TramoParada = {
  id?: string;
  equipoId: string;
  motivo: string;
  inicio: FechaHora;
  // null = sigue abierta.
  fin: FechaHora | null;
};

export type Advertencia = {
  codigo: "SALIDA_ANTES" | "HOROMETRO_BAJA" | "DUPLICADO" | "CRUCE";
  // Las que bloquean no se pueden guardar; el cruce se avisa y se confirma.
  bloquea: boolean;
};

export const MAX_FOTOS_PARADA = 5;

const FIN_ABIERTO = "9999-12-31T23:59";

function seCruzan(a: TramoParada, b: TramoParada): boolean {
  return a.inicio < (b.fin ?? FIN_ABIERTO) && b.inicio < (a.fin ?? FIN_ABIERTO);
}

// Revisión al iniciar o cerrar. Las mismas reglas las repite la base (CHECK, índice único y cruce).
export function revisarParada(
  parada: TramoParada & {
    horometroInicio: number;
    horometroFin: number | null;
  },
  otras: TramoParada[],
): Advertencia[] {
  const avisos: Advertencia[] = [];
  if (parada.fin !== null && duracionHoras(parada.inicio, parada.fin) <= 0) {
    avisos.push({ codigo: "SALIDA_ANTES", bloquea: true });
  }
  if (
    parada.horometroFin !== null &&
    parada.horometroFin < parada.horometroInicio
  ) {
    avisos.push({ codigo: "HOROMETRO_BAJA", bloquea: true });
  }
  const mismas = otras.filter(
    (o) => o.equipoId === parada.equipoId && o.id !== parada.id,
  );
  if (
    mismas.some((o) => o.motivo === parada.motivo && o.inicio === parada.inicio)
  ) {
    avisos.push({ codigo: "DUPLICADO", bloquea: true });
  }
  if (mismas.some((o) => seCruzan(parada, o))) {
    avisos.push({ codigo: "CRUCE", bloquea: false });
  }
  return avisos;
}

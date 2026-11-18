import type { EstadoOperativo } from "../domain/equipo";

// "1,500.5 h" / "82,300 km"
export function formatoHorometro(valor: number, tipo: "HORAS" | "KILOMETROS") {
  const n = new Intl.NumberFormat("es-PE", { maximumFractionDigits: 2 }).format(
    valor,
  );
  return `${n} ${tipo === "KILOMETROS" ? "km" : "h"}`;
}

export const COLOR_ESTADO: Record<EstadoOperativo, string> = {
  OPERATIVO: "bg-ok-soft text-ok",
  INOPERATIVO: "bg-bad-soft text-bad",
  EN_MANTENIMIENTO: "bg-warn-soft text-warn",
};

import type { EstadoMembresia } from "../domain/estado-membresia";

export const ESTADO_UI: Record<
  EstadoMembresia,
  { etiqueta: string; clases: string; punto: string }
> = {
  AL_DIA: {
    etiqueta: "Al día",
    clases: "border-ok/25 bg-ok-soft text-ok",
    punto: "bg-ok",
  },
  POR_VENCER: {
    etiqueta: "Por vencer",
    clases: "border-warn/25 bg-warn-soft text-warn",
    punto: "bg-warn",
  },
  EN_GRACIA: {
    etiqueta: "En gracia",
    clases: "border-grace/25 bg-grace-soft text-grace",
    punto: "bg-grace",
  },
  VENCIDA: {
    etiqueta: "Vencida",
    clases: "border-bad/25 bg-bad-soft text-bad",
    punto: "bg-bad",
  },
  INACTIVA: {
    etiqueta: "Inactiva",
    clases: "border-border bg-surface-2 text-muted",
    punto: "bg-muted",
  },
};

export function EstadoPill({ estado }: { estado: EstadoMembresia }) {
  const ui = ESTADO_UI[estado];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-semibold tracking-[0.04em] whitespace-nowrap uppercase ${ui.clases}`}
    >
      <span
        className={`size-1.5 rounded-full ${ui.punto}`}
        aria-hidden="true"
      />
      {ui.etiqueta}
    </span>
  );
}

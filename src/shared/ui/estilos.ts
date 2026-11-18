// Clases compartidas para que botones y campos se vean igual en todo el proyecto.
// Mismo API que ya usan las pantallas; solo cambia la capa visual.

const baseBoton =
  "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold tracking-tight transition-[background-color,border-color,color,box-shadow,transform] duration-200 active:translate-y-px focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25 disabled:pointer-events-none disabled:opacity-55";

export const boton = {
  primario: `${baseBoton} fondo-primario border border-primary/70 text-primary-fg shadow-[0_1px_2px_rgb(4_50_35/0.22),0_12px_24px_-16px_rgb(4_50_35/0.75),inset_0_1px_0_rgb(255_255_255/0.18)] hover:border-primary-hover hover:brightness-[1.06]`,
  secundario: `${baseBoton} border border-border bg-surface text-fg shadow-[0_1px_2px_rgb(6_36_26/0.05),inset_0_1px_0_rgb(255_255_255/0.35)] hover:border-border-strong hover:bg-surface-2`,
  fantasma: `${baseBoton} text-muted hover:bg-surface-2 hover:text-fg`,
  peligro: `${baseBoton} fondo-primario border border-bad/70 bg-bad text-white shadow-[0_1px_2px_rgb(80_15_10/0.2),0_12px_24px_-16px_rgb(120_20_25/0.7)] hover:brightness-105 dark:text-[#2a0b08]`,
} as const;

export const campo =
  "block w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-fg shadow-[inset_0_1px_2px_rgb(6_36_26/0.05)] transition-[border-color,box-shadow] duration-200 placeholder:text-muted/65 hover:border-border-strong focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15 disabled:opacity-60 aria-[invalid=true]:border-bad aria-[invalid=true]:focus:ring-bad/15";

export const campo2 =
  "block rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-fg shadow-[inset_0_1px_2px_rgb(6_36_26/0.05)] transition-[border-color,box-shadow] duration-200 placeholder:text-muted/65 hover:border-border-strong focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15 disabled:opacity-60 aria-[invalid=true]:border-bad aria-[invalid=true]:focus:ring-bad/15";

export const etiqueta = "mb-1.5 block text-[13px] font-semibold text-fg";

export const tarjeta =
  "rounded-[var(--radius-panel)] border border-border bg-surface shadow-[var(--shadow-card)]";

// Encabezado de bloque dentro de una tarjeta.
export const cabeceraSeccion =
  "flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4 sm:px-6";

// Texto pequeño en versalitas, para metadatos y tablas.
export const micro =
  "text-[10.5px] font-semibold uppercase tracking-[0.16em] text-muted";

// Fila de tabla: el hover no compite con la selección.
export const filaTabla =
  "transition-colors hover:bg-surface-2/70 focus-within:bg-surface-2/70";

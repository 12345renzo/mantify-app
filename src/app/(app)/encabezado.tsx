import type { ComponentType, ReactNode, SVGProps } from "react";

export function Encabezado({
  icono: Icono,
  color,
  titulo,
  descripcion,
  acciones,
  antes,
}: {
  icono: ComponentType<SVGProps<SVGSVGElement>>;
  color: string;
  titulo: ReactNode;
  descripcion?: ReactNode;
  acciones?: ReactNode;
  antes?: ReactNode;
}) {
  return (
    <div className="relative mb-8 flex flex-wrap items-end justify-between gap-x-6 gap-y-4 pb-6 sm:mb-9">
      <div className="min-w-0">
        {antes}
        <div className="flex items-start gap-4">
          <span
            className="relative mt-0.5 grid size-12 shrink-0 place-items-center rounded-2xl border border-black/[0.06] shadow-[inset_0_1px_0_rgb(255_255_255/0.45),0_10px_24px_-18px_rgb(6_36_26/0.7)] dark:border-white/[0.07]"
            style={{
              color,
              backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)`,
            }}
          >
            <Icono width={23} height={23} />
            <span
              className="absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full ring-[3px] ring-bg"
              style={{ backgroundColor: color }}
              aria-hidden="true"
            />
          </span>
          <div className="min-w-0">
            <h1 className="text-[1.8rem] leading-[1.03] font-semibold tracking-[-0.05em] text-balance sm:text-[2.25rem]">
              {titulo}
            </h1>
            {descripcion && (
              <div className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
                {descripcion}
              </div>
            )}
          </div>
        </div>
      </div>
      {acciones && (
        <div className="flex flex-wrap items-center gap-2">{acciones}</div>
      )}

      <span
        className="absolute inset-x-0 bottom-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, color-mix(in srgb, var(--primary) 38%, transparent), color-mix(in srgb, var(--lime) 34%, transparent) 44%, transparent 92%)",
        }}
        aria-hidden="true"
      />
    </div>
  );
}

export function Esqueleto({ alto = "h-40" }: { alto?: string }) {
  return (
    <div
      className={`${alto} relative animate-pulse overflow-hidden rounded-[var(--radius-panel)] border border-border bg-surface-2/80`}
      aria-busy="true"
    >
      <span
        className="absolute inset-x-0 top-0 h-px bg-white/50 dark:bg-white/[0.06]"
        aria-hidden="true"
      />
    </div>
  );
}

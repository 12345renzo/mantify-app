export function Logo({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-2.5 font-semibold tracking-tight ${className}`}
    >
      <span className="relative grid size-9 shrink-0 place-items-center rounded-[11px] bg-[var(--logo-bg,var(--primary))] text-[var(--logo-fg,var(--primary-fg))] shadow-[inset_0_1px_0_rgb(255_255_255/0.22),0_8px_22px_-14px_rgb(4_40_28/0.85)]">
        {/* Marco de escaneo + pulso: la flota, medida. */}
        <svg
          viewBox="0 0 24 24"
          width={21}
          height={21}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.9}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path
            d="M3 8V5.5A2.5 2.5 0 0 1 5.5 3H8M16 3h2.5A2.5 2.5 0 0 1 21 5.5V8M21 16v2.5a2.5 2.5 0 0 1-2.5 2.5H16M8 21H5.5A2.5 2.5 0 0 1 3 18.5V16"
            opacity={0.4}
          />
          <path d="M6.5 13h2.7l1.4-4 2.7 7 1.4-3h2.8" />
        </svg>
        <span className="absolute -top-0.5 -right-0.5 size-1.5 rounded-full bg-[var(--logo-dot,var(--lime))] ring-2 ring-[var(--logo-ring,var(--surface))]" />
      </span>
      <span className="flex flex-col leading-none">
        <span className="text-[17px] font-semibold tracking-[-0.035em]">
          Mantify
        </span>
        <span className="mt-1 font-mono text-[8.5px] font-medium tracking-[0.16em] uppercase opacity-55">
          Control de flota
        </span>
      </span>
    </span>
  );
}

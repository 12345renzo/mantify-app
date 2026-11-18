"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { IconoCerrar } from "./iconos";

// <dialog> nativo: atrapa el foco, cierra con Esc y bloquea el fondo sin librerías.
export function Modal({
  abierto,
  onCerrar,
  titulo,
  descripcion,
  children,
}: {
  abierto: boolean;
  onCerrar: () => void;
  titulo: string;
  descripcion?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (abierto && !d.open) d.showModal();
    if (!abierto && d.open) d.close();
  }, [abierto]);

  return (
    <dialog
      ref={ref}
      aria-labelledby="modal-titulo"
      onCancel={(e) => {
        e.preventDefault();
        onCerrar();
      }}
      // Clic en el fondo oscuro (fuera de la caja) cierra.
      onClick={(e) => e.target === e.currentTarget && onCerrar()}
      className="m-auto max-h-[90dvh] w-[min(calc(100%-1.5rem),44rem)] overflow-hidden rounded-[1.25rem] border border-border bg-surface p-0 text-left text-fg shadow-[var(--shadow-pop)] backdrop:bg-[#0c100d]/55 backdrop:backdrop-blur-[3px]"
    >
      {abierto && (
        <div className="animar-aparecer flex max-h-[90dvh] flex-col">
          <div className="filete flex items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6 sm:py-5">
            <div className="min-w-0">
              <p className="mb-1 text-[10px] font-semibold tracking-[0.16em] text-muted uppercase">
                Mantify · formulario
              </p>
              <h2
                id="modal-titulo"
                className="text-lg leading-tight font-semibold tracking-[-0.03em]"
              >
                {titulo}
              </h2>
              {descripcion && (
                <p className="mt-1 max-w-lg text-sm leading-relaxed text-muted">
                  {descripcion}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onCerrar}
              aria-label="Cerrar"
              className="grid size-9 shrink-0 place-items-center rounded-xl border border-transparent text-muted transition-colors hover:border-border hover:bg-surface-2 hover:text-fg"
            >
              <IconoCerrar width={18} height={18} />
            </button>
          </div>
          <div className="min-h-0 overflow-y-auto">{children}</div>
        </div>
      )}
    </dialog>
  );
}

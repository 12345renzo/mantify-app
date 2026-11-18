"use client";

import { useEffect, useRef, useState } from "react";
import { IconoCandado, IconoSalir } from "@/shared/ui/iconos";
import { cerrarSesion } from "../(publico)/login/actions";
import { ModalClave } from "./cuenta/formulario-clave";

// `rol` llega ya como texto para mostrar ("Planificador").
export function MenuPerfil({ email, rol }: { email: string; rol: string }) {
  const [abierto, setAbierto] = useState(false);
  const [claveAbierta, setClaveAbierta] = useState(false);
  const caja = useRef<HTMLDivElement>(null);
  const iniciales = email.slice(0, 2).toUpperCase();

  useEffect(() => {
    if (!abierto) return;
    const fuera = (e: MouseEvent) => {
      if (!caja.current?.contains(e.target as Node)) setAbierto(false);
    };
    const escape = (e: KeyboardEvent) =>
      e.key === "Escape" && setAbierto(false);
    document.addEventListener("mousedown", fuera);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", fuera);
      document.removeEventListener("keydown", escape);
    };
  }, [abierto]);

  return (
    <div ref={caja} className="relative">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        aria-haspopup="menu"
        className={`flex items-center gap-2.5 rounded-full border py-1 pr-2.5 pl-1 transition-colors ${
          abierto
            ? "border-border-strong bg-surface-2"
            : "border-transparent hover:border-border hover:bg-surface-2/70"
        }`}
      >
        <span className="relative grid size-8 place-items-center rounded-full bg-[linear-gradient(145deg,var(--primary),#128f68_62%,#3fb87a)] text-[11px] font-bold tracking-wide text-primary-fg shadow-[inset_0_1px_0_rgb(255_255_255/0.22),0_4px_10px_-5px_rgb(6_50_35/0.7)]">
          {iniciales}
          <span className="absolute -right-px -bottom-px size-2 rounded-full bg-[var(--lime)] ring-2 ring-bg" />
        </span>
        <span className="hidden max-w-44 text-left leading-tight md:block">
          <span className="block truncate text-[13px] font-semibold tracking-[-0.01em]">
            {email}
          </span>
          <span className="block text-[11px] text-muted">{rol}</span>
        </span>
      </button>

      {abierto && (
        <div
          role="menu"
          className="animar-aparecer absolute right-0 mt-2 w-72 overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--shadow-pop)]"
        >
          <div className="relative border-b border-border bg-surface-2/50 px-4 py-4">
            <span
              className="absolute inset-x-0 top-0 h-px"
              style={{
                background:
                  "linear-gradient(90deg, transparent, color-mix(in srgb, var(--primary) 40%, transparent), color-mix(in srgb, var(--lime) 35%, transparent), transparent)",
              }}
              aria-hidden="true"
            />
            <p className="flex items-center gap-2 text-[9.5px] font-semibold tracking-[0.16em] text-muted uppercase">
              <span
                className="size-1.5 rounded-full bg-[var(--lime)] shadow-[0_0_8px_var(--lime)]"
                aria-hidden="true"
              />
              Sesión activa
            </p>
            <div className="mt-3 flex items-center gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[linear-gradient(145deg,var(--primary),#128f68_62%,#3fb87a)] text-[11px] font-bold text-primary-fg">
                {iniciales}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold tracking-tight">
                  {email}
                </span>
                <span className="mt-0.5 block text-xs text-muted">{rol}</span>
              </span>
            </div>
          </div>
          <div className="p-1.5">
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setAbierto(false);
                setClaveAbierta(true);
              }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-fg transition-colors hover:bg-surface-2"
            >
              <span className="grid size-7 place-items-center rounded-lg bg-surface-2 text-muted ring-1 ring-inset ring-border/70">
                <IconoCandado width={15} height={15} />
              </span>
              Cambiar contraseña
            </button>
          </div>
          <form action={cerrarSesion} className="border-t border-border p-1.5">
            <button
              type="submit"
              role="menuitem"
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-bad transition-colors hover:bg-bad-soft"
            >
              <span className="grid size-7 place-items-center rounded-lg bg-bad-soft text-bad ring-1 ring-inset ring-bad/15">
                <IconoSalir width={15} height={15} />
              </span>
              Cerrar sesión
            </button>
          </form>
        </div>
      )}
      <ModalClave
        abierto={claveAbierta}
        onCerrar={() => setClaveAbierta(false)}
      />
    </div>
  );
}

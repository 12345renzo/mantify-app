"use client";

import { useSyncExternalStore } from "react";
import { IconoLuna, IconoSol } from "./iconos";

type Tema = "light" | "dark";

const leerTema = (): Tema =>
  document.documentElement.dataset.theme === "dark" ? "dark" : "light";

const suscribir = (aviso: () => void) => {
  const observador = new MutationObserver(aviso);
  observador.observe(document.documentElement, {
    attributeFilter: ["data-theme"],
  });
  return () => observador.disconnect();
};

export function CambiarTema({ className = "" }: { className?: string }) {
  // En el servidor no hay tema: se pinta el icono claro y se corrige al hidratar.
  const tema = useSyncExternalStore(suscribir, leerTema, () => "light" as Tema);
  const siguiente: Tema = tema === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      onClick={() => {
        document.documentElement.dataset.theme = siguiente;
        try {
          localStorage.setItem("tema", siguiente);
        } catch {
          // Sin almacenamiento (modo privado): el tema dura solo esta visita.
        }
      }}
      aria-label={
        tema === "dark" ? "Cambiar a tema claro" : "Cambiar a tema oscuro"
      }
      title={tema === "dark" ? "Tema claro" : "Tema oscuro"}
      className={`grid size-10 place-items-center rounded-xl border border-border bg-surface text-muted shadow-[0_1px_2px_rgb(6_36_26/0.04)] transition-colors hover:border-border-strong hover:bg-surface-2 hover:text-fg ${className}`}
    >
      {tema === "dark" ? (
        <IconoSol width={17} height={17} />
      ) : (
        <IconoLuna width={17} height={17} />
      )}
    </button>
  );
}

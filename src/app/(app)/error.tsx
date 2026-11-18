"use client";

import { useEffect } from "react";
import { boton, tarjeta } from "@/shared/ui/estilos";
import { IconoParada } from "@/shared/ui/iconos";

export default function ErrorPanel({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div
      className={`${tarjeta} filete mx-auto mt-10 max-w-md overflow-hidden p-8 text-center`}
    >
      <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-bad-soft text-bad ring-1 ring-inset ring-bad/15">
        <IconoParada />
      </span>
      <p className="mt-4 flex items-center justify-center gap-2 font-mono text-[10px] tracking-[0.16em] text-muted uppercase">
        <span className="size-1.5 rounded-full bg-bad" aria-hidden="true" />
        Error de carga
      </p>
      <h1 className="mt-1.5 text-lg font-semibold tracking-[-0.02em]">
        No se pudo cargar esta sección
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Ocurrió un error inesperado. Tus datos no se perdieron. Vuelve a
        intentar en un momento.
      </p>
      <button
        type="button"
        onClick={() => retry()}
        className={`${boton.primario} mt-6`}
      >
        Reintentar
      </button>
    </div>
  );
}

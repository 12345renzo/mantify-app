"use client";

import { useActionState, useState } from "react";
import { boton } from "./estilos";

type Estado = { error?: string; exito?: string };

export function useModal() {
  const [abierto, setAbierto] = useState(false);
  // Cambiar la key al abrir deja el formulario limpio cada vez.
  const [vez, setVez] = useState(0);
  return {
    abierto,
    vez,
    abrir: () => {
      setVez((n) => n + 1);
      setAbierto(true);
    },
    cerrar: () => setAbierto(false),
  };
}

// Server action que cierra el modal cuando sale bien.
export function useAccionModal<E extends Estado>(
  accion: (previo: E, fd: FormData) => Promise<E>,
  onListo: () => void,
) {
  return useActionState<E, FormData>(async (previo, fd) => {
    const r = await accion(previo, fd);
    if (r.exito) onListo();
    return r;
  }, {} as Awaited<E>);
}

export function PieFormulario({
  estado,
  pendiente,
  texto,
  peligro,
  onCerrar,
}: {
  estado: Estado;
  pendiente: boolean;
  texto: string;
  peligro?: boolean;
  onCerrar: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border px-6 py-4">
      {estado.error && (
        <p className="mr-auto text-sm text-bad" aria-live="polite">
          {estado.error}
        </p>
      )}
      <button type="button" onClick={onCerrar} className={boton.secundario}>
        Cancelar
      </button>
      <button
        type="submit"
        disabled={pendiente}
        className={peligro ? boton.peligro : boton.primario}
      >
        {pendiente ? "Guardando…" : texto}
      </button>
    </div>
  );
}

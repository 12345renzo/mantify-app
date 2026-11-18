"use client";

import { useActionState } from "react";
import { boton, campo } from "@/shared/ui/estilos";
import { cambiarPrecioAction, type EstadoPrecio } from "./actions";

export function PrecioForm({
  planId,
  precio,
  moneda,
}: {
  planId: string;
  precio: number;
  moneda: string;
}) {
  const [estado, enviar, pendiente] = useActionState<EstadoPrecio, FormData>(
    cambiarPrecioAction,
    {},
  );
  const id = `precio-${planId}`;
  return (
    <form action={enviar} className="mt-6 border-t border-border pt-5">
      <input type="hidden" name="planId" value={planId} />
      <label
        htmlFor={id}
        className="mb-1.5 block text-[10px] font-semibold tracking-[0.13em] text-muted uppercase"
      >
        Nuevo precio mensual ({moneda})
      </label>
      <div className="flex gap-2">
        <input
          id={id}
          name="precioMensual"
          type="number"
          inputMode="decimal"
          min="0.01"
          step="0.01"
          required
          defaultValue={precio}
          className={`${campo} tabular-nums`}
        />
        <button
          type="submit"
          disabled={pendiente}
          className={`${boton.primario} shrink-0`}
        >
          {pendiente ? "Guardando…" : "Guardar"}
        </button>
      </div>
      {estado.error && (
        <p className="mt-2 text-sm text-bad" aria-live="polite">
          {estado.error}
        </p>
      )}
      {estado.exito && (
        <p className="mt-2 text-sm text-ok" aria-live="polite">
          {estado.exito}
        </p>
      )}
    </form>
  );
}

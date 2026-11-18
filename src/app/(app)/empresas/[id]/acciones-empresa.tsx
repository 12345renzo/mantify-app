"use client";

import { useActionState, useState } from "react";
import { boton, campo, etiqueta } from "@/shared/ui/estilos";
import {
  cambiarEstadoAction,
  registrarPagoAction,
  type EstadoFormulario,
} from "../actions";

function Aviso({ estado }: { estado: EstadoFormulario }) {
  if (estado.error)
    return (
      <p className="text-sm text-bad" aria-live="polite">
        {estado.error}
      </p>
    );
  if (estado.exito)
    return (
      <p className="text-sm text-ok" aria-live="polite">
        {estado.exito}
      </p>
    );
  return null;
}

export function RegistrarPagoForm({ empresaId }: { empresaId: string }) {
  const [estado, enviar, pendiente] = useActionState<
    EstadoFormulario,
    FormData
  >(registrarPagoAction, {});
  return (
    <form action={enviar} className="mt-4 flex flex-col gap-3">
      <input type="hidden" name="empresaId" value={empresaId} />
      <div>
        <label htmlFor="referencia" className={etiqueta}>
          N.º de operación{" "}
          <span className="font-normal text-muted">(opcional)</span>
        </label>
        <input
          id="referencia"
          name="referencia"
          maxLength={80}
          placeholder="Ej. 004512873"
          className={campo}
        />
        {estado.errores?.referencia && (
          <p className="mt-1.5 text-sm text-bad">{estado.errores.referencia}</p>
        )}
      </div>
      <button
        type="submit"
        disabled={pendiente}
        className={`${boton.primario} w-full`}
      >
        {pendiente ? "Registrando…" : "Registrar pago"}
      </button>
      <Aviso estado={estado} />
    </form>
  );
}

export function CambiarEstadoForm({
  empresaId,
  activa,
  vencida,
}: {
  empresaId: string;
  activa: boolean;
  vencida: boolean;
}) {
  const [estado, enviar, pendiente] = useActionState<
    EstadoFormulario,
    FormData
  >(cambiarEstadoAction, {});
  const [confirmando, setConfirmando] = useState(false);

  if (!activa) {
    return (
      <form action={enviar} className="mt-4 flex flex-col gap-3">
        <input type="hidden" name="empresaId" value={empresaId} />
        <input type="hidden" name="accion" value="ACTIVAR" />
        <button
          type="submit"
          disabled={pendiente}
          className={`${boton.secundario} w-full`}
        >
          {pendiente ? "Activando…" : "Activar empresa"}
        </button>
        <Aviso estado={estado} />
      </form>
    );
  }

  return (
    <form action={enviar} className="mt-4 flex flex-col gap-3">
      <input type="hidden" name="empresaId" value={empresaId} />
      <input type="hidden" name="accion" value="DESACTIVAR" />
      {confirmando ? (
        <div className="rounded-lg border border-bad/30 bg-bad-soft p-3.5">
          <p className="text-sm text-bad">
            {vencida
              ? "Se desactivará por falta de pago."
              : "La membresía sigue vigente. Se desactivará de forma manual."}{" "}
            ¿Continuar?
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="submit"
              disabled={pendiente}
              className={`${boton.peligro} flex-1 py-2`}
            >
              {pendiente ? "Desactivando…" : "Sí, desactivar"}
            </button>
            <button
              type="button"
              onClick={() => setConfirmando(false)}
              className={`${boton.secundario} flex-1 py-2`}
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirmando(true)}
          className={`${boton.secundario} w-full text-bad`}
        >
          Desactivar empresa
        </button>
      )}
      <Aviso estado={estado} />
    </form>
  );
}

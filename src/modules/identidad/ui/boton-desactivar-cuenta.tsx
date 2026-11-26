"use client";

import { useActionState, useState } from "react";
import { boton } from "@/shared/ui/estilos";
import { Modal } from "@/shared/ui/modal";

type Estado = { error?: string; exito?: string };

// Desactivar una cuenta: siempre con un modal de advertencia.
export function BotonDesactivarCuenta({
  cuentaId,
  datos,
  accion,
}: {
  cuentaId: string;
  datos: { correo: string; rol: string; persona: string | null };
  accion: (previo: Estado, fd: FormData) => Promise<Estado>;
}) {
  const [abierto, setAbierto] = useState(false);
  const [vez, setVez] = useState(0);
  return (
    <>
      <button
        type="button"
        onClick={() => {
          setVez((n) => n + 1);
          setAbierto(true);
        }}
        className="rounded-md border border-bad/20 bg-bad-soft px-2 py-1 text-xs font-semibold text-bad transition-colors hover:border-bad/35"
      >
        Desactivar
      </button>
      <Modal
        abierto={abierto}
        onCerrar={() => setAbierto(false)}
        titulo="Desactivar cuenta"
        descripcion="Pierde el acceso al instante y deja libre un lugar del plan. Puedes reactivarla después."
      >
        <Formulario
          key={vez}
          cuentaId={cuentaId}
          datos={datos}
          accion={accion}
          onCerrar={() => setAbierto(false)}
        />
      </Modal>
    </>
  );
}

function Formulario({
  cuentaId,
  datos,
  accion,
  onCerrar,
}: {
  cuentaId: string;
  datos: { correo: string; rol: string; persona: string | null };
  accion: (previo: Estado, fd: FormData) => Promise<Estado>;
  onCerrar: () => void;
}) {
  const [estado, enviar, pendiente] = useActionState(
    async (previo: Estado, fd: FormData) => {
      const r = await accion(previo, fd);
      if (r.exito) onCerrar();
      return r;
    },
    {},
  );
  return (
    <form action={enviar}>
      <input type="hidden" name="cuentaId" value={cuentaId} />
      <div className="p-6">
        <p className="text-sm">
          ¿Seguro que quieres desactivar esta cuenta?
          {datos.persona && " La persona queda libre, sin cuenta."}
        </p>
        <dl className="mt-4 grid gap-3 rounded-lg bg-surface-2 p-4 text-sm sm:grid-cols-3">
          <Dato etiqueta="Correo" valor={datos.correo} />
          <Dato etiqueta="Rol" valor={datos.rol} />
          <Dato etiqueta="Persona" valor={datos.persona ?? "—"} />
        </dl>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border px-6 py-4">
        {estado.error && (
          <p className="mr-auto text-sm text-bad" aria-live="polite">
            {estado.error}
          </p>
        )}
        <button type="button" onClick={onCerrar} className={boton.secundario}>
          Cancelar
        </button>
        <button type="submit" disabled={pendiente} className={boton.peligro}>
          {pendiente ? "…" : "Sí, desactivar"}
        </button>
      </div>
    </form>
  );
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted">{etiqueta}</dt>
      <dd className="mt-0.5 truncate font-medium">{valor}</dd>
    </div>
  );
}

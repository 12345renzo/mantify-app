"use client";

import { useActionState, useState } from "react";
import { boton } from "@/shared/ui/estilos";
import { Modal } from "@/shared/ui/modal";

type Estado = { error?: string; exito?: string };

// Dar de baja o devolver a la cuadrilla: siempre con un modal de confirmación.
export function BotonPersona({
  personaId,
  datos,
  accion,
  tipo,
}: {
  personaId: string;
  datos: { nombre: string; documento: string | null; cargo: string | null };
  accion: (previo: Estado, fd: FormData) => Promise<Estado>;
  tipo: "baja" | "retorno";
}) {
  const baja = tipo === "baja";
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
        className={`rounded-md border px-2 py-1 text-xs font-semibold transition-colors ${
          baja
            ? "border-bad/20 bg-bad-soft text-bad hover:border-bad/35"
            : "border-primary/20 bg-primary-soft text-primary hover:border-primary/35"
        }`}
      >
        {baja ? "Dar de baja" : "Retornar de baja"}
      </button>
      <Modal
        abierto={abierto}
        onCerrar={() => setAbierto(false)}
        titulo={baja ? "Dar de baja al personal" : "Retornar de baja"}
        descripcion={
          baja
            ? "Su cuenta, si tiene, queda libre y sin acceso hasta que asignes otra persona."
            : "Vuelve a la cuadrilla como personal activo, sin cuenta."
        }
      >
        <Formulario
          key={vez}
          personaId={personaId}
          datos={datos}
          accion={accion}
          baja={baja}
          onCerrar={() => setAbierto(false)}
        />
      </Modal>
    </>
  );
}

function Formulario({
  personaId,
  datos,
  accion,
  baja,
  onCerrar,
}: {
  personaId: string;
  datos: { nombre: string; documento: string | null; cargo: string | null };
  accion: (previo: Estado, fd: FormData) => Promise<Estado>;
  baja: boolean;
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
      <input type="hidden" name="personaId" value={personaId} />
      <div className="p-6">
        <p className="text-sm">
          {baja
            ? "¿Seguro que quieres dar de baja a este personal?"
            : "¿Seguro que este personal vuelve a la cuadrilla?"}
        </p>
        <dl className="mt-4 grid gap-3 rounded-lg bg-surface-2 p-4 text-sm sm:grid-cols-3">
          <Dato etiqueta="Nombre" valor={datos.nombre} />
          <Dato etiqueta="Documento" valor={datos.documento ?? "—"} />
          <Dato etiqueta="Cargo" valor={datos.cargo ?? "—"} />
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
        <button
          type="submit"
          disabled={pendiente}
          className={baja ? boton.peligro : boton.primario}
        >
          {pendiente ? "…" : baja ? "Sí, dar de baja" : "Sí, retornar"}
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

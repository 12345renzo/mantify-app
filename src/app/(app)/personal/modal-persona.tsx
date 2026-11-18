"use client";

import { useActionState, useState } from "react";
import { CamposPersona } from "@/modules/identidad/ui/campos-persona";
import { boton } from "@/shared/ui/estilos";
import { IconoMas } from "@/shared/ui/iconos";
import { Modal } from "@/shared/ui/modal";
import { crearPersonaAction, type EstadoIdentidad } from "./actions";

export function ModalPersona() {
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
        className={boton.secundario}
      >
        <IconoMas width={18} height={18} />
        Nueva persona
      </button>
      <Modal
        abierto={abierto}
        onCerrar={() => setAbierto(false)}
        titulo="Nueva persona"
        descripcion="Queda en el personal sin cuenta. Si necesita entrar a la app, créale una cuenta después."
      >
        <FormularioPersona key={vez} onListo={() => setAbierto(false)} />
      </Modal>
    </>
  );
}

function FormularioPersona({ onListo }: { onListo: () => void }) {
  // La acción refresca la lista; si salió bien, el modal se cierra.
  const [estado, enviar, pendiente] = useActionState(
    async (previo: EstadoIdentidad, fd: FormData) => {
      const r = await crearPersonaAction(previo, fd);
      if (r.exito) onListo();
      return r;
    },
    {},
  );
  return (
    <form action={enviar} noValidate>
      <div className="p-6">
        <CamposPersona valores={estado.valores} errores={estado.errores} />
      </div>
      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border px-6 py-4">
        {estado.error && (
          <p className="mr-auto text-sm text-bad" aria-live="polite">
            {estado.error}
          </p>
        )}
        <button type="button" onClick={onListo} className={boton.secundario}>
          Cancelar
        </button>
        <button type="submit" disabled={pendiente} className={boton.primario}>
          {pendiente ? "Guardando…" : "Guardar persona"}
        </button>
      </div>
    </form>
  );
}

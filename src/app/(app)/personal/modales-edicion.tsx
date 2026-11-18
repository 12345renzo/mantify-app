"use client";

import { useActionState, useState } from "react";
import { CamposPersona } from "@/modules/identidad/ui/campos-persona";
import { boton, campo, etiqueta } from "@/shared/ui/estilos";
import { Modal } from "@/shared/ui/modal";
import {
  cambiarRolAction,
  editarPersonaAction,
  type EstadoIdentidad,
} from "./actions";

const enlace = "text-sm font-semibold text-primary hover:underline";

function Pie({
  estado,
  pendiente,
  onCerrar,
}: {
  estado: EstadoIdentidad;
  pendiente: boolean;
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
      <button type="submit" disabled={pendiente} className={boton.primario}>
        {pendiente ? "Guardando..." : "Guardar cambios"}
      </button>
    </div>
  );
}

// Un solo disparador + modal; la key reinicia el formulario cada vez que se abre.
function useModal() {
  const [abierto, setAbierto] = useState(false);
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

export type ValoresPersona = {
  nombres: string;
  apellidos: string;
  tipoDocumento: string;
  numeroDocumento: string;
  cargo: string;
  telefono: string;
  tipoVinculo: string;
};

export function ModalEditarPersona({
  personaId,
  valores,
}: {
  personaId: string;
  valores: ValoresPersona;
}) {
  const m = useModal();
  return (
    <>
      <button type="button" onClick={m.abrir} className={enlace}>
        Editar
      </button>
      <Modal
        abierto={m.abierto}
        onCerrar={m.cerrar}
        titulo="Editar personal"
        descripcion="Cambia los datos de la persona. Su cuenta y su estado no cambian."
      >
        <FormPersona
          key={m.vez}
          personaId={personaId}
          valores={valores}
          onCerrar={m.cerrar}
        />
      </Modal>
    </>
  );
}

function FormPersona({
  personaId,
  valores,
  onCerrar,
}: {
  personaId: string;
  valores: ValoresPersona;
  onCerrar: () => void;
}) {
  const [estado, enviar, pendiente] = useActionState(
    async (previo: EstadoIdentidad, fd: FormData) => {
      const r = await editarPersonaAction(previo, fd);
      if (r.exito) onCerrar();
      return r;
    },
    {},
  );
  return (
    <form action={enviar} noValidate>
      <input type="hidden" name="personaId" value={personaId} />
      <div className="p-6">
        <CamposPersona
          valores={estado.valores ?? valores}
          errores={estado.errores}
        />
      </div>
      <Pie estado={estado} pendiente={pendiente} onCerrar={onCerrar} />
    </form>
  );
}

export function ModalRolCuenta({
  cuentaId,
  correo,
  rol,
  roles,
}: {
  cuentaId: string;
  correo: string;
  rol: string;
  roles: { valor: string; etiqueta: string }[];
}) {
  const m = useModal();
  return (
    <>
      <button type="button" onClick={m.abrir} className={enlace}>
        Cambiar rol
      </button>
      <Modal
        abierto={m.abierto}
        onCerrar={m.cerrar}
        titulo="Cambiar rol de la cuenta"
        descripcion={`${correo}. El correo y la persona no cambian.`}
      >
        <FormRol
          key={m.vez}
          cuentaId={cuentaId}
          rol={rol}
          roles={roles}
          onCerrar={m.cerrar}
        />
      </Modal>
    </>
  );
}

function FormRol({
  cuentaId,
  rol,
  roles,
  onCerrar,
}: {
  cuentaId: string;
  rol: string;
  roles: { valor: string; etiqueta: string }[];
  onCerrar: () => void;
}) {
  const [estado, enviar, pendiente] = useActionState(
    async (previo: EstadoIdentidad, fd: FormData) => {
      const r = await cambiarRolAction(previo, fd);
      if (r.exito) onCerrar();
      return r;
    },
    {},
  );
  return (
    <form action={enviar} noValidate>
      <input type="hidden" name="cuentaId" value={cuentaId} />
      <div className="p-6">
        <label htmlFor="rol-cuenta" className={etiqueta}>
          Rol
        </label>
        <select id="rol-cuenta" name="rol" defaultValue={rol} className={campo}>
          {roles.map((r) => (
            <option key={r.valor} value={r.valor}>
              {r.etiqueta}
            </option>
          ))}
        </select>
      </div>
      <Pie estado={estado} pendiente={pendiente} onCerrar={onCerrar} />
    </form>
  );
}

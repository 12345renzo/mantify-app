"use client";

import { useActionState, useState } from "react";
import type { Plan } from "@/modules/plataforma/application/consultas";
import { boton, campo, etiqueta } from "@/shared/ui/estilos";
import { formatoMoneda } from "@/shared/ui/formato";
import { Modal } from "@/shared/ui/modal";
import {
  editarEmpresaAction,
  reactivarEmpresaAction,
  type EstadoFormulario,
} from "./actions";

export type DatosEmpresaFila = {
  id: string;
  nombre: string;
  ruc: string;
  razonSocial: string | null;
  correoContacto: string | null;
  diasGracia: number;
  planId: string;
};

// Reactivar solo se habilita cuando el plan venció; antes sale bloqueado.
export function AccionesFila({
  empresa,
  planes,
  puedeReactivar,
}: {
  empresa: DatosEmpresaFila;
  planes: Plan[];
  puedeReactivar: boolean;
}) {
  const [abierto, setAbierto] = useState<"editar" | "reactivar" | null>(null);
  const [vez, setVez] = useState(0);
  const abrir = (cual: "editar" | "reactivar") => {
    setVez((n) => n + 1);
    setAbierto(cual);
  };
  const cerrar = () => setAbierto(null);

  return (
    <div className="flex items-center justify-end gap-1.5">
      <button
        type="button"
        disabled={!puedeReactivar}
        title={puedeReactivar ? undefined : "Se habilita cuando venza el plan"}
        onClick={() => abrir("reactivar")}
        className="rounded-md border border-transparent px-2 py-1 text-xs font-semibold text-muted transition-colors hover:border-border hover:bg-surface-2 hover:text-fg disabled:cursor-not-allowed disabled:opacity-45"
      >
        Reactivar
      </button>
      <button
        type="button"
        onClick={() => abrir("editar")}
        className="rounded-md border border-primary/20 bg-primary-soft px-2 py-1 text-xs font-semibold text-primary transition-colors hover:border-primary/35 hover:bg-primary-soft/70"
      >
        Editar
      </button>

      <Modal
        abierto={abierto === "reactivar"}
        onCerrar={cerrar}
        titulo="Reactivar empresa"
        descripcion={`${empresa.nombre}. Cobra 30 días desde hoy al precio actual del plan elegido.`}
      >
        <FormReactivar
          key={vez}
          empresa={empresa}
          planes={planes}
          onCerrar={cerrar}
        />
      </Modal>
      <Modal
        abierto={abierto === "editar"}
        onCerrar={cerrar}
        titulo="Editar empresa"
        descripcion="El plan no se cambia aquí: se elige al reactivar."
      >
        <FormEditar key={vez} empresa={empresa} onCerrar={cerrar} />
      </Modal>
    </div>
  );
}

function Pie({
  estado,
  pendiente,
  texto,
  onCerrar,
}: {
  estado: EstadoFormulario;
  pendiente: boolean;
  texto: string;
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
        {pendiente ? "Guardando…" : texto}
      </button>
    </div>
  );
}

function FormReactivar({
  empresa,
  planes,
  onCerrar,
}: {
  empresa: DatosEmpresaFila;
  planes: Plan[];
  onCerrar: () => void;
}) {
  const [estado, enviar, pendiente] = useActionState(
    async (previo: EstadoFormulario, fd: FormData) => {
      const r = await reactivarEmpresaAction(previo, fd);
      if (r.exito) onCerrar();
      return r;
    },
    {},
  );
  const e = estado.errores ?? {};
  return (
    <form action={enviar} noValidate>
      <input type="hidden" name="empresaId" value={empresa.id} />
      <div className="grid gap-5 p-6">
        <fieldset>
          <legend className={etiqueta}>Plan</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {planes.map((p) => (
              <label
                key={p.id}
                className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-surface p-4 transition-[border-color,background-color,box-shadow] has-checked:border-primary/60 has-checked:bg-primary-soft/60 has-checked:shadow-[inset_3px_0_0_var(--primary)]"
              >
                <input
                  type="radio"
                  name="planId"
                  value={p.id}
                  defaultChecked={p.id === empresa.planId}
                  className="mt-1 accent-[var(--primary)]"
                />
                <span>
                  <span className="block font-semibold">
                    {p.nombre}
                    {p.id === empresa.planId && (
                      <span className="ml-2 text-xs font-normal text-muted">
                        (actual)
                      </span>
                    )}
                  </span>
                  <span className="text-sm text-muted tabular-nums">
                    {formatoMoneda(p.precioMensual, p.moneda)} / mes ·{" "}
                    {p.maxAccesos
                      ? `${p.maxAccesos} accesos`
                      : "accesos sin límite"}
                  </span>
                </span>
              </label>
            ))}
          </div>
          {e.planId && <p className="mt-1.5 text-sm text-bad">{e.planId}</p>}
        </fieldset>
        <div>
          <label htmlFor="referencia" className={etiqueta}>
            N.º de operación{" "}
            <span className="font-normal text-muted">(opcional)</span>
          </label>
          <input
            id="referencia"
            name="referencia"
            maxLength={80}
            className={campo}
          />
        </div>
      </div>
      <Pie
        estado={estado}
        pendiente={pendiente}
        texto="Reactivar y registrar pago"
        onCerrar={onCerrar}
      />
    </form>
  );
}

function FormEditar({
  empresa,
  onCerrar,
}: {
  empresa: DatosEmpresaFila;
  onCerrar: () => void;
}) {
  const [estado, enviar, pendiente] = useActionState(
    async (previo: EstadoFormulario, fd: FormData) => {
      const r = await editarEmpresaAction(previo, fd);
      if (r.exito) onCerrar();
      return r;
    },
    {},
  );
  const v = estado.valores ?? {
    nombre: empresa.nombre,
    ruc: empresa.ruc,
    razonSocial: empresa.razonSocial ?? "",
    correoContacto: empresa.correoContacto ?? "",
    diasGracia: String(empresa.diasGracia),
  };
  const e = estado.errores ?? {};
  const campos: {
    id: string;
    label: string;
    opcional?: boolean;
    ancho?: boolean;
    props?: React.InputHTMLAttributes<HTMLInputElement>;
  }[] = [
    { id: "nombre", label: "Nombre comercial", ancho: true },
    { id: "ruc", label: "RUC", props: { inputMode: "numeric", maxLength: 11 } },
    { id: "razonSocial", label: "Razón social", opcional: true },
    {
      id: "correoContacto",
      label: "Correo de contacto",
      opcional: true,
      props: { type: "email" },
    },
    {
      id: "diasGracia",
      label: "Días de gracia",
      props: { type: "number", min: 0, max: 30, step: 1 },
    },
  ];
  return (
    <form action={enviar} noValidate>
      <input type="hidden" name="empresaId" value={empresa.id} />
      <div className="grid gap-5 p-6 sm:grid-cols-2">
        {campos.map((c) => (
          <div key={c.id} className={c.ancho ? "sm:col-span-2" : ""}>
            <label htmlFor={c.id} className={etiqueta}>
              {c.label}
              {c.opcional && (
                <span className="ml-1 font-normal text-muted">(opcional)</span>
              )}
            </label>
            <input
              id={c.id}
              name={c.id}
              defaultValue={v[c.id]}
              className={campo}
              aria-invalid={e[c.id] ? true : undefined}
              {...c.props}
            />
            {e[c.id] && <p className="mt-1.5 text-sm text-bad">{e[c.id]}</p>}
          </div>
        ))}
      </div>
      <Pie
        estado={estado}
        pendiente={pendiente}
        texto="Guardar cambios"
        onCerrar={onCerrar}
      />
    </form>
  );
}

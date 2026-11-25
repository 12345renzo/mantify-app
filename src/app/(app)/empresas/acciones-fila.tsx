"use client";

import { useActionState, useState } from "react";
import type {
  EmpresaResumen,
  Plan,
} from "@/modules/plataforma/application/consultas";
import { puedeRenovar } from "@/modules/plataforma/domain/estado-membresia";
import {
  calcularFinMembresia,
  calcularInicioNuevaMembresia,
} from "@/modules/plataforma/domain/regla-nueva-membresia";
import { diasEntre, type FechaISO } from "@/shared/kernel/fechas";
import { boton, campo, etiqueta } from "@/shared/ui/estilos";
import { formatoFecha, formatoMoneda } from "@/shared/ui/formato";
import { Modal } from "@/shared/ui/modal";
import {
  darDeBajaAction,
  editarEmpresaAction,
  renovarEmpresaAction,
  type EstadoFormulario,
} from "./actions";

const enlace =
  "rounded-md border border-transparent px-2 py-1 text-xs font-semibold transition-colors hover:border-border hover:bg-surface-2";

export function AccionesFila({
  empresa,
  planes,
  hoy,
}: {
  empresa: EmpresaResumen;
  planes: Plan[];
  hoy: FechaISO;
}) {
  const [abierto, setAbierto] = useState<"editar" | "renovar" | "baja" | null>(
    null,
  );
  const [vez, setVez] = useState(0);
  const abrir = (cual: "editar" | "renovar" | "baja") => {
    setVez((n) => n + 1);
    setAbierto(cual);
  };
  const cerrar = () => setAbierto(null);

  const inicio = calcularInicioNuevaMembresia(
    empresa.fechaFin,
    hoy,
    empresa.diasGracia,
    empresa.motivoInactivacion !== null,
  );
  const dias = empresa.fechaFin ? diasEntre(hoy, empresa.fechaFin) : 0;

  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5">
      {empresa.estado !== "INACTIVA" && (
        <button
          type="button"
          onClick={() => abrir("baja")}
          className={`${enlace} text-bad`}
        >
          Dar de baja
        </button>
      )}
      {puedeRenovar(empresa.estado) && (
        <button
          type="button"
          onClick={() => abrir("renovar")}
          className={`${enlace} text-fg`}
        >
          Renovar
        </button>
      )}
      <button
        type="button"
        onClick={() => abrir("editar")}
        className="rounded-md border border-primary/20 bg-primary-soft px-2 py-1 text-xs font-semibold text-primary transition-colors hover:border-primary/35 hover:bg-primary-soft/70"
      >
        Editar
      </button>

      <Modal
        abierto={abierto === "baja"}
        onCerrar={cerrar}
        titulo="Dar de baja"
        descripcion={`¿Estás seguro de dar de baja a ${empresa.nombre}?`}
      >
        <FormBaja
          key={vez}
          empresaId={empresa.id}
          diasPerdidos={Math.max(dias, 0)}
          onCerrar={cerrar}
        />
      </Modal>
      <Modal
        abierto={abierto === "renovar"}
        onCerrar={cerrar}
        titulo="Renovar membresía"
        descripcion={`${empresa.nombre}. 30 días al precio actual del plan elegido.`}
      >
        <FormRenovar
          key={vez}
          empresa={empresa}
          planes={planes}
          inicio={inicio}
          onCerrar={cerrar}
        />
      </Modal>
      <Modal
        abierto={abierto === "editar"}
        onCerrar={cerrar}
        titulo="Editar empresa"
        descripcion="El plan no se cambia aquí: se elige al renovar."
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
  clase = boton.primario,
}: {
  estado: EstadoFormulario;
  pendiente: boolean;
  texto: string;
  onCerrar: () => void;
  clase?: string;
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
      <button type="submit" disabled={pendiente} className={clase}>
        {pendiente ? "Guardando…" : texto}
      </button>
    </div>
  );
}

function FormBaja({
  empresaId,
  diasPerdidos,
  onCerrar,
}: {
  empresaId: string;
  diasPerdidos: number;
  onCerrar: () => void;
}) {
  const [estado, enviar, pendiente] = useActionState(
    async (previo: EstadoFormulario, fd: FormData) => {
      const r = await darDeBajaAction(previo, fd);
      if (r.exito) onCerrar();
      return r;
    },
    {},
  );
  return (
    <form action={enviar}>
      <input type="hidden" name="empresaId" value={empresaId} />
      <p className="p-6 text-sm leading-relaxed">
        Sus usuarios no podrán entrar hasta que renueve.
        {diasPerdidos > 0 &&
          ` Perderá ${diasPerdidos === 1 ? "el día que le queda" : `los ${diasPerdidos} días que le quedan`}.`}
      </p>
      <Pie
        estado={estado}
        pendiente={pendiente}
        texto="Sí, dar de baja"
        clase={boton.peligro}
        onCerrar={onCerrar}
      />
    </form>
  );
}

function FormRenovar({
  empresa,
  planes,
  inicio,
  onCerrar,
}: {
  empresa: EmpresaResumen;
  planes: Plan[];
  inicio: FechaISO;
  onCerrar: () => void;
}) {
  const [estado, enviar, pendiente] = useActionState(
    async (previo: EstadoFormulario, fd: FormData) => {
      const r = await renovarEmpresaAction(previo, fd);
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
            {planes.map((p) => {
              const noCubre =
                p.maxAccesos !== null && empresa.cuentas > p.maxAccesos;
              return (
                <label
                  key={p.id}
                  className="flex cursor-pointer has-disabled:cursor-not-allowed has-disabled:opacity-55 items-start gap-3 rounded-xl border border-border bg-surface p-4 transition-[border-color,background-color,box-shadow] has-checked:border-primary/60 has-checked:bg-primary-soft/60 has-checked:shadow-[inset_3px_0_0_var(--primary)]"
                >
                  <input
                    type="radio"
                    name="planId"
                    value={p.id}
                    defaultChecked={p.id === empresa.planId && !noCubre}
                    disabled={noCubre}
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
                    {noCubre && (
                      <span className="mt-1 block text-xs text-bad">
                        Tiene {empresa.cuentas} cuentas; este plan permite{" "}
                        {p.maxAccesos}.
                      </span>
                    )}
                  </span>
                </label>
              );
            })}
          </div>
          {e.planId && <p className="mt-1.5 text-sm text-bad">{e.planId}</p>}
        </fieldset>
        <p className="rounded-lg border border-border bg-surface-2/40 p-3.5 text-sm tabular-nums">
          Cubrirá del <strong>{formatoFecha(inicio)}</strong> al{" "}
          <strong>{formatoFecha(calcularFinMembresia(inicio))}</strong>
        </p>
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
        texto="Renovar y registrar pago"
        onCerrar={onCerrar}
      />
    </form>
  );
}

function FormEditar({
  empresa,
  onCerrar,
}: {
  empresa: EmpresaResumen;
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

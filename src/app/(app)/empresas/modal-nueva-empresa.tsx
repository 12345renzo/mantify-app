"use client";

import { useActionState, useState } from "react";
import type { Plan } from "@/modules/plataforma/application/consultas";
import { boton, campo, etiqueta } from "@/shared/ui/estilos";
import { formatoMoneda } from "@/shared/ui/formato";
import { IconoMas } from "@/shared/ui/iconos";
import { Modal } from "@/shared/ui/modal";
import { crearEmpresaAction, type EstadoFormulario } from "./actions";

export function ModalNuevaEmpresa({
  planes,
  texto = "Nueva empresa",
}: {
  planes: Plan[];
  texto?: string;
}) {
  const [abierto, setAbierto] = useState(false);
  // Cambiar la key al abrir deja el formulario en blanco cada vez.
  const [vez, setVez] = useState(0);
  return (
    <>
      <button
        type="button"
        onClick={() => {
          setVez((n) => n + 1);
          setAbierto(true);
        }}
        className={boton.primario}
      >
        <IconoMas width={18} height={18} />
        {texto}
      </button>
      <Modal
        abierto={abierto}
        onCerrar={() => setAbierto(false)}
        titulo="Nueva empresa"
        descripcion="Queda sin membresía hasta que registres su primer pago."
      >
        <NuevaEmpresaForm key={vez} planes={planes} />
      </Modal>
    </>
  );
}

// Al crear, la acción lleva al detalle de la empresa y el modal se va con la página.
function NuevaEmpresaForm({ planes }: { planes: Plan[] }) {
  const [estado, enviar, pendiente] = useActionState<
    EstadoFormulario,
    FormData
  >(crearEmpresaAction, {});
  const v = estado.valores ?? {};
  const e = estado.errores ?? {};
  const planElegido = v.planId || planes[0]?.id;

  return (
    <form action={enviar} noValidate>
      <div className="grid gap-5 p-6 sm:grid-cols-2">
        <Campo
          id="nombre"
          label="Nombre comercial"
          error={e.nombre}
          className="sm:col-span-2"
        >
          <input
            id="nombre"
            name="nombre"
            required
            maxLength={120}
            defaultValue={v.nombre}
            placeholder="Minera Andina"
            className={campo}
            aria-invalid={!!e.nombre || undefined}
          />
        </Campo>
        <Campo
          id="ruc"
          label="RUC"
          error={e.ruc}
          ayuda="11 dígitos, sin guiones."
        >
          <input
            id="ruc"
            name="ruc"
            required
            inputMode="numeric"
            pattern="\d{11}"
            maxLength={11}
            defaultValue={v.ruc}
            placeholder="20123456789"
            className={`${campo} tabular-nums`}
            aria-invalid={!!e.ruc || undefined}
          />
        </Campo>
        <Campo
          id="razonSocial"
          label="Razón social"
          opcional
          error={e.razonSocial}
        >
          <input
            id="razonSocial"
            name="razonSocial"
            maxLength={160}
            defaultValue={v.razonSocial}
            placeholder="Minera Andina S.A.C."
            className={campo}
          />
        </Campo>
        <Campo
          id="correoContacto"
          label="Correo de contacto"
          opcional
          error={e.correoContacto}
          ayuda="Aquí llegan los avisos de vencimiento."
        >
          <input
            id="correoContacto"
            name="correoContacto"
            type="email"
            maxLength={160}
            defaultValue={v.correoContacto}
            placeholder="administracion@empresa.pe"
            className={campo}
            aria-invalid={!!e.correoContacto || undefined}
          />
        </Campo>
        <Campo
          id="diasGracia"
          label="Días de gracia"
          error={e.diasGracia}
          ayuda="Entre 0 y 30. Por defecto 3."
        >
          <input
            id="diasGracia"
            name="diasGracia"
            type="number"
            min={0}
            max={30}
            step={1}
            required
            defaultValue={v.diasGracia ?? "1"}
            className={`${campo} tabular-nums`}
            aria-invalid={!!e.diasGracia || undefined}
          />
        </Campo>

        <fieldset className="sm:col-span-2">
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
                  defaultChecked={p.id === planElegido}
                  className="mt-1 accent-[var(--primary)]"
                />
                <span>
                  <span className="block font-semibold">{p.nombre}</span>
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
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border px-6 py-4">
        {estado.error && (
          <p className="mr-auto text-sm text-bad" aria-live="polite">
            {estado.error}
          </p>
        )}
        <button type="submit" disabled={pendiente} className={boton.primario}>
          {pendiente ? "Creando…" : "Crear empresa"}
        </button>
      </div>
    </form>
  );
}

function Campo({
  id,
  label,
  error,
  ayuda,
  opcional,
  className = "",
  children,
}: {
  id: string;
  label: string;
  error?: string;
  ayuda?: string;
  opcional?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className={etiqueta}>
        {label}
        {opcional && (
          <span className="ml-1 font-normal text-muted">(opcional)</span>
        )}
      </label>
      {children}
      {error ? (
        <p className="mt-1.5 text-sm text-bad">{error}</p>
      ) : (
        ayuda && <p className="mt-1.5 text-xs text-muted">{ayuda}</p>
      )}
    </div>
  );
}

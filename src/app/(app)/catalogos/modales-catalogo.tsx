"use client";

import { useActionState, useState } from "react";
import {
  cambiarActivoAction,
  guardarElementoAction,
  type EstadoCatalogo,
} from "./actions";
import { boton, campo, etiqueta } from "@/shared/ui/estilos";
import { IconoMas } from "@/shared/ui/iconos";
import { Modal } from "@/shared/ui/modal";
import {
  CATALOGOS,
  camposEditables,
  type Campo,
  type CodigoCatalogo,
} from "@/modules/catalogos/domain/catalogos";
import type { Elemento } from "@/modules/catalogos/application/repositorios";

const enlace = "text-sm font-semibold hover:underline";

function useModal() {
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

// Cierra el modal cuando la acción sale bien.
function useAccion(
  accion: (p: EstadoCatalogo, fd: FormData) => Promise<EstadoCatalogo>,
  onListo: () => void,
) {
  return useActionState(async (previo: EstadoCatalogo, fd: FormData) => {
    const r = await accion(previo, fd);
    if (r.exito) onListo();
    return r;
  }, {});
}

function Pie({
  estado,
  pendiente,
  texto,
  peligro,
  onCerrar,
}: {
  estado: EstadoCatalogo;
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

// Crear (sin elemento) o editar (con elemento).
export type OpcionCategoria = { id: string; nombre: string; activo: boolean };

export function ModalElemento({
  catalogo,
  elemento,
  categorias,
}: {
  catalogo: CodigoCatalogo;
  elemento?: Elemento;
  categorias: OpcionCategoria[];
}) {
  const m = useModal();
  const def = CATALOGOS[catalogo];
  return (
    <>
      {elemento ? (
        <button
          type="button"
          onClick={m.abrir}
          className={`${enlace} text-primary`}
        >
          Editar
        </button>
      ) : (
        <button type="button" onClick={m.abrir} className={boton.primario}>
          <IconoMas width={18} height={18} />
          Nuevo
        </button>
      )}
      <Modal
        abierto={m.abierto}
        onCerrar={m.cerrar}
        titulo={elemento ? `Editar ${def.singular}` : `Nuevo: ${def.singular}`}
        descripcion={def.descripcion}
      >
        <FormElemento
          key={m.vez}
          catalogo={catalogo}
          elemento={elemento}
          categorias={categorias}
          onCerrar={m.cerrar}
        />
      </Modal>
    </>
  );
}

function FormElemento({
  catalogo,
  elemento,
  categorias,
  onCerrar,
}: {
  catalogo: CodigoCatalogo;
  elemento?: Elemento;
  categorias: OpcionCategoria[];
  onCerrar: () => void;
}) {
  const def = CATALOGOS[catalogo];
  const [estado, enviar, pendiente] = useAccion(
    guardarElementoAction,
    onCerrar,
  );
  const v =
    estado.valores ??
    Object.fromEntries(
      camposEditables(def).map((c) => [
        c.clave,
        elemento?.valores[c.clave]?.toString() ?? "",
      ]),
    );
  const e = estado.errores ?? {};
  return (
    <form action={enviar} noValidate>
      <input type="hidden" name="catalogo" value={catalogo} />
      <input type="hidden" name="id" value={elemento?.id ?? ""} />
      <div className="grid gap-5 p-6 sm:grid-cols-2">
        {camposEditables(def).map((c) => (
          <CampoFormulario
            key={c.clave}
            campo={c}
            valor={v[c.clave] ?? ""}
            error={e[c.clave]}
            categorias={categorias}
            ancho={
              c.clave === def.principal || (c.tipo === "texto" && !!c.largo)
            }
          />
        ))}
      </div>
      <Pie
        estado={estado}
        pendiente={pendiente}
        texto={elemento ? "Guardar cambios" : "Crear"}
        onCerrar={onCerrar}
      />
    </form>
  );
}

function CampoFormulario({
  campo: c,
  valor,
  error,
  categorias,
  ancho,
}: {
  campo: Campo;
  valor: string;
  error?: string;
  categorias: OpcionCategoria[];
  ancho: boolean;
}) {
  const opcional = c.tipo === "categoria" || ("requerido" in c && !c.requerido);
  const ayuda = "ayuda" in c ? c.ayuda : undefined;
  const comun = {
    id: c.clave,
    name: c.clave,
    defaultValue: valor,
    "aria-invalid": error ? true : undefined,
  };
  return (
    <div className={ancho ? "sm:col-span-2" : ""}>
      <label htmlFor={c.clave} className={etiqueta}>
        {c.etiqueta}
        {opcional && (
          <span className="ml-1 font-normal text-muted">(opcional)</span>
        )}
      </label>
      {c.tipo === "texto" &&
        (c.largo ? (
          <textarea
            {...comun}
            rows={4}
            maxLength={c.max}
            className={`${campo} font-mono`}
          />
        ) : (
          <input {...comun} maxLength={c.max} className={campo} />
        ))}
      {c.tipo === "numero" && (
        <input
          {...comun}
          type="number"
          min={c.min}
          max={c.max}
          step={c.decimales === 0 ? 1 : 0.01}
          className={`${campo} tabular-nums`}
        />
      )}
      {c.tipo === "opciones" && (
        <select {...comun} className={campo}>
          <option value="">{c.requerido ? "Elige…" : "—"}</option>
          {Object.entries(c.opciones).map(([valor, texto]) => (
            <option key={valor} value={valor}>
              {texto}
            </option>
          ))}
        </select>
      )}
      {c.tipo === "categoria" && (
        <select {...comun} className={campo}>
          <option value="">Todas las categorías</option>
          {/* Las inactivas no se ofrecen, salvo la que ya tiene: así editar no la cambia sola. */}
          {categorias
            .filter((cat) => cat.activo || cat.id === valor)
            .map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.nombre}
                {cat.activo ? "" : " (inactiva)"}
              </option>
            ))}
        </select>
      )}
      {error ? (
        <p className="mt-1.5 text-sm text-bad">{error}</p>
      ) : (
        ayuda && <p className="mt-1.5 text-xs text-muted">{ayuda}</p>
      )}
    </div>
  );
}

// Desactivar o volver a activar, siempre con confirmación.
export function BotonActivo({
  catalogo,
  elemento,
}: {
  catalogo: CodigoCatalogo;
  elemento: Elemento;
}) {
  const m = useModal();
  const desactivar = elemento.activo;
  return (
    <>
      <button
        type="button"
        onClick={m.abrir}
        className={`${enlace} ${desactivar ? "text-bad" : "text-primary"}`}
      >
        {desactivar ? "Desactivar" : "Activar"}
      </button>
      <Modal
        abierto={m.abierto}
        onCerrar={m.cerrar}
        titulo={desactivar ? "Desactivar" : "Activar"}
        descripcion={
          desactivar
            ? "Deja de aparecer para elegirlo en formularios nuevos. Lo que ya lo usa lo conserva."
            : "Vuelve a aparecer para elegirlo en los formularios."
        }
      >
        <FormActivo
          key={m.vez}
          catalogo={catalogo}
          elemento={elemento}
          onCerrar={m.cerrar}
        />
      </Modal>
    </>
  );
}

function FormActivo({
  catalogo,
  elemento,
  onCerrar,
}: {
  catalogo: CodigoCatalogo;
  elemento: Elemento;
  onCerrar: () => void;
}) {
  const [estado, enviar, pendiente] = useAccion(cambiarActivoAction, onCerrar);
  const desactivar = elemento.activo;
  return (
    <form action={enviar}>
      <input type="hidden" name="catalogo" value={catalogo} />
      <input type="hidden" name="id" value={elemento.id} />
      <input type="hidden" name="activo" value={String(!elemento.activo)} />
      <p className="p-6 text-sm">
        ¿Seguro que quieres {desactivar ? "desactivar" : "activar"}{" "}
        <strong className="font-semibold">
          {String(elemento.valores[CATALOGOS[catalogo].principal] ?? "")}
        </strong>
        ?
      </p>
      <Pie
        estado={estado}
        pendiente={pendiente}
        texto={desactivar ? "Sí, desactivar" : "Sí, activar"}
        peligro={desactivar}
        onCerrar={onCerrar}
      />
    </form>
  );
}

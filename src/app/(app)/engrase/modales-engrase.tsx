"use client";

import { useState } from "react";
import type { FilaEngrase } from "@/modules/engrase/application/repositorios";
import {
  RANGO_AVISO,
  TIPOS_AVISO,
  type TipoAviso,
  type Umbral,
} from "@/modules/engrase/domain/estado-engrase";
import { TIPO_AVISO, unidad } from "@/modules/engrase/ui/formato";
import { Campo } from "@/shared/ui/campo";
import { boton, campo } from "@/shared/ui/estilos";
import {
  PieFormulario,
  useAccionModal,
  useModal,
} from "@/shared/ui/formulario-modal";
import { Modal } from "@/shared/ui/modal";
import { Clave } from "../trabajos/modales-trabajo";
import {
  configurarAvisoAction,
  guardarPlanAction,
  registrarAction,
} from "./actions";

type Grasa = { id: string; nombre: string };

function SinGrasas() {
  return (
    <p className="rounded-xl border border-warn/30 bg-warn-soft px-4 py-3 text-sm">
      Primero crea un tipo de grasa en Catálogos → Tipos de grasa.
    </p>
  );
}

function SelectorGrasa({
  grasas,
  valor,
  error,
}: {
  grasas: Grasa[];
  valor: string;
  error?: string;
}) {
  return (
    <Campo id="tipoGrasaId" label="Tipo de grasa" error={error}>
      <select
        id="tipoGrasaId"
        name="tipoGrasaId"
        defaultValue={valor}
        className={campo}
      >
        <option value="">Elige…</option>
        {grasas.map((g) => (
          <option key={g.id} value={g.id}>
            {g.nombre}
          </option>
        ))}
      </select>
    </Campo>
  );
}

// ---------- Plan ----------

export function ModalPlan({
  fila,
  grasas,
}: {
  fila: FilaEngrase;
  grasas: Grasa[];
}) {
  const m = useModal();
  return (
    <>
      <button type="button" onClick={m.abrir} className={boton.secundario}>
        {fila.plan ? "Plan" : "Crear plan"}
      </button>
      <Modal
        abierto={m.abierto}
        onCerrar={m.cerrar}
        titulo={`Plan de engrase · ${fila.codigo}`}
        descripcion="Frecuencia, grasa y puntos. Si pones horas y días, manda lo que venza primero."
      >
        <FormPlan key={m.vez} fila={fila} grasas={grasas} onCerrar={m.cerrar} />
      </Modal>
    </>
  );
}

function FormPlan({
  fila,
  grasas,
  onCerrar,
}: {
  fila: FilaEngrase;
  grasas: Grasa[];
  onCerrar: () => void;
}) {
  const [estado, enviar, pendiente] = useAccionModal(
    guardarPlanAction,
    onCerrar,
  );
  // Sin plan, se proponen las plantillas de la categoría; se pueden cambiar.
  const [puntos, setPuntos] = useState(() =>
    fila.puntos.length ? fila.puntos.map((p) => p.descripcion) : [""],
  );
  const v = estado.valores;
  const u = unidad(fila.medidor);
  return (
    <form action={enviar} noValidate>
      <input type="hidden" name="equipoId" value={fila.id} />
      <div className="grid gap-5 p-6 sm:grid-cols-2">
        <Campo
          id="cadaHoras"
          label={`Cada cuántas ${u === "km" ? "km" : "horas"}`}
          opcional
          error={estado.errores?.cadaHoras}
        >
          <input
            id="cadaHoras"
            name="cadaHoras"
            inputMode="decimal"
            defaultValue={
              v?.cadaHoras ?? fila.plan?.cadaHoras?.toString() ?? ""
            }
            placeholder="Ej. 250"
            className={campo}
          />
        </Campo>
        <Campo
          id="cadaDias"
          label="Cada cuántos días"
          opcional
          error={estado.errores?.cadaDias}
        >
          <input
            id="cadaDias"
            name="cadaDias"
            inputMode="numeric"
            defaultValue={v?.cadaDias ?? fila.plan?.cadaDias?.toString() ?? ""}
            placeholder="Ej. 7"
            className={campo}
          />
        </Campo>
        <div className="sm:col-span-2">
          {grasas.length === 0 ? (
            <SinGrasas />
          ) : (
            <SelectorGrasa
              grasas={grasas}
              valor={v?.tipoGrasaId ?? fila.plan?.tipoGrasaId ?? ""}
              error={estado.errores?.tipoGrasaId}
            />
          )}
        </div>
        <fieldset className="sm:col-span-2">
          <legend className="mb-1.5 text-[13px] font-semibold">
            Puntos de engrase
          </legend>
          {!fila.puntosPropios && fila.puntos.length > 0 && (
            <p className="mb-2 text-xs text-muted">
              Propuestos desde las plantillas de su categoría.
            </p>
          )}
          <ul className="flex flex-col gap-2">
            {puntos.map((p, i) => (
              <li key={i} className="flex gap-2">
                <label htmlFor={`punto-${i}`} className="sr-only">
                  Punto {i + 1}
                </label>
                <input
                  id={`punto-${i}`}
                  name="punto"
                  value={p}
                  maxLength={200}
                  onChange={(e) =>
                    setPuntos((ps) =>
                      ps.map((x, j) => (j === i ? e.target.value : x)),
                    )
                  }
                  placeholder="Ej. Pasador de tolva"
                  className={campo}
                />
                <button
                  type="button"
                  onClick={() =>
                    setPuntos((ps) => ps.filter((_, j) => j !== i))
                  }
                  disabled={puntos.length === 1}
                  aria-label={`Quitar punto ${i + 1}`}
                  className={boton.secundario}
                >
                  Quitar
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => setPuntos((ps) => [...ps, ""])}
            disabled={puntos.length >= 50}
            className={`${boton.secundario} mt-2`}
          >
            Agregar punto
          </button>
          {estado.errores?.puntos && (
            <p className="mt-1.5 text-sm text-bad">{estado.errores.puntos}</p>
          )}
        </fieldset>
      </div>
      <PieFormulario
        estado={estado}
        pendiente={pendiente || grasas.length === 0}
        texto="Guardar plan"
        onCerrar={onCerrar}
      />
    </form>
  );
}

// ---------- Registro ----------

export function ModalRegistrar({
  fila,
  grasas,
  hoy,
}: {
  fila: FilaEngrase;
  grasas: Grasa[];
  hoy: string;
}) {
  const m = useModal();
  return (
    <>
      <button type="button" onClick={m.abrir} className={boton.primario}>
        Registrar
      </button>
      <Modal
        abierto={m.abierto}
        onCerrar={m.cerrar}
        titulo={`Registrar engrase · ${fila.codigo}`}
        descripcion="Marca los puntos engrasados. Solo un engrase completo reinicia el vencimiento."
      >
        <FormRegistrar
          key={m.vez}
          fila={fila}
          grasas={grasas}
          hoy={hoy}
          onCerrar={m.cerrar}
        />
      </Modal>
    </>
  );
}

function FormRegistrar({
  fila,
  grasas,
  hoy,
  onCerrar,
}: {
  fila: FilaEngrase;
  grasas: Grasa[];
  hoy: string;
  onCerrar: () => void;
}) {
  const [estado, enviar, pendiente] = useAccionModal(registrarAction, onCerrar);
  const [marcados, setMarcados] = useState<Set<string>>(new Set());
  const v = estado.valores;
  const faltan = fila.puntos.length - marcados.size;
  const minimo = fila.ultimoRegistro?.horometro;
  const sinPuntos = fila.puntos.length === 0;

  if (sinPuntos) {
    return (
      <div className="p-6">
        <p className="rounded-xl border border-warn/30 bg-warn-soft px-4 py-3 text-sm">
          Este equipo no tiene puntos de engrase. Crea su plan o agrega
          plantillas en Catálogos → Puntos de engrase.
        </p>
      </div>
    );
  }
  return (
    <form action={enviar} noValidate>
      <input type="hidden" name="equipoId" value={fila.id} />
      <Clave />
      <div className="grid gap-5 p-6 sm:grid-cols-2">
        <Campo id="fecha" label="Fecha" error={estado.errores?.fecha}>
          <input
            id="fecha"
            name="fecha"
            type="date"
            max={hoy}
            min={fila.ultimoRegistro?.fecha}
            defaultValue={v?.fecha ?? hoy}
            className={campo}
          />
        </Campo>
        <Campo
          id="horometro"
          label={`Horómetro (${unidad(fila.medidor)})`}
          error={estado.errores?.horometro}
          ayuda={
            minimo !== undefined
              ? `No menor que ${minimo} (último engrase).`
              : undefined
          }
        >
          <input
            id="horometro"
            name="horometro"
            inputMode="decimal"
            defaultValue={v?.horometro ?? String(fila.horometro)}
            className={campo}
          />
        </Campo>
        <div className="sm:col-span-2">
          {grasas.length === 0 ? (
            <SinGrasas />
          ) : (
            <SelectorGrasa
              grasas={grasas}
              valor={v?.tipoGrasaId ?? fila.plan?.tipoGrasaId ?? ""}
              error={estado.errores?.tipoGrasaId}
            />
          )}
        </div>
        <fieldset className="sm:col-span-2">
          <legend className="mb-1.5 text-[13px] font-semibold">
            Puntos engrasados ({marcados.size} de {fila.puntos.length})
          </legend>
          <ul className="flex flex-col gap-1.5">
            {fila.puntos.map((p) => (
              <li key={p.id}>
                <label className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm hover:bg-surface-2">
                  <input
                    type="checkbox"
                    name="engrasado"
                    value={p.id}
                    checked={marcados.has(p.id)}
                    onChange={(e) =>
                      setMarcados((s) => {
                        const n = new Set(s);
                        if (e.target.checked) n.add(p.id);
                        else n.delete(p.id);
                        return n;
                      })
                    }
                    className="size-4 accent-[var(--primary)]"
                  />
                  {p.descripcion}
                </label>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => setMarcados(new Set(fila.puntos.map((p) => p.id)))}
            className={`${boton.secundario} mt-2`}
          >
            Marcar todos
          </button>
        </fieldset>
        <div className="sm:col-span-2">
          <Campo
            id="observacion"
            label={
              faltan > 0
                ? `Observación (obligatoria: ${faltan === 1 ? "falta 1 punto" : `faltan ${faltan} puntos`})`
                : "Observación"
            }
            opcional={faltan === 0}
            error={estado.errores?.observacion}
          >
            <textarea
              id="observacion"
              name="observacion"
              rows={3}
              maxLength={500}
              defaultValue={v?.observacion ?? ""}
              className={campo}
            />
          </Campo>
        </div>
      </div>
      <PieFormulario
        estado={estado}
        pendiente={pendiente || grasas.length === 0}
        texto={faltan > 0 ? "Guardar incompleto" : "Guardar engrase"}
        onCerrar={onCerrar}
      />
    </form>
  );
}

// ---------- Aviso ----------

export function ModalAviso({ aviso }: { aviso: Umbral }) {
  const m = useModal();
  return (
    <>
      <button type="button" onClick={m.abrir} className={boton.secundario}>
        Aviso de engrase
      </button>
      <Modal
        abierto={m.abierto}
        onCerrar={m.cerrar}
        titulo="Aviso de engrase"
        descripcion="Cuánto antes de vencer un equipo pasa a «por vencer». Aplica a toda tu empresa."
      >
        <FormAviso key={m.vez} aviso={aviso} onCerrar={m.cerrar} />
      </Modal>
    </>
  );
}

const EJEMPLO: Record<TipoAviso, (v: number) => string> = {
  PORCENTAJE: (v) =>
    `Plan de 250 h con ${v} %: avisa cuando faltan ${(250 * v) / 100} h.`,
  HORAS: (v) => `Avisa cuando faltan ${v} h (o ${v} km en equipos de km).`,
  DIAS: (v) => `Avisa cuando faltan ${v} días.`,
};

function FormAviso({
  aviso,
  onCerrar,
}: {
  aviso: Umbral;
  onCerrar: () => void;
}) {
  const [estado, enviar, pendiente] = useAccionModal(
    configurarAvisoAction,
    onCerrar,
  );
  const [tipo, setTipo] = useState<TipoAviso>(
    (estado.valores?.tipo as TipoAviso | undefined) ?? aviso.tipo,
  );
  const [valor, setValor] = useState(
    estado.valores?.valor ?? String(aviso.valor),
  );
  const n = Number(valor);
  const valido =
    Number.isInteger(n) &&
    n >= RANGO_AVISO[tipo].min &&
    n <= RANGO_AVISO[tipo].max;
  return (
    <form action={enviar} noValidate>
      <div className="grid gap-5 p-6 sm:grid-cols-2">
        <Campo id="tipo" label="Se mide en" error={estado.errores?.tipo}>
          <select
            id="tipo"
            name="tipo"
            value={tipo}
            onChange={(e) => setTipo(e.target.value as TipoAviso)}
            className={campo}
          >
            {TIPOS_AVISO.map((t) => (
              <option key={t} value={t}>
                {TIPO_AVISO[t]}
              </option>
            ))}
          </select>
        </Campo>
        <Campo
          id="valor"
          label={tipo === "PORCENTAJE" ? "Porcentaje (%)" : "Cantidad"}
          error={estado.errores?.valor}
          ayuda={`Entre ${RANGO_AVISO[tipo].min} y ${RANGO_AVISO[tipo].max}.`}
        >
          <input
            id="valor"
            name="valor"
            inputMode="numeric"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            className={campo}
          />
        </Campo>
        <p className="text-sm text-muted sm:col-span-2">
          {valido ? EJEMPLO[tipo](n) : "Escribe un número entero."}
        </p>
        {tipo !== "PORCENTAJE" && (
          <p className="rounded-xl border border-warn/30 bg-warn-soft px-4 py-3 text-sm sm:col-span-2">
            {tipo === "HORAS"
              ? "Los planes que solo tienen frecuencia en días no saldrán «por vencer»: pasarán de «al día» a «vencido»."
              : "Los planes que solo tienen frecuencia en horas no saldrán «por vencer»: pasarán de «al día» a «vencido»."}
          </p>
        )}
      </div>
      <PieFormulario
        estado={estado}
        pendiente={pendiente}
        texto="Guardar aviso"
        onCerrar={onCerrar}
      />
    </form>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useActionState, useState } from "react";
import type {
  OpcionesPreventivo,
  PreventivoDetalle,
} from "@/modules/preventivos/application/repositorios";
import { RESULTADOS } from "@/modules/preventivos/domain/actividad-observada";
import { duracionHoras, HORA } from "@/modules/preventivos/domain/duracion";
import {
  TIPOS_PM,
  TURNOS,
  type TipoPM,
} from "@/modules/preventivos/domain/preventivo-estado";
import { CRITICIDADES } from "@/modules/trabajos/domain/backlog-estado";
import { MAX_FOTOS } from "@/modules/trabajos/domain/fotos";
import { sumarDias } from "@/shared/kernel/fechas";
import { Campo } from "@/shared/ui/campo";
import { boton, campo } from "@/shared/ui/estilos";
import {
  PieFormulario,
  useAccionModal,
  useModal,
} from "@/shared/ui/formulario-modal";
import { IconoMas } from "@/shared/ui/iconos";
import { Modal } from "@/shared/ui/modal";
import {
  AvisoFirma,
  CampoFotos,
  Clave,
  conFotos,
  Texto,
} from "../trabajos/modales-trabajo";
import {
  backlogObservacionAction,
  ejecutarAction,
  importarAction,
  programarAction,
  reprogramarAction,
  validarPreventivoAction,
  type EstadoImportacion,
  type EstadoPreventivo,
} from "./actions";

const TERCERO = "__tercero__";

export type Prellenado = {
  equipoId: string;
  nombrePlanId: string;
  tipo: TipoPM;
  fechaProgramada: string;
  horometroProgramado: string;
  responsableId: string;
  tercero: string;
  cadaDias: string;
  cadaHoras: string;
};

// Nuevo o "programar siguiente" (con los datos del anterior y la fecha que propone su recurrencia).
export function ModalProgramar({
  opciones,
  hoy,
  prellenado,
}: {
  opciones: OpcionesPreventivo;
  hoy: string;
  prellenado?: Prellenado;
}) {
  const m = useModal();
  return (
    <>
      <button
        type="button"
        onClick={m.abrir}
        className={prellenado ? boton.secundario : boton.primario}
      >
        <IconoMas width={18} height={18} />
        {prellenado ? "Programar siguiente" : "Programar"}
      </button>
      <Modal
        abierto={m.abierto}
        onCerrar={m.cerrar}
        titulo={prellenado ? "Programar el siguiente" : "Programar preventivo"}
        descripcion="Las actividades se copian de la plantilla de su categoría y tipo (Catálogos → Actividades)."
      >
        <FormProgramar
          key={m.vez}
          opciones={opciones}
          hoy={hoy}
          prellenado={prellenado}
          onCerrar={m.cerrar}
        />
      </Modal>
    </>
  );
}

function FormProgramar({
  opciones,
  hoy,
  prellenado,
  onCerrar,
}: {
  opciones: OpcionesPreventivo;
  hoy: string;
  prellenado?: Prellenado;
  onCerrar: () => void;
}) {
  const [estado, enviar, pendiente] = useAccionModal<EstadoPreventivo>(
    programarAction,
    onCerrar,
  );
  const v = estado.valores ?? {
    equipoId: "",
    nombrePlanId: "",
    tipo: "",
    fechaProgramada: hoy,
    horometroProgramado: "",
    responsableId: "",
    tercero: "",
    cadaDias: "",
    cadaHoras: "",
    ...prellenado,
  };
  const e = estado.errores ?? {};
  const [tipo, setTipo] = useState(v.tipo);
  const [esTercero, setEsTercero] = useState(!!v.tercero);
  const horas = opciones.duraciones[tipo as TipoPM];
  const equipos = opciones.equipos.filter(
    (x) => x.movilizado || x.id === v.equipoId,
  );
  const invalido = (k: string) => (e[k] ? true : undefined);
  return (
    <form action={enviar} noValidate>
      <Clave />
      <div className="grid gap-5 p-6 sm:grid-cols-2">
        <Campo id="equipoId" label="Equipo" error={e.equipoId}>
          <select
            id="equipoId"
            name="equipoId"
            defaultValue={v.equipoId}
            className={campo}
            aria-invalid={invalido("equipoId")}
          >
            <option value="">Elige…</option>
            {equipos.map((x) => (
              <option key={x.id} value={x.id}>
                {x.codigo}
              </option>
            ))}
          </select>
        </Campo>
        <Campo id="nombrePlanId" label="Plan" error={e.nombrePlanId}>
          <select
            id="nombrePlanId"
            name="nombrePlanId"
            defaultValue={v.nombrePlanId}
            className={campo}
            aria-invalid={invalido("nombrePlanId")}
          >
            <option value="">Elige…</option>
            {opciones.planes.map((x) => (
              <option key={x.id} value={x.id}>
                {x.nombre}
              </option>
            ))}
          </select>
        </Campo>
        <Campo
          id="tipo"
          label="Tipo"
          error={e.tipo}
          ayuda={
            horas !== undefined
              ? `Parada estándar: ${horas} h`
              : tipo
                ? "Sin duración estándar en Catálogos → Motivos de parada."
                : undefined
          }
        >
          <select
            id="tipo"
            name="tipo"
            value={tipo}
            onChange={(ev) => setTipo(ev.currentTarget.value)}
            className={campo}
            aria-invalid={invalido("tipo")}
          >
            <option value="">Elige…</option>
            {TIPOS_PM.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </Campo>
        <Campo id="fechaProgramada" label="Fecha" error={e.fechaProgramada}>
          <input
            id="fechaProgramada"
            name="fechaProgramada"
            type="date"
            min={sumarDias(hoy, -366)}
            defaultValue={v.fechaProgramada}
            className={campo}
          />
        </Campo>
        <Texto
          id="horometroProgramado"
          label="Horómetro programado"
          valor={v.horometroProgramado}
          error={e.horometroProgramado}
          max={11}
          opcional
          ayuda="La alerta también salta cuando el equipo se acerca a este valor."
        />
        <Campo
          id="responsableId"
          label="Responsable"
          error={esTercero ? undefined : e.tercero}
        >
          <select
            id="responsableId"
            name={esTercero ? undefined : "responsableId"}
            defaultValue={v.tercero ? TERCERO : v.responsableId}
            onChange={(ev) => setEsTercero(ev.currentTarget.value === TERCERO)}
            className={campo}
          >
            <option value="">Elige…</option>
            {opciones.personas.map((x) => (
              <option key={x.id} value={x.id}>
                {x.nombre}
              </option>
            ))}
            <option value={TERCERO}>Un tercero (externo)…</option>
          </select>
        </Campo>
        {esTercero && (
          <Texto
            id="tercero"
            label="Nombre del tercero"
            valor={v.tercero}
            error={e.tercero}
            max={120}
          />
        )}
        <Texto
          id="cadaDias"
          label="Repetir cada (días)"
          valor={v.cadaDias}
          error={e.cadaDias}
          max={4}
          opcional
          ayuda="Propone la fecha del siguiente al validarse."
        />
        <Texto
          id="cadaHoras"
          label="Repetir cada (horas)"
          valor={v.cadaHoras}
          error={e.cadaHoras}
          max={6}
          opcional
        />
      </div>
      <PieFormulario
        estado={estado}
        pendiente={pendiente}
        texto="Programar"
        onCerrar={onCerrar}
      />
    </form>
  );
}

const COLUMNAS: [string, string][] = [
  ["EQUIPO", "Código del equipo (movilizado)."],
  ["PLAN", "Nombre del plan, como en Catálogos."],
  ["TIPO", "PM1, PM2, PM3 o PM4."],
  ["FECHA", "2026-11-30 o 30/11/2026."],
  ["RESPONSABLE", "Nombre y apellido de una persona, o el del tercero."],
  ["HOROMETRO", "Opcional. Número con punto decimal."],
];

export function ModalImportar() {
  const router = useRouter();
  const m = useModal();
  const cerrar = () => {
    m.cerrar();
    router.refresh();
  };
  return (
    <>
      <button type="button" onClick={m.abrir} className={boton.secundario}>
        Importar CSV
      </button>
      <Modal
        abierto={m.abierto}
        onCerrar={cerrar}
        titulo="Importar preventivos desde CSV"
        descripcion="Si ya existe el mismo equipo, plan y fecha, la fila se omite: importar dos veces no duplica."
      >
        <FormImportar key={m.vez} onCerrar={cerrar} />
      </Modal>
    </>
  );
}

function FormImportar({ onCerrar }: { onCerrar: () => void }) {
  const [estado, enviar, pendiente] = useActionState<
    EstadoImportacion,
    FormData
  >(importarAction, {});

  if (estado.resumen) {
    const { creados, omitidos, errores } = estado.resumen;
    return (
      <div className="flex flex-col gap-4 p-6">
        <div className="grid gap-3 sm:grid-cols-3">
          <Cifra valor={creados} texto="creados" color="text-ok" />
          <Cifra valor={omitidos} texto="ya existían" color="text-muted" />
          <Cifra
            valor={errores.length}
            texto="con error"
            color={errores.length ? "text-bad" : "text-muted"}
          />
        </div>
        {errores.length > 0 && (
          <div className="max-h-64 overflow-y-auto rounded-lg border border-bad/30">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-bad-soft text-left">
                <tr>
                  <th className="px-4 py-2 text-xs font-semibold text-bad">
                    Fila
                  </th>
                  <th className="px-4 py-2 text-xs font-semibold text-bad">
                    Motivo
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {errores.map((x) => (
                  <tr key={`${x.fila}-${x.motivo}`}>
                    <td className="px-4 py-2 font-mono tabular-nums">
                      {x.fila}
                    </td>
                    <td className="px-4 py-2">{x.motivo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <button
          type="button"
          onClick={onCerrar}
          className={`${boton.primario} self-end`}
        >
          Listo
        </button>
      </div>
    );
  }

  return (
    <form action={enviar}>
      <div className="flex flex-col gap-5 p-6">
        <Campo id="archivo" label="Archivo .csv (máx. 512 KB, 1000 filas)">
          <input
            id="archivo"
            name="archivo"
            type="file"
            required
            accept=".csv,text/csv"
            className={`${campo} file:mr-3 file:rounded-md file:border-0 file:bg-surface-2 file:px-3 file:py-1 file:text-sm file:font-medium`}
          />
        </Campo>
        <div className="rounded-lg bg-surface-2 p-4 text-sm">
          <p className="font-medium">
            Primera fila: encabezados. Separado por coma o punto y coma.
          </p>
          <dl className="mt-2 grid gap-x-4 gap-y-1.5 sm:grid-cols-[auto_1fr]">
            {COLUMNAS.map(([col, ayuda]) => (
              <div key={col} className="contents">
                <dt className="font-mono text-xs font-semibold">{col}</dt>
                <dd className="text-muted">{ayuda}</dd>
              </div>
            ))}
          </dl>
        </div>
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
        <button type="submit" disabled={pendiente} className={boton.primario}>
          {pendiente ? "Importando…" : "Importar"}
        </button>
      </div>
    </form>
  );
}

function Cifra({
  valor,
  texto,
  color,
}: {
  valor: number;
  texto: string;
  color: string;
}) {
  return (
    <div className="rounded-lg border border-border p-4 text-center">
      <p className={`font-mono text-2xl font-semibold tabular-nums ${color}`}>
        {valor}
      </p>
      <p className="text-sm text-muted">{texto}</p>
    </div>
  );
}

export function ModalEjecutar({
  preventivo,
  personas,
  hoy,
  tieneFirma,
}: {
  preventivo: PreventivoDetalle;
  personas: { id: string; nombre: string }[];
  hoy: string;
  tieneFirma: boolean;
}) {
  const m = useModal();
  return (
    <>
      <button type="button" onClick={m.abrir} className={boton.primario}>
        Ejecutar
      </button>
      <Modal
        abierto={m.abierto}
        onCerrar={m.cerrar}
        titulo={`Ejecutar ${preventivo.codigo}`}
        descripcion="Al guardar se firma con tu firma precargada y pasa a validación del supervisor."
      >
        <FormEjecutar
          key={m.vez}
          p={preventivo}
          personas={personas}
          hoy={hoy}
          tieneFirma={tieneFirma}
          onCerrar={m.cerrar}
        />
      </Modal>
    </>
  );
}

type Repuesto = { descripcion: string; cantidad: string; unidad: string };

function FormEjecutar({
  p,
  personas,
  hoy,
  tieneFirma,
  onCerrar,
}: {
  p: PreventivoDetalle;
  personas: { id: string; nombre: string }[];
  hoy: string;
  tieneFirma: boolean;
  onCerrar: () => void;
}) {
  const [estado, enviar, pendiente] = useAccionModal<EstadoPreventivo>(
    ejecutarAction,
    onCerrar,
  );
  const v = estado.valores ?? {};
  const e = estado.errores ?? {};
  const [inicio, setInicio] = useState(v.horaInicio ?? p.horaInicio ?? "");
  const [fin, setFin] = useState(v.horaFin ?? p.horaFin ?? "");
  const [resultados, setResultados] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      p.actividades.map((a) => [
        a.id,
        v[`resultado:${a.id}`] ?? a.resultado ?? "",
      ]),
    ),
  );
  const [repuestos, setRepuestos] = useState<Repuesto[]>(() => {
    try {
      if (v.repuestos) return JSON.parse(v.repuestos) as Repuesto[];
    } catch {}
    return p.repuestos.map((r) => ({
      descripcion: r.descripcion,
      cantidad: String(r.cantidad),
      unidad: r.unidad ?? "",
    }));
  });
  const enPersonal = new Set(p.personal.map((x) => x.id));
  const cruza = HORA.test(inicio) && HORA.test(fin) && fin < inicio;
  const duracion =
    HORA.test(inicio) && HORA.test(fin) && inicio !== fin
      ? duracionHoras(inicio, fin)
      : null;
  const cambiarRepuesto = (i: number, campo: keyof Repuesto, valor: string) =>
    setRepuestos((rs) =>
      rs.map((r, j) => (j === i ? { ...r, [campo]: valor } : r)),
    );

  return (
    <>
      {!tieneFirma && <AvisoFirma />}
      <form action={conFotos(enviar)} noValidate>
        <input type="hidden" name="preventivoId" value={p.id} />
        <input
          type="hidden"
          name="repuestos"
          value={JSON.stringify(repuestos)}
        />
        <Clave />
        <div className="grid gap-5 p-6 sm:grid-cols-2">
          <Campo id="fechaEjecucion" label="Fecha" error={e.fechaEjecucion}>
            <input
              id="fechaEjecucion"
              name="fechaEjecucion"
              type="date"
              max={hoy}
              defaultValue={v.fechaEjecucion ?? p.fechaEjecucion ?? hoy}
              className={campo}
            />
          </Campo>
          <Campo id="turno" label="Turno" error={e.turno}>
            <select
              id="turno"
              name="turno"
              defaultValue={v.turno ?? p.turno ?? ""}
              className={campo}
            >
              <option value="">Elige…</option>
              {Object.entries(TURNOS).map(([k, t]) => (
                <option key={k} value={k}>
                  {t}
                </option>
              ))}
            </select>
          </Campo>
          <Campo id="horaInicio" label="Hora de inicio" error={e.horaInicio}>
            <input
              id="horaInicio"
              name="horaInicio"
              type="time"
              value={inicio}
              onChange={(ev) => setInicio(ev.currentTarget.value)}
              className={campo}
            />
          </Campo>
          <Campo
            id="horaFin"
            label="Hora de fin"
            error={e.horaFin}
            ayuda={
              duracion !== null
                ? `Duración: ${duracion} h${cruza ? " (cruza la medianoche)" : ""}`
                : undefined
            }
          >
            <input
              id="horaFin"
              name="horaFin"
              type="time"
              value={fin}
              onChange={(ev) => setFin(ev.currentTarget.value)}
              className={campo}
            />
          </Campo>
          <Texto
            id="horometroEjecucion"
            label="Horómetro"
            valor={
              v.horometroEjecucion ??
              (p.horometroEjecucion === null
                ? ""
                : String(p.horometroEjecucion))
            }
            error={e.horometroEjecucion}
            max={11}
            opcional
            ayuda="Si es mayor que el actual, actualiza el del equipo."
          />
          {MAX_FOTOS - p.fotos.length > 0 && (
            <CampoFotos restantes={MAX_FOTOS - p.fotos.length} />
          )}
        </div>

        <fieldset className="border-t border-border px-6 py-5">
          <legend className="sr-only">Actividades</legend>
          <p className="mb-3 text-sm font-semibold">Actividades</p>
          {p.actividades.length === 0 ? (
            <p className="text-sm text-muted">
              Sin actividades: la plantilla no tenía ninguna para este equipo y
              tipo.
            </p>
          ) : (
            <ol className="flex flex-col gap-4">
              {p.actividades.map((a, i) => (
                <li key={a.id} className="rounded-lg border border-border p-3">
                  <p className="mb-2 text-sm">
                    <span className="mr-2 font-mono text-xs text-muted">
                      {i + 1}.
                    </span>
                    {a.descripcion}
                  </p>
                  <div
                    role="radiogroup"
                    aria-label={`Resultado de ${a.descripcion}`}
                    className="flex flex-wrap gap-2"
                  >
                    {Object.entries(RESULTADOS).map(([k, t]) => (
                      <label
                        key={k}
                        className={`cursor-pointer rounded-md border px-3 py-1 text-sm ${
                          resultados[a.id] === k
                            ? "border-primary bg-primary-soft font-medium"
                            : "border-border text-muted"
                        }`}
                      >
                        <input
                          type="radio"
                          name={`resultado:${a.id}`}
                          value={k}
                          checked={resultados[a.id] === k}
                          onChange={() =>
                            setResultados((r) => ({ ...r, [a.id]: k }))
                          }
                          className="sr-only"
                        />
                        {t}
                      </label>
                    ))}
                  </div>
                  {resultados[a.id] === "OBSERVADO" && (
                    <textarea
                      name={`observacion:${a.id}`}
                      aria-label={`Observación de ${a.descripcion}`}
                      placeholder="¿Qué encontraste?"
                      maxLength={500}
                      rows={2}
                      defaultValue={
                        v[`observacion:${a.id}`] ?? a.observacion ?? ""
                      }
                      className={`${campo} mt-2`}
                    />
                  )}
                </li>
              ))}
            </ol>
          )}
        </fieldset>

        <fieldset className="border-t border-border px-6 py-5">
          <legend className="sr-only">Repuestos</legend>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold">Repuestos usados</p>
            {repuestos.length < 30 && (
              <button
                type="button"
                onClick={() =>
                  setRepuestos((r) => [
                    ...r,
                    { descripcion: "", cantidad: "", unidad: "" },
                  ])
                }
                className="text-sm font-semibold text-primary hover:underline"
              >
                + Agregar
              </button>
            )}
          </div>
          {repuestos.length === 0 && (
            <p className="text-sm text-muted">Ninguno.</p>
          )}
          <ul className="flex flex-col gap-2">
            {repuestos.map((r, i) => (
              <li key={i} className="grid grid-cols-[1fr_6rem_5rem_auto] gap-2">
                <input
                  aria-label="Repuesto"
                  placeholder="Repuesto"
                  maxLength={300}
                  value={r.descripcion}
                  onChange={(ev) =>
                    cambiarRepuesto(i, "descripcion", ev.currentTarget.value)
                  }
                  className={campo}
                />
                <input
                  aria-label="Cantidad"
                  placeholder="Cant."
                  inputMode="decimal"
                  value={r.cantidad}
                  onChange={(ev) =>
                    cambiarRepuesto(i, "cantidad", ev.currentTarget.value)
                  }
                  className={`${campo} tabular-nums`}
                />
                <input
                  aria-label="Unidad"
                  placeholder="Und."
                  maxLength={20}
                  value={r.unidad}
                  onChange={(ev) =>
                    cambiarRepuesto(i, "unidad", ev.currentTarget.value)
                  }
                  className={campo}
                />
                <button
                  type="button"
                  aria-label="Quitar repuesto"
                  onClick={() =>
                    setRepuestos((rs) => rs.filter((_, j) => j !== i))
                  }
                  className="px-2 text-muted hover:text-bad"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        </fieldset>

        {personas.length > 0 && (
          <fieldset className="border-t border-border px-6 py-5">
            <legend className="mb-3 text-sm font-semibold">
              Personal que participó
            </legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {personas.map((x) => (
                <label key={x.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="personal"
                    value={x.id}
                    defaultChecked={enPersonal.has(x.id)}
                  />
                  {x.nombre}
                </label>
              ))}
            </div>
          </fieldset>
        )}

        <div className="border-t border-border px-6 py-5">
          <Texto
            id="notas"
            label="Notas"
            valor={v.notas ?? p.notas ?? ""}
            error={e.notas}
            max={1000}
            opcional
            largo
          />
        </div>
        <PieFormulario
          estado={estado}
          pendiente={pendiente}
          texto="Guardar y firmar"
          onCerrar={onCerrar}
        />
      </form>
    </>
  );
}

export function ModalValidar({
  preventivoId,
  tieneFirma,
}: {
  preventivoId: string;
  tieneFirma: boolean;
}) {
  const m = useModal();
  return (
    <>
      <button type="button" onClick={m.abrir} className={boton.primario}>
        Validar
      </button>
      <Modal
        abierto={m.abierto}
        onCerrar={m.cerrar}
        titulo="Validar preventivo"
        descripcion="Aprueba con tu firma o devuélvelo al técnico con lo que debe completar."
      >
        <FormValidar
          key={m.vez}
          preventivoId={preventivoId}
          tieneFirma={tieneFirma}
          onCerrar={m.cerrar}
        />
      </Modal>
    </>
  );
}

function FormValidar({
  preventivoId,
  tieneFirma,
  onCerrar,
}: {
  preventivoId: string;
  tieneFirma: boolean;
  onCerrar: () => void;
}) {
  const [estado, enviar, pendiente] = useAccionModal(
    validarPreventivoAction,
    onCerrar,
  );
  return (
    <>
      {!tieneFirma && <AvisoFirma />}
      <form action={enviar} noValidate>
        <input type="hidden" name="preventivoId" value={preventivoId} />
        <Clave />
        <div className="p-6">
          <Texto
            id="nota"
            label="Observación"
            valor={estado.valores?.nota ?? ""}
            error={estado.errores?.nota}
            max={500}
            largo
            ayuda="Obligatoria si lo devuelves."
          />
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border px-6 py-4">
          {estado.error && (
            <p className="mr-auto text-sm text-bad" aria-live="polite">
              {estado.error}
            </p>
          )}
          <button
            type="submit"
            name="decision"
            value="DEVOLVER"
            disabled={pendiente}
            className={boton.secundario}
          >
            Devolver
          </button>
          <button
            type="submit"
            name="decision"
            value="APROBAR"
            disabled={pendiente}
            className={boton.primario}
          >
            {pendiente ? "Guardando…" : "Aprobar y firmar"}
          </button>
        </div>
      </form>
    </>
  );
}

// Un vencido se mueve por defecto a la semana siguiente.
export function ModalReprogramar({
  preventivoId,
  hoy,
  fechaActual,
}: {
  preventivoId: string;
  hoy: string;
  fechaActual: string;
}) {
  const m = useModal();
  const propuesta =
    fechaActual < hoy ? sumarDias(hoy, 7) : sumarDias(fechaActual, 7);
  return (
    <>
      <button type="button" onClick={m.abrir} className={boton.secundario}>
        Reprogramar
      </button>
      <Modal
        abierto={m.abierto}
        onCerrar={m.cerrar}
        titulo="Reprogramar preventivo"
        descripcion="El cambio de fecha queda en el historial."
      >
        <FormReprogramar
          key={m.vez}
          preventivoId={preventivoId}
          hoy={hoy}
          propuesta={propuesta}
          onCerrar={m.cerrar}
        />
      </Modal>
    </>
  );
}

function FormReprogramar({
  preventivoId,
  hoy,
  propuesta,
  onCerrar,
}: {
  preventivoId: string;
  hoy: string;
  propuesta: string;
  onCerrar: () => void;
}) {
  const [estado, enviar, pendiente] = useAccionModal(
    reprogramarAction,
    onCerrar,
  );
  return (
    <form action={enviar} noValidate>
      <input type="hidden" name="preventivoId" value={preventivoId} />
      <Clave />
      <div className="p-6">
        <Campo id="fecha" label="Nueva fecha" error={estado.errores?.fecha}>
          <input
            id="fecha"
            name="fecha"
            type="date"
            min={hoy}
            defaultValue={estado.valores?.fecha ?? propuesta}
            className={campo}
          />
        </Campo>
      </div>
      <PieFormulario
        estado={estado}
        pendiente={pendiente}
        texto="Reprogramar"
        onCerrar={onCerrar}
      />
    </form>
  );
}

export function ModalBacklogObservacion({
  preventivoId,
  actividad,
}: {
  preventivoId: string;
  actividad: { id: string; descripcion: string; observacion: string | null };
}) {
  const m = useModal();
  return (
    <>
      <button
        type="button"
        onClick={m.abrir}
        className="text-sm font-semibold text-primary hover:underline"
      >
        Crear backlog
      </button>
      <Modal
        abierto={m.abierto}
        onCerrar={m.cerrar}
        titulo="Crear backlog desde la observación"
        descripcion={`${actividad.descripcion}: ${actividad.observacion ?? ""}`}
      >
        <FormBacklogObservacion
          key={m.vez}
          preventivoId={preventivoId}
          actividadId={actividad.id}
          onCerrar={m.cerrar}
        />
      </Modal>
    </>
  );
}

function FormBacklogObservacion({
  preventivoId,
  actividadId,
  onCerrar,
}: {
  preventivoId: string;
  actividadId: string;
  onCerrar: () => void;
}) {
  const [estado, enviar, pendiente] = useAccionModal(
    backlogObservacionAction,
    onCerrar,
  );
  return (
    <form action={enviar} noValidate>
      <input type="hidden" name="preventivoId" value={preventivoId} />
      <input type="hidden" name="actividadId" value={actividadId} />
      <div className="p-6">
        <Campo
          id="criticidad"
          label="Criticidad"
          error={estado.errores?.criticidad}
          ayuda="Aparece en la bandeja de Backlogs y OT con origen preventivo."
        >
          <select
            id="criticidad"
            name="criticidad"
            defaultValue={estado.valores?.criticidad ?? "MEDIA"}
            className={campo}
          >
            {Object.entries(CRITICIDADES).map(([k, t]) => (
              <option key={k} value={k}>
                {t}
              </option>
            ))}
          </select>
        </Campo>
      </div>
      <PieFormulario
        estado={estado}
        pendiente={pendiente}
        texto="Crear backlog"
        onCerrar={onCerrar}
      />
    </form>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useActionState, useState } from "react";
import type {
  OpcionesParada,
  ParadaDetalle,
} from "@/modules/paradas/application/repositorios";
import { duracionHoras, esFechaHora } from "@/modules/paradas/domain/duracion";
import { MAX_FOTOS_PARADA } from "@/modules/paradas/domain/revision-parada";
import { CRITICIDADES } from "@/modules/trabajos/domain/backlog-estado";
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
  CampoFotos,
  Clave,
  conFotos,
  Texto,
} from "../trabajos/modales-trabajo";
import {
  backlogHallazgoAction,
  cerrarAction,
  importarAction,
  iniciarAction,
  type EstadoImportacion,
  type EstadoParada,
} from "./actions";

const EXTERNO = "__externo__";
const nf = new Intl.NumberFormat("es-PE");

// Aparece cuando la base o la revisión avisan de un cruce con otra parada del mismo equipo.
function ConfirmarCruce({ visible }: { visible?: boolean }) {
  if (!visible) return null;
  return (
    <label className="flex items-start gap-2 rounded-lg border border-warn/40 bg-warn-soft px-3 py-2.5 text-sm sm:col-span-2">
      <input type="checkbox" name="confirmarCruce" className="mt-0.5" />
      <span>
        <strong className="font-semibold">Confirmo el cruce:</strong> el equipo
        tuvo dos paradas a la vez (por ejemplo, un preventivo durante un
        correctivo).
      </span>
    </label>
  );
}

export function ModalIniciar({
  opciones,
  ahora,
}: {
  opciones: OpcionesParada;
  ahora: string;
}) {
  const m = useModal();
  return (
    <>
      <button type="button" onClick={m.abrir} className={boton.primario}>
        <IconoMas width={18} height={18} />
        Registrar parada
      </button>
      <Modal
        abierto={m.abierto}
        onCerrar={m.cerrar}
        titulo="Registrar parada"
        descripcion="El equipo queda «en mantenimiento» hasta que se cierre su última parada abierta."
      >
        <FormIniciar
          key={m.vez}
          opciones={opciones}
          ahora={ahora}
          onCerrar={m.cerrar}
        />
      </Modal>
    </>
  );
}

function FormIniciar({
  opciones,
  ahora,
  onCerrar,
}: {
  opciones: OpcionesParada;
  ahora: string;
  onCerrar: () => void;
}) {
  const [estado, enviar, pendiente] = useAccionModal<EstadoParada>(
    iniciarAction,
    onCerrar,
  );
  const v = estado.valores ?? {
    equipoId: "",
    motivoId: "",
    inicio: ahora,
    horometroInicio: "",
    responsableId: "",
    responsableExterno: "",
  };
  const e = estado.errores ?? {};
  const [equipoId, setEquipoId] = useState(v.equipoId);
  const [motivoId, setMotivoId] = useState(v.motivoId);
  const [externo, setExterno] = useState(!!v.responsableExterno);
  const equipo = opciones.equipos.find((x) => x.id === equipoId);
  const motivo = opciones.motivos.find((x) => x.id === motivoId);
  return (
    <form action={conFotos(enviar)} noValidate>
      <Clave />
      <div className="grid gap-5 p-6 sm:grid-cols-2">
        <Campo id="equipoId" label="Equipo" error={e.equipoId}>
          <select
            id="equipoId"
            name="equipoId"
            value={equipoId}
            onChange={(ev) => setEquipoId(ev.currentTarget.value)}
            className={campo}
          >
            <option value="">Elige…</option>
            {opciones.equipos
              .filter((x) => x.movilizado)
              .map((x) => (
                <option key={x.id} value={x.id}>
                  {x.codigo}
                </option>
              ))}
          </select>
        </Campo>
        <Campo
          id="motivoId"
          label="Motivo"
          error={e.motivoId}
          ayuda={
            motivo
              ? motivo.esPlanificado
                ? "Parada planificada."
                : "Parada no planificada: cuenta para el ranking de fallas."
              : undefined
          }
        >
          <select
            id="motivoId"
            name="motivoId"
            value={motivoId}
            onChange={(ev) => setMotivoId(ev.currentTarget.value)}
            className={campo}
          >
            <option value="">Elige…</option>
            {opciones.motivos.map((x) => (
              <option key={x.id} value={x.id}>
                {x.codigo} — {x.nombre}
              </option>
            ))}
          </select>
        </Campo>
        <Campo id="inicio" label="Fecha y hora de parada" error={e.inicio}>
          <input
            id="inicio"
            name="inicio"
            type="datetime-local"
            max={ahora}
            defaultValue={v.inicio}
            className={campo}
          />
        </Campo>
        <Campo
          id="horometroInicio"
          label="Horómetro"
          error={e.horometroInicio}
          ayuda={
            equipo
              ? `Actual del equipo: ${nf.format(equipo.horometro)}`
              : undefined
          }
        >
          <input
            id="horometroInicio"
            name="horometroInicio"
            inputMode="decimal"
            defaultValue={v.horometroInicio}
            className={`${campo} tabular-nums`}
          />
        </Campo>
        <Campo
          id="responsableId"
          label="Responsable"
          error={externo ? undefined : e.responsableExterno}
        >
          <select
            id="responsableId"
            name={externo ? undefined : "responsableId"}
            defaultValue={v.responsableExterno ? EXTERNO : v.responsableId}
            onChange={(ev) => setExterno(ev.currentTarget.value === EXTERNO)}
            className={campo}
          >
            <option value="">Elige…</option>
            {opciones.personas.map((x) => (
              <option key={x.id} value={x.id}>
                {x.nombre}
              </option>
            ))}
            <option value={EXTERNO}>Externo (taller, proveedor)…</option>
          </select>
        </Campo>
        {externo && (
          <Texto
            id="responsableExterno"
            label="Nombre del externo"
            valor={v.responsableExterno}
            error={e.responsableExterno}
            max={120}
          />
        )}
        <CampoFotos restantes={MAX_FOTOS_PARADA} />
        <ConfirmarCruce visible={estado.cruce} />
      </div>
      <PieFormulario
        estado={estado}
        pendiente={pendiente}
        texto="Registrar"
        onCerrar={onCerrar}
      />
    </form>
  );
}

export function ModalCerrar({
  parada,
  areas,
  ahora,
}: {
  parada: ParadaDetalle;
  areas: OpcionesParada["areas"];
  ahora: string;
}) {
  const m = useModal();
  return (
    <>
      <button type="button" onClick={m.abrir} className={boton.primario}>
        Cerrar parada
      </button>
      <Modal
        abierto={m.abierto}
        onCerrar={m.cerrar}
        titulo={`Cerrar ${parada.codigo}`}
        descripcion="Hora de salida, horómetro y la tarea realizada."
      >
        <FormCerrar
          key={m.vez}
          parada={parada}
          areas={areas}
          ahora={ahora}
          onCerrar={m.cerrar}
        />
      </Modal>
    </>
  );
}

function FormCerrar({
  parada: p,
  areas,
  ahora,
  onCerrar,
}: {
  parada: ParadaDetalle;
  areas: OpcionesParada["areas"];
  ahora: string;
  onCerrar: () => void;
}) {
  const [estado, enviar, pendiente] = useAccionModal<EstadoParada>(
    cerrarAction,
    onCerrar,
  );
  const v = estado.valores ?? {
    fin: ahora,
    horometroFin: String(p.horometroInicio),
    descripcion: "",
    areaDemoraId: "",
    areaParadaId: "",
    hallazgo: "",
  };
  const e = estado.errores ?? {};
  const [fin, setFin] = useState(v.fin);
  const horas = esFechaHora(fin) ? duracionHoras(p.inicio, fin) : null;
  const restantes = MAX_FOTOS_PARADA - p.fotos.length;
  const area = (tipo: "DEMORA" | "PARADA") =>
    areas.filter((a) => a.tipo === tipo);
  return (
    <form action={conFotos(enviar)} noValidate>
      <input type="hidden" name="paradaId" value={p.id} />
      <Clave />
      <div className="grid gap-5 p-6 sm:grid-cols-2">
        <Campo
          id="fin"
          label="Fecha y hora de salida"
          error={e.fin}
          ayuda={
            horas !== null && horas > 0
              ? `Duración: ${nf.format(horas)} h`
              : undefined
          }
        >
          <input
            id="fin"
            name="fin"
            type="datetime-local"
            min={p.inicio}
            max={ahora}
            value={fin}
            onChange={(ev) => setFin(ev.currentTarget.value)}
            className={campo}
          />
        </Campo>
        <Campo
          id="horometroFin"
          label="Horómetro de salida"
          error={e.horometroFin}
          ayuda={`Al parar: ${nf.format(p.horometroInicio)}`}
        >
          <input
            id="horometroFin"
            name="horometroFin"
            inputMode="decimal"
            defaultValue={v.horometroFin}
            className={`${campo} tabular-nums`}
          />
        </Campo>
        <Texto
          id="descripcion"
          label="Tarea realizada"
          valor={v.descripcion}
          error={e.descripcion}
          max={1000}
          largo
        />
        <Campo id="areaParadaId" label="Área de parada" opcional>
          <select
            id="areaParadaId"
            name="areaParadaId"
            defaultValue={v.areaParadaId}
            className={campo}
          >
            <option value="">—</option>
            {area("PARADA").map((a) => (
              <option key={a.id} value={a.id}>
                {a.nombre}
              </option>
            ))}
          </select>
        </Campo>
        <Campo id="areaDemoraId" label="Área de demora" opcional>
          <select
            id="areaDemoraId"
            name="areaDemoraId"
            defaultValue={v.areaDemoraId}
            className={campo}
          >
            <option value="">—</option>
            {area("DEMORA").map((a) => (
              <option key={a.id} value={a.id}>
                {a.nombre}
              </option>
            ))}
          </select>
        </Campo>
        <Texto
          id="hallazgo"
          label="Hallazgo"
          valor={v.hallazgo}
          error={e.hallazgo}
          max={1000}
          opcional
          largo
          ayuda="Algo que hay que corregir después: luego puedes pasarlo a backlog."
        />
        {restantes > 0 && <CampoFotos restantes={restantes} />}
        <ConfirmarCruce visible={estado.cruce} />
      </div>
      <PieFormulario
        estado={estado}
        pendiente={pendiente}
        texto="Cerrar parada"
        onCerrar={onCerrar}
      />
    </form>
  );
}

export function ModalBacklogHallazgo({ parada }: { parada: ParadaDetalle }) {
  const m = useModal();
  return (
    <>
      <button type="button" onClick={m.abrir} className={boton.secundario}>
        Crear backlog
      </button>
      <Modal
        abierto={m.abierto}
        onCerrar={m.cerrar}
        titulo="Crear backlog desde el hallazgo"
        descripcion={parada.hallazgo ?? undefined}
      >
        <FormBacklog key={m.vez} paradaId={parada.id} onCerrar={m.cerrar} />
      </Modal>
    </>
  );
}

function FormBacklog({
  paradaId,
  onCerrar,
}: {
  paradaId: string;
  onCerrar: () => void;
}) {
  const [estado, enviar, pendiente] = useAccionModal(
    backlogHallazgoAction,
    onCerrar,
  );
  const e = estado.errores ?? {};
  return (
    <form action={enviar} noValidate>
      <input type="hidden" name="paradaId" value={paradaId} />
      <div className="grid gap-5 p-6 sm:grid-cols-2">
        <Texto
          id="componente"
          label="Componente"
          valor={estado.valores?.componente ?? ""}
          error={e.componente}
          max={120}
        />
        <Campo id="criticidad" label="Criticidad" error={e.criticidad}>
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

const COLUMNAS: [string, string][] = [
  ["ID_IMPORTACION", "Único por fila. Si ya se importó, se omite."],
  ["EQUIPO", "Código de un equipo ya registrado."],
  ["MOTIVO", "Código (MCI, PM1…) o nombre del motivo."],
  ["INICIO · FIN", "Fecha y hora: 2026-11-19 08:30 o 19/11/2026 08:30."],
  ["HOROMETRO_INICIO · HOROMETRO_FIN", "Números con punto decimal."],
  ["DESCRIPCION", "Tarea realizada."],
  ["RESPONSABLE", "Nombre y apellido, o el del externo."],
  ["AREA_DEMORA · AREA_PARADA", "Opcionales. Nombre del área."],
  ["HALLAZGO", "Opcional. Crea un backlog con origen parada."],
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
        Importar Excel
      </button>
      <Modal
        abierto={m.abierto}
        onCerrar={cerrar}
        titulo="Importar paradas desde Excel"
        descripcion="Paradas ya cerradas del historial. Importar el mismo archivo dos veces no duplica nada."
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
    const r = estado.resumen;
    return (
      <div className="flex flex-col gap-4 p-6">
        <div className="grid gap-3 sm:grid-cols-3">
          <Cifra valor={r.creadas} texto="creadas" color="text-ok" />
          <Cifra
            valor={r.repetidas}
            texto="ya importadas"
            color={r.repetidas ? "text-warn" : "text-muted"}
          />
          <Cifra
            valor={r.errores.length}
            texto="con error"
            color={r.errores.length ? "text-bad" : "text-muted"}
          />
        </div>
        {(r.backlogs > 0 || r.conCruce > 0 || r.repetidas > 0) && (
          <ul className="list-disc pl-5 text-sm text-muted">
            {r.repetidas > 0 && (
              <li>
                {r.repetidas}{" "}
                {r.repetidas === 1 ? "fila ya estaba" : "filas ya estaban"}{" "}
                importada{r.repetidas === 1 ? "" : "s"} (mismo ID): no se
                duplicaron.
              </li>
            )}
            {r.backlogs > 0 && (
              <li>{r.backlogs} backlog(s) creados desde hallazgos.</li>
            )}
            {r.conCruce > 0 && (
              <li>
                {r.conCruce} parada(s) se cruzan con otra del mismo equipo.
              </li>
            )}
          </ul>
        )}
        {r.errores.length > 0 && (
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
                {r.errores.map((x) => (
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
        <Campo id="archivo" label="Archivo .xlsx (máx. 2 MB, 1000 filas)">
          <input
            id="archivo"
            name="archivo"
            type="file"
            required
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className={`${campo} file:mr-3 file:rounded-md file:border-0 file:bg-surface-2 file:px-3 file:py-1 file:text-sm file:font-medium`}
          />
        </Campo>
        <div className="rounded-lg bg-surface-2 p-4 text-sm">
          <p className="font-medium">Primera fila: encabezados. Columnas:</p>
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

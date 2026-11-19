"use client";

import { startTransition, useState } from "react";
import type {
  BacklogDetalle,
  OpcionesTrabajo,
} from "@/modules/trabajos/application/repositorios";
import { CRITICIDADES } from "@/modules/trabajos/domain/backlog-estado";
import { MAX_FOTOS } from "@/modules/trabajos/domain/fotos";
import { Campo } from "@/shared/ui/campo";
import { comprimirImagen } from "@/shared/ui/comprimir-imagen";
import { boton, campo } from "@/shared/ui/estilos";
import {
  PieFormulario,
  useAccionModal,
  useModal,
} from "@/shared/ui/formulario-modal";
import { IconoMas } from "@/shared/ui/iconos";
import { Modal } from "@/shared/ui/modal";
import {
  abrirOtAction,
  cerrarReporteAction,
  crearBacklogAction,
  editarBacklogAction,
  estadoRequisicionAction,
  reabrirAction,
  requisicionAction,
  validarAction,
  type EstadoTrabajo,
} from "./actions";
import { ModalFirma } from "./modal-firma";

const enlace = "text-sm font-semibold hover:underline";

// Clave de idempotencia: una por apertura del modal (el formulario se monta de nuevo cada vez).
export function Clave() {
  const [clave] = useState(() => crypto.randomUUID());
  return <input type="hidden" name="clave" value={clave} />;
}

// Reduce las fotos en el navegador antes de enviar el formulario.
export function conFotos(enviar: (fd: FormData) => void) {
  return async (fd: FormData) => {
    const fotos = fd
      .getAll("fotos")
      .filter((f): f is File => f instanceof File && f.size > 0);
    fd.delete("fotos");
    for (const f of fotos) fd.append("fotos", await comprimirImagen(f));
    startTransition(() => enviar(fd));
  };
}

export function CampoFotos({
  restantes,
  error,
}: {
  restantes: number;
  error?: string;
}) {
  const [aviso, setAviso] = useState<string | null>(null);
  return (
    <Campo
      id="fotos"
      label={`Fotos (hasta ${restantes})`}
      opcional
      ancho
      error={aviso ?? error}
      ayuda="JPG, PNG o WEBP. Se reducen antes de enviarse."
    >
      <input
        id="fotos"
        name="fotos"
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp"
        onChange={(e) => {
          const n = e.currentTarget.files?.length ?? 0;
          setAviso(n > restantes ? `Elige como máximo ${restantes}.` : null);
          if (n > restantes) e.currentTarget.value = "";
        }}
        className={`${campo} file:mr-3 file:rounded-lg file:border-0 file:bg-surface-2 file:px-3 file:py-1 file:text-sm`}
      />
    </Campo>
  );
}

export function Texto({
  id,
  label,
  valor,
  error,
  max,
  opcional,
  largo,
  ayuda,
}: {
  id: string;
  label: string;
  valor: string;
  error?: string;
  max: number;
  opcional?: boolean;
  largo?: boolean;
  ayuda?: string;
}) {
  const comun = {
    id,
    name: id,
    maxLength: max,
    defaultValue: valor,
    className: campo,
    "aria-invalid": error ? true : undefined,
  };
  return (
    <Campo
      id={id}
      label={label}
      error={error}
      opcional={opcional}
      ancho={largo}
      ayuda={ayuda}
    >
      {largo ? <textarea {...comun} rows={3} /> : <input {...comun} />}
    </Campo>
  );
}

// Crear (sin backlog) o editar (con backlog). El equipo no cambia después de crear.
export function ModalBacklog({
  backlog,
  opciones,
  hoy,
  exigeMotivo,
}: {
  backlog?: BacklogDetalle;
  opciones: OpcionesTrabajo;
  hoy: string;
  exigeMotivo?: boolean;
}) {
  const m = useModal();
  return (
    <>
      {backlog ? (
        <button type="button" onClick={m.abrir} className={boton.secundario}>
          {exigeMotivo ? "Corregir datos" : "Editar datos"}
        </button>
      ) : (
        <button type="button" onClick={m.abrir} className={boton.primario}>
          <IconoMas width={18} height={18} />
          Nuevo backlog
        </button>
      )}
      <Modal
        abierto={m.abierto}
        onCerrar={m.cerrar}
        titulo={backlog ? `Editar ${backlog.codigo}` : "Nuevo backlog"}
        descripcion={
          exigeMotivo
            ? "El trabajo ya se cerró: el cambio queda en auditoría con su motivo."
            : backlog
              ? undefined
              : "Lo que encontraste en el equipo. Queda pendiente hasta que se abra su OT."
        }
      >
        <FormBacklog
          key={m.vez}
          backlog={backlog}
          opciones={opciones}
          hoy={hoy}
          exigeMotivo={!!exigeMotivo}
          onCerrar={m.cerrar}
        />
      </Modal>
    </>
  );
}

function FormBacklog({
  backlog,
  opciones,
  hoy,
  exigeMotivo,
  onCerrar,
}: {
  backlog?: BacklogDetalle;
  opciones: OpcionesTrabajo;
  hoy: string;
  exigeMotivo: boolean;
  onCerrar: () => void;
}) {
  const [estado, enviar, pendiente] = useAccionModal<EstadoTrabajo>(
    backlog ? editarBacklogAction : crearBacklogAction,
    onCerrar,
  );
  const v = estado.valores ?? {
    equipoId: "",
    sistemaId: backlog?.sistemaId ?? "",
    componente: backlog?.componente ?? "",
    criticidad: backlog?.criticidad ?? "",
    descripcion: backlog?.descripcion ?? "",
    fechaObservacion: backlog?.fechaObservacion ?? hoy,
    fechaProgramada: backlog?.fechaProgramada ?? hoy,
    costoEstimado: backlog ? String(backlog.costoEstimado) : "",
    motivo: "",
  };
  const e = estado.errores ?? {};
  const sistemas = opciones.sistemas.filter(
    (s) => s.activo || s.id === v.sistemaId,
  );
  return (
    <form action={backlog ? enviar : conFotos(enviar)} noValidate>
      {backlog ? (
        <>
          <input type="hidden" name="id" value={backlog.id} />
          <input type="hidden" name="version" value={backlog.version} />
        </>
      ) : (
        <Clave />
      )}
      <div className="grid gap-5 p-6 sm:grid-cols-2">
        {!backlog && (
          <Campo id="equipoId" label="Equipo" error={e.equipoId}>
            <select
              id="equipoId"
              name="equipoId"
              defaultValue={v.equipoId}
              className={campo}
              aria-invalid={e.equipoId ? true : undefined}
            >
              <option value="">Elige…</option>
              {opciones.equipos
                .filter((q) => q.movilizado)
                .map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.codigo}
                  </option>
                ))}
            </select>
          </Campo>
        )}
        <Campo id="sistemaId" label="Sistema" opcional error={e.sistemaId}>
          <select
            id="sistemaId"
            name="sistemaId"
            defaultValue={v.sistemaId}
            className={campo}
          >
            <option value="">Sin sistema</option>
            {sistemas.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre}
                {s.activo ? "" : " (inactivo)"}
              </option>
            ))}
          </select>
        </Campo>
        <Texto
          id="componente"
          label="Componente"
          valor={v.componente}
          error={e.componente}
          max={120}
        />
        <Campo id="criticidad" label="Criticidad" error={e.criticidad}>
          <select
            id="criticidad"
            name="criticidad"
            defaultValue={v.criticidad}
            className={campo}
            aria-invalid={e.criticidad ? true : undefined}
          >
            <option value="">Elige…</option>
            {Object.entries(CRITICIDADES).map(([valor, texto]) => (
              <option key={valor} value={valor}>
                {texto}
              </option>
            ))}
          </select>
        </Campo>
        <Texto
          id="descripcion"
          label="Descripción"
          valor={v.descripcion}
          error={e.descripcion}
          max={1000}
          largo
        />
        <Campo
          id="fechaObservacion"
          label="Fecha de observación"
          error={e.fechaObservacion}
        >
          <input
            id="fechaObservacion"
            name="fechaObservacion"
            type="date"
            max={hoy}
            defaultValue={v.fechaObservacion}
            className={campo}
          />
        </Campo>
        <Campo
          id="fechaProgramada"
          label="Fecha programada"
          error={e.fechaProgramada}
        >
          <input
            id="fechaProgramada"
            name="fechaProgramada"
            type="date"
            defaultValue={v.fechaProgramada}
            className={campo}
            aria-invalid={e.fechaProgramada ? true : undefined}
          />
        </Campo>
        <Campo
          id="costoEstimado"
          label="Costo estimado"
          opcional
          error={e.costoEstimado}
        >
          <input
            id="costoEstimado"
            name="costoEstimado"
            inputMode="decimal"
            defaultValue={v.costoEstimado}
            placeholder="0"
            className={`${campo} tabular-nums`}
          />
        </Campo>
        {!backlog && <CampoFotos restantes={MAX_FOTOS} />}
        {exigeMotivo && (
          <Texto
            id="motivo"
            label="Motivo de la corrección"
            valor={v.motivo}
            error={e.motivo}
            max={500}
            largo
          />
        )}
      </div>
      <PieFormulario
        estado={estado}
        pendiente={pendiente}
        texto={backlog ? "Guardar cambios" : "Crear backlog"}
        onCerrar={onCerrar}
      />
    </form>
  );
}

export function ModalAbrirOt({
  backlogId,
  responsables,
}: {
  backlogId: string;
  responsables: { id: string; nombre: string }[];
}) {
  const m = useModal();
  return (
    <>
      <button type="button" onClick={m.abrir} className={boton.primario}>
        Abrir OT
      </button>
      <Modal
        abierto={m.abierto}
        onCerrar={m.cerrar}
        titulo="Abrir orden de trabajo"
        descripcion="El responsable llena el RM al terminar. El código OT se asigna solo."
      >
        <FormAbrirOt
          key={m.vez}
          backlogId={backlogId}
          responsables={responsables}
          onCerrar={m.cerrar}
        />
      </Modal>
    </>
  );
}

function FormAbrirOt({
  backlogId,
  responsables,
  onCerrar,
}: {
  backlogId: string;
  responsables: { id: string; nombre: string }[];
  onCerrar: () => void;
}) {
  const [estado, enviar, pendiente] = useAccionModal(abrirOtAction, onCerrar);
  const e = estado.errores ?? {};
  return (
    <form action={enviar} noValidate>
      <input type="hidden" name="backlogId" value={backlogId} />
      <Clave />
      <div className="p-6">
        <Campo
          id="responsableId"
          label="Responsable"
          error={e.responsableId}
          ayuda="Personal activo. Si no tiene cuenta, el cierre lo registra el supervisor."
        >
          <select
            id="responsableId"
            name="responsableId"
            defaultValue={estado.valores?.responsableId ?? ""}
            className={campo}
            aria-invalid={e.responsableId ? true : undefined}
          >
            <option value="">Elige…</option>
            {responsables.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
        </Campo>
      </div>
      <PieFormulario
        estado={estado}
        pendiente={pendiente}
        texto="Abrir OT"
        onCerrar={onCerrar}
      />
    </form>
  );
}

export function ModalRequisicion({ backlogId }: { backlogId: string }) {
  const m = useModal();
  return (
    <>
      <button
        type="button"
        onClick={m.abrir}
        className={`${enlace} text-primary`}
      >
        Pedir repuesto
      </button>
      <Modal
        abierto={m.abierto}
        onCerrar={m.cerrar}
        titulo="Nueva requisición"
        descripcion="Repuesto o material para esta OT. El código se asigna con el prefijo de tu empresa."
      >
        <FormRequisicion
          key={m.vez}
          backlogId={backlogId}
          onCerrar={m.cerrar}
        />
      </Modal>
    </>
  );
}

function FormRequisicion({
  backlogId,
  onCerrar,
}: {
  backlogId: string;
  onCerrar: () => void;
}) {
  const [estado, enviar, pendiente] = useAccionModal(
    requisicionAction,
    onCerrar,
  );
  const v = estado.valores ?? { descripcion: "", cantidad: "1", unidad: "" };
  const e = estado.errores ?? {};
  return (
    <form action={enviar} noValidate>
      <input type="hidden" name="backlogId" value={backlogId} />
      <Clave />
      <div className="grid gap-5 p-6 sm:grid-cols-2">
        <Texto
          id="descripcion"
          label="Repuesto o material"
          valor={v.descripcion}
          error={e.descripcion}
          max={300}
          largo
        />
        <Campo id="cantidad" label="Cantidad" error={e.cantidad}>
          <input
            id="cantidad"
            name="cantidad"
            inputMode="decimal"
            defaultValue={v.cantidad}
            className={`${campo} tabular-nums`}
            aria-invalid={e.cantidad ? true : undefined}
          />
        </Campo>
        <Texto
          id="unidad"
          label="Unidad"
          valor={v.unidad}
          error={e.unidad}
          max={20}
          opcional
          ayuda="Ej. und, litros, kg."
        />
      </div>
      <PieFormulario
        estado={estado}
        pendiente={pendiente}
        texto="Crear requisición"
        onCerrar={onCerrar}
      />
    </form>
  );
}

export function BotonRequisicion({
  id,
  codigo,
}: {
  id: string;
  codigo: string;
}) {
  const m = useModal();
  return (
    <>
      <button
        type="button"
        onClick={m.abrir}
        className={`${enlace} text-primary`}
      >
        Actualizar
      </button>
      <Modal
        abierto={m.abierto}
        onCerrar={m.cerrar}
        titulo={`Requisición ${codigo}`}
        descripcion="Marca si ya llegó o si ya no hace falta."
      >
        <FormEstadoRq key={m.vez} id={id} onCerrar={m.cerrar} />
      </Modal>
    </>
  );
}

function FormEstadoRq({ id, onCerrar }: { id: string; onCerrar: () => void }) {
  const [estado, enviar, pendiente] = useAccionModal(
    estadoRequisicionAction,
    onCerrar,
  );
  return (
    <form action={enviar}>
      <input type="hidden" name="id" value={id} />
      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border px-6 py-4">
        {estado.error && (
          <p className="mr-auto text-sm text-bad">{estado.error}</p>
        )}
        <button
          type="submit"
          name="estado"
          value="ANULADA"
          disabled={pendiente}
          className={boton.secundario}
        >
          Anular
        </button>
        <button
          type="submit"
          name="estado"
          value="ENTREGADA"
          disabled={pendiente}
          className={boton.primario}
        >
          Marcar entregada
        </button>
      </div>
    </form>
  );
}

export function AvisoFirma() {
  return (
    <div className="mx-6 mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-warn/30 bg-warn-soft px-4 py-3 text-sm">
      <p>Para firmar necesitas registrar tu firma una vez.</p>
      <ModalFirma />
    </div>
  );
}

export function ModalCerrar({
  backlog,
  hoy,
  tieneFirma,
}: {
  backlog: BacklogDetalle;
  hoy: string;
  tieneFirma: boolean;
}) {
  const m = useModal();
  return (
    <>
      <button type="button" onClick={m.abrir} className={boton.primario}>
        Cerrar con RM
      </button>
      <Modal
        abierto={m.abierto}
        onCerrar={m.cerrar}
        titulo={`Reporte de mantenimiento · ${backlog.ot?.codigo ?? ""}`}
        descripcion="Al cerrar se firma con tu firma precargada y el trabajo pasa a validación."
      >
        <FormCerrar
          key={m.vez}
          backlog={backlog}
          hoy={hoy}
          tieneFirma={tieneFirma}
          onCerrar={m.cerrar}
        />
      </Modal>
    </>
  );
}

function FormCerrar({
  backlog,
  hoy,
  tieneFirma,
  onCerrar,
}: {
  backlog: BacklogDetalle;
  hoy: string;
  tieneFirma: boolean;
  onCerrar: () => void;
}) {
  const [estado, enviar, pendiente] = useAccionModal(
    cerrarReporteAction,
    onCerrar,
  );
  const v = estado.valores ?? {
    fecha: hoy,
    horometro: backlog.rm ? String(backlog.rm.horometro) : "",
    notas: backlog.rm?.notas ?? "",
  };
  const e = estado.errores ?? {};
  const restantes =
    MAX_FOTOS - backlog.fotos.filter((f) => f.rol === "DESPUES").length;
  return (
    <>
      {/* Fuera del form: el modal de firma tiene su propio formulario. */}
      {!tieneFirma && <AvisoFirma />}
      <form action={conFotos(enviar)} noValidate>
        <input type="hidden" name="backlogId" value={backlog.id} />
        <Clave />
        <div className="grid gap-5 p-6 sm:grid-cols-2">
          <Campo id="fecha" label="Fecha de cierre" error={e.fecha}>
            <input
              id="fecha"
              name="fecha"
              type="date"
              min={backlog.fechaObservacion}
              max={hoy}
              defaultValue={v.fecha}
              className={campo}
            />
          </Campo>
          <Campo
            id="horometro"
            label="Horómetro"
            error={e.horometro}
            ayuda="Si es mayor que el actual, actualiza el del equipo."
          >
            <input
              id="horometro"
              name="horometro"
              inputMode="decimal"
              defaultValue={v.horometro}
              className={`${campo} tabular-nums`}
              aria-invalid={e.horometro ? true : undefined}
            />
          </Campo>
          <Texto
            id="notas"
            label="Trabajo realizado"
            valor={v.notas}
            error={e.notas}
            max={1000}
            opcional
            largo
          />
          {restantes > 0 && <CampoFotos restantes={restantes} />}
        </div>
        <PieFormulario
          estado={estado}
          pendiente={pendiente}
          texto="Cerrar y firmar"
          onCerrar={onCerrar}
        />
      </form>
    </>
  );
}

export function ModalValidar({
  backlogId,
  tieneFirma,
}: {
  backlogId: string;
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
        titulo="Validar trabajo"
        descripcion="Aprueba con tu firma o devuélvelo al responsable con lo que falta."
      >
        <FormValidar
          key={m.vez}
          backlogId={backlogId}
          tieneFirma={tieneFirma}
          onCerrar={m.cerrar}
        />
      </Modal>
    </>
  );
}

function FormValidar({
  backlogId,
  tieneFirma,
  onCerrar,
}: {
  backlogId: string;
  tieneFirma: boolean;
  onCerrar: () => void;
}) {
  const [estado, enviar, pendiente] = useAccionModal(validarAction, onCerrar);
  const e = estado.errores ?? {};
  return (
    <>
      {!tieneFirma && <AvisoFirma />}
      <form action={enviar} noValidate>
        <input type="hidden" name="backlogId" value={backlogId} />
        <Clave />
        <div className="p-6">
          <Texto
            id="nota"
            label="Observación"
            valor={estado.valores?.nota ?? ""}
            error={e.nota}
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

export function ModalReabrir({ backlogId }: { backlogId: string }) {
  const m = useModal();
  return (
    <>
      <button type="button" onClick={m.abrir} className={boton.secundario}>
        Reabrir
      </button>
      <Modal
        abierto={m.abierto}
        onCerrar={m.cerrar}
        titulo="Reabrir trabajo"
        descripcion="Vuelve a «En proceso». Las firmas actuales dejan de valer y quedan en el historial."
      >
        <FormReabrir key={m.vez} backlogId={backlogId} onCerrar={m.cerrar} />
      </Modal>
    </>
  );
}

function FormReabrir({
  backlogId,
  onCerrar,
}: {
  backlogId: string;
  onCerrar: () => void;
}) {
  const [estado, enviar, pendiente] = useAccionModal(reabrirAction, onCerrar);
  return (
    <form action={enviar} noValidate>
      <input type="hidden" name="backlogId" value={backlogId} />
      <Clave />
      <div className="p-6">
        <Texto
          id="nota"
          label="Motivo"
          valor={estado.valores?.nota ?? ""}
          error={estado.errores?.nota}
          max={500}
          largo
        />
      </div>
      <PieFormulario
        estado={estado}
        pendiente={pendiente}
        texto="Reabrir"
        peligro
        onCerrar={onCerrar}
      />
    </form>
  );
}

"use client";

import type { EquipoDetalle } from "@/modules/equipos/application/repositorios";
import {
  ESTADOS_MOVILIZACION,
  ESTADOS_OPERATIVOS,
} from "@/modules/equipos/domain/equipo";
import { boton, campo, etiqueta } from "@/shared/ui/estilos";
import {
  PieFormulario,
  useAccionModal,
  useModal,
} from "@/shared/ui/formulario-modal";
import { IconoMas } from "@/shared/ui/iconos";
import { Modal } from "@/shared/ui/modal";
import {
  crearEquipoAction,
  editarEquipoAction,
  lecturaAction,
  movilizacionAction,
} from "./actions";

export type Opcion = { id: string; nombre: string; activo: boolean };

const enlace = "text-sm font-semibold hover:underline";

function Campo({
  id,
  label,
  error,
  ayuda,
  opcional,
  ancho,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  ayuda?: string;
  opcional?: boolean;
  ancho?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={ancho ? "sm:col-span-2" : ""}>
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

// Las inactivas no se ofrecen, salvo la que ya tiene el equipo: así editar no la cambia sola.
const opciones = (lista: Opcion[], actual: string) =>
  lista
    .filter((o) => o.activo || o.id === actual)
    .map((o) => (
      <option key={o.id} value={o.id}>
        {o.nombre}
        {o.activo ? "" : " (inactiva)"}
      </option>
    ));

// Crear (sin equipo) o editar (con equipo). El horómetro solo se pide al crear.
export function ModalEquipo({
  equipo,
  categorias,
  ubicaciones,
}: {
  equipo?: EquipoDetalle;
  categorias: Opcion[];
  ubicaciones: Opcion[];
}) {
  const m = useModal();
  return (
    <>
      {equipo ? (
        <button type="button" onClick={m.abrir} className={boton.secundario}>
          Editar datos
        </button>
      ) : (
        <button type="button" onClick={m.abrir} className={boton.primario}>
          <IconoMas width={18} height={18} />
          Nuevo equipo
        </button>
      )}
      <Modal
        abierto={m.abierto}
        onCerrar={m.cerrar}
        titulo={equipo ? `Editar ${equipo.codigo}` : "Nuevo equipo"}
        descripcion={
          equipo
            ? "El horómetro no se cambia aquí: se registra con una lectura."
            : "El código no se repite en tu flota. Se guarda en mayúsculas y sin espacios."
        }
      >
        <FormEquipo
          key={m.vez}
          equipo={equipo}
          categorias={categorias}
          ubicaciones={ubicaciones}
          onCerrar={m.cerrar}
        />
      </Modal>
    </>
  );
}

function FormEquipo({
  equipo,
  categorias,
  ubicaciones,
  onCerrar,
}: {
  equipo?: EquipoDetalle;
  categorias: Opcion[];
  ubicaciones: Opcion[];
  onCerrar: () => void;
}) {
  const [estado, enviar, pendiente] = useAccionModal(
    equipo ? editarEquipoAction : crearEquipoAction,
    onCerrar,
  );
  const v = estado.valores ?? {
    codigo: equipo?.codigo ?? "",
    categoriaId: equipo?.categoriaId ?? "",
    ubicacionId: equipo?.ubicacionId ?? "",
    marca: equipo?.marca ?? "",
    modelo: equipo?.modelo ?? "",
    numeroSerie: equipo?.numeroSerie ?? "",
    idExterno: equipo?.idExterno ?? "",
    estadoOperativo: equipo?.estadoOperativo ?? "OPERATIVO",
    estadoMovilizacion: equipo?.estadoMovilizacion ?? "MOVILIZADO",
    requiereEngrase: equipo ? (equipo.requiereEngrase ? "on" : "") : "on",
    horometroInicial: "0",
  };
  const e = estado.errores ?? {};
  const inv = (k: string) => (e[k] ? true : undefined);
  const texto = (id: string, label: string, max = 80) => (
    <Campo id={id} label={label} opcional error={e[id]}>
      <input
        id={id}
        name={id}
        maxLength={max}
        defaultValue={v[id]}
        className={campo}
        aria-invalid={inv(id)}
      />
    </Campo>
  );
  return (
    <form action={enviar} noValidate>
      {equipo && (
        <>
          <input type="hidden" name="id" value={equipo.id} />
          <input type="hidden" name="version" value={equipo.version} />
        </>
      )}
      <div className="grid gap-5 p-6 sm:grid-cols-2">
        <Campo id="codigo" label="Código" error={e.codigo}>
          <input
            id="codigo"
            name="codigo"
            maxLength={40}
            defaultValue={v.codigo}
            placeholder="EQ-001"
            className={`${campo} font-mono uppercase`}
            aria-invalid={inv("codigo")}
          />
        </Campo>
        <Campo id="categoriaId" label="Categoría" error={e.categoriaId}>
          <select
            id="categoriaId"
            name="categoriaId"
            defaultValue={v.categoriaId}
            className={campo}
            aria-invalid={inv("categoriaId")}
          >
            <option value="">Elige…</option>
            {opciones(categorias, v.categoriaId)}
          </select>
        </Campo>
        {texto("marca", "Marca")}
        {texto("modelo", "Modelo")}
        {texto("numeroSerie", "N.º de serie")}
        <Campo
          id="ubicacionId"
          label="Ubicación"
          opcional
          error={e.ubicacionId}
        >
          <select
            id="ubicacionId"
            name="ubicacionId"
            defaultValue={v.ubicacionId}
            className={campo}
          >
            <option value="">Sin ubicación</option>
            {opciones(ubicaciones, v.ubicacionId)}
          </select>
        </Campo>
        <Campo
          id="estadoOperativo"
          label="Estado operativo"
          error={e.estadoOperativo}
        >
          <select
            id="estadoOperativo"
            name="estadoOperativo"
            defaultValue={v.estadoOperativo}
            className={campo}
          >
            {Object.entries(ESTADOS_OPERATIVOS).map(([valor, texto]) => (
              <option key={valor} value={valor}>
                {texto}
              </option>
            ))}
          </select>
        </Campo>
        <Campo
          id="estadoMovilizacion"
          label="Movilización"
          error={e.estadoMovilizacion}
          ayuda="Para darlo de baja usa «Desmovilizar» en la ficha."
        >
          <select
            id="estadoMovilizacion"
            name="estadoMovilizacion"
            defaultValue={v.estadoMovilizacion}
            className={campo}
          >
            <option value="MOVILIZADO">
              {ESTADOS_MOVILIZACION.MOVILIZADO}
            </option>
            <option value="PENDIENTE">{ESTADOS_MOVILIZACION.PENDIENTE}</option>
          </select>
        </Campo>
        {texto("idExterno", "Código en otro sistema")}
        {!equipo && (
          <Campo
            id="horometroInicial"
            label="Horómetro inicial"
            error={e.horometroInicial}
            ayuda="Queda como primera lectura del historial."
          >
            <input
              id="horometroInicial"
              name="horometroInicial"
              inputMode="decimal"
              defaultValue={v.horometroInicial}
              className={`${campo} tabular-nums`}
              aria-invalid={inv("horometroInicial")}
            />
          </Campo>
        )}
        <label className="flex items-center gap-3 text-sm sm:col-span-2">
          <input
            type="checkbox"
            name="requiereEngrase"
            defaultChecked={v.requiereEngrase === "on"}
            className="size-4 accent-[var(--primary)]"
          />
          Requiere engrase
          <span className="text-muted">
            (si no, no sale en el listado de engrase)
          </span>
        </label>
        {/* Sin marcar, el navegador no envía nada: este valor vacío lo representa. */}
        <input type="hidden" name="requiereEngrase" value="" />
      </div>
      <PieFormulario
        estado={estado}
        pendiente={pendiente}
        texto={equipo ? "Guardar cambios" : "Crear equipo"}
        onCerrar={onCerrar}
      />
    </form>
  );
}

// Lectura normal (sube o igual) o corrección a la baja con motivo.
export function ModalLectura({
  equipoId,
  actual,
  unidad,
  hoy,
  correccion,
}: {
  equipoId: string;
  actual: string;
  unidad: string;
  hoy: string;
  correccion?: boolean;
}) {
  const m = useModal();
  return (
    <>
      {correccion ? (
        <button
          type="button"
          onClick={m.abrir}
          className={`${enlace} text-bad`}
        >
          Corregir a la baja
        </button>
      ) : (
        <button type="button" onClick={m.abrir} className={boton.primario}>
          <IconoMas width={18} height={18} />
          Registrar lectura
        </button>
      )}
      <Modal
        abierto={m.abierto}
        onCerrar={m.cerrar}
        titulo={correccion ? "Corregir horómetro" : "Registrar lectura"}
        descripcion={
          correccion
            ? `Actual: ${actual} ${unidad}. Úsala solo si el horómetro está mal; queda registrada con tu motivo. Verifícalo en físico.`
            : `Actual: ${actual} ${unidad}. La lectura no puede ser menor.`
        }
      >
        <FormLectura
          key={m.vez}
          equipoId={equipoId}
          unidad={unidad}
          hoy={hoy}
          correccion={!!correccion}
          onCerrar={m.cerrar}
        />
      </Modal>
    </>
  );
}

function FormLectura({
  equipoId,
  unidad,
  hoy,
  correccion,
  onCerrar,
}: {
  equipoId: string;
  unidad: string;
  hoy: string;
  correccion: boolean;
  onCerrar: () => void;
}) {
  const [estado, enviar, pendiente] = useAccionModal(lecturaAction, onCerrar);
  const v = estado.valores ?? { valor: "", fecha: hoy, motivo: "" };
  const e = estado.errores ?? {};
  return (
    <form action={enviar} noValidate>
      <input type="hidden" name="equipoId" value={equipoId} />
      <input type="hidden" name="esCorreccion" value={String(correccion)} />
      <div className="grid gap-5 p-6 sm:grid-cols-2">
        <Campo id="valor" label={`Lectura (${unidad})`} error={e.valor}>
          <input
            id="valor"
            name="valor"
            inputMode="decimal"
            defaultValue={v.valor}
            className={`${campo} tabular-nums`}
            aria-invalid={e.valor ? true : undefined}
          />
        </Campo>
        <Campo id="fecha" label="Fecha" error={e.fecha}>
          <input
            id="fecha"
            name="fecha"
            type="date"
            max={hoy}
            defaultValue={v.fecha}
            className={`${campo} tabular-nums`}
            aria-invalid={e.fecha ? true : undefined}
          />
        </Campo>
        {correccion ? (
          <Campo id="motivo" label="Motivo" error={e.motivo} ancho>
            <textarea
              id="motivo"
              name="motivo"
              rows={3}
              maxLength={300}
              defaultValue={v.motivo}
              placeholder="Ej. se tecleó un cero de más en la lectura anterior."
              className={campo}
              aria-invalid={e.motivo ? true : undefined}
            />
          </Campo>
        ) : (
          <input type="hidden" name="motivo" value="" />
        )}
      </div>
      <PieFormulario
        estado={estado}
        pendiente={pendiente}
        texto={correccion ? "Registrar corrección" : "Registrar lectura"}
        peligro={correccion}
        onCerrar={onCerrar}
      />
    </form>
  );
}

// Desmovilizar (baja, pasa a inactivos) o volver a movilizar. Siempre con confirmación.
export function BotonMovilizacion({
  equipoId,
  codigo,
  desmovilizado,
}: {
  equipoId: string;
  codigo: string;
  desmovilizado: boolean;
}) {
  const m = useModal();
  return (
    <>
      <button
        type="button"
        onClick={m.abrir}
        className={
          desmovilizado ? boton.primario : `${boton.secundario} text-bad`
        }
      >
        {desmovilizado ? "Volver a movilizar" : "Desmovilizar"}
      </button>
      <Modal
        abierto={m.abierto}
        onCerrar={m.cerrar}
        titulo={desmovilizado ? "Volver a movilizar" : "Desmovilizar equipo"}
        descripcion={
          desmovilizado
            ? "Vuelve a la flota activa con su historial."
            : "Sale de la flota activa y pasa a inactivos. No se borra: conserva su historial."
        }
      >
        <FormMovilizacion
          key={m.vez}
          equipoId={equipoId}
          codigo={codigo}
          desmovilizado={desmovilizado}
          onCerrar={m.cerrar}
        />
      </Modal>
    </>
  );
}

function FormMovilizacion({
  equipoId,
  codigo,
  desmovilizado,
  onCerrar,
}: {
  equipoId: string;
  codigo: string;
  desmovilizado: boolean;
  onCerrar: () => void;
}) {
  const [estado, enviar, pendiente] = useAccionModal(
    movilizacionAction,
    onCerrar,
  );
  return (
    <form action={enviar}>
      <input type="hidden" name="id" value={equipoId} />
      <input
        type="hidden"
        name="estado"
        value={desmovilizado ? "MOVILIZADO" : "DESMOVILIZADO"}
      />
      <p className="p-6 text-sm">
        ¿Seguro que quieres{" "}
        {desmovilizado ? "volver a movilizar" : "desmovilizar"}{" "}
        <strong className="font-mono font-semibold">{codigo}</strong>?
      </p>
      <PieFormulario
        estado={estado}
        pendiente={pendiente}
        texto={desmovilizado ? "Sí, movilizar" : "Sí, desmovilizar"}
        peligro={!desmovilizado}
        onCerrar={onCerrar}
      />
    </form>
  );
}

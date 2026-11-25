"use client";

import { useState } from "react";
import { DESTINOS } from "@/modules/neumaticos/application/esquemas";
import type {
  FilaNeumatico,
  Posicion,
  UmbralGuardado,
} from "@/modules/neumaticos/application/repositorios";
import { mm } from "@/modules/neumaticos/ui/formato";
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
  desmontarAction,
  guardarNeumaticoAction,
  medirAction,
  montarAction,
  posicionesAction,
  recaparAction,
  rotarAction,
  umbralesAction,
  type EstadoNeumaticoForm,
} from "./actions";

type Opcion = { id: string; nombre: string };
type Accion = (
  p: EstadoNeumaticoForm,
  fd: FormData,
) => Promise<EstadoNeumaticoForm>;

// Botón + modal + formulario: el esqueleto de todos los formularios de neumáticos.
function ConModal({
  boton: texto,
  estilo = boton.secundario,
  titulo,
  descripcion,
  children,
}: {
  boton: string;
  estilo?: string;
  titulo: string;
  descripcion?: string;
  children: (cerrar: () => void) => React.ReactNode;
}) {
  const m = useModal();
  return (
    <>
      <button type="button" onClick={m.abrir} className={estilo}>
        {texto}
      </button>
      <Modal
        abierto={m.abierto}
        onCerrar={m.cerrar}
        titulo={titulo}
        descripcion={descripcion}
      >
        <div key={m.vez}>{children(m.cerrar)}</div>
      </Modal>
    </>
  );
}

function Formulario({
  accion,
  texto,
  onCerrar,
  conClave = true,
  children,
}: {
  accion: Accion;
  texto: string;
  onCerrar: () => void;
  conClave?: boolean;
  children: (estado: EstadoNeumaticoForm) => React.ReactNode;
}) {
  const [estado, enviar, pendiente] = useAccionModal(accion, onCerrar);
  return (
    <form action={enviar} noValidate>
      {conClave && <Clave />}
      <div className="grid gap-5 p-6 sm:grid-cols-2">{children(estado)}</div>
      <PieFormulario
        estado={estado}
        pendiente={pendiente}
        texto={texto}
        onCerrar={onCerrar}
      />
    </form>
  );
}

function Entrada({
  id,
  label,
  estado,
  valor = "",
  opcional,
  ayuda,
  tipo = "text",
  max,
}: {
  id: string;
  label: string;
  estado: EstadoNeumaticoForm;
  valor?: string;
  opcional?: boolean;
  ayuda?: string;
  tipo?: "text" | "date" | "decimal";
  max?: string;
}) {
  return (
    <Campo
      id={id}
      label={label}
      opcional={opcional}
      ayuda={ayuda}
      error={estado.errores?.[id]}
    >
      <input
        id={id}
        name={id}
        type={tipo === "date" ? "date" : "text"}
        inputMode={tipo === "decimal" ? "decimal" : undefined}
        max={max}
        defaultValue={estado.valores?.[id] ?? valor}
        className={campo}
      />
    </Campo>
  );
}

function Selector({
  id,
  label,
  estado,
  opciones,
  valor = "",
}: {
  id: string;
  label: string;
  estado: EstadoNeumaticoForm;
  opciones: Opcion[];
  valor?: string;
}) {
  return (
    <Campo id={id} label={label} error={estado.errores?.[id]}>
      <select
        id={id}
        name={id}
        defaultValue={estado.valores?.[id] ?? valor}
        className={campo}
      >
        <option value="">Elige…</option>
        {opciones.map((o) => (
          <option key={o.id} value={o.id}>
            {o.nombre}
          </option>
        ))}
      </select>
    </Campo>
  );
}

const FechaYHorometro = ({
  estado,
  hoy,
  horometro,
}: {
  estado: EstadoNeumaticoForm;
  hoy: string;
  horometro: number;
}) => (
  <>
    <Entrada
      id="fecha"
      label="Fecha"
      estado={estado}
      valor={hoy}
      tipo="date"
      max={hoy}
    />
    <Entrada
      id="horometro"
      label="Horómetro del equipo"
      estado={estado}
      valor={String(horometro)}
      tipo="decimal"
    />
  </>
);

// ---------- Cubierta ----------

export function ModalCubierta({ fila }: { fila?: FilaNeumatico }) {
  return (
    <ConModal
      boton={fila ? "Editar" : "Nueva cubierta"}
      estilo={fila ? boton.secundario : boton.primario}
      titulo={fila ? `Editar ${fila.codigo}` : "Nueva cubierta"}
      descripcion="Se carga sin historial previo. El costo es opcional (en soles)."
    >
      {(cerrar) => (
        <Formulario
          accion={guardarNeumaticoAction}
          texto="Guardar"
          onCerrar={cerrar}
        >
          {(e) => (
            <>
              <input type="hidden" name="id" value={fila?.id ?? ""} />
              <Entrada
                id="codigo"
                label="Código"
                estado={e}
                valor={fila?.codigo}
              />
              <Entrada
                id="marca"
                label="Marca"
                estado={e}
                valor={fila?.marca}
              />
              <Entrada
                id="modelo"
                label="Modelo"
                estado={e}
                valor={fila?.modelo ?? ""}
                opcional
              />
              <Entrada
                id="medida"
                label="Medida"
                estado={e}
                valor={fila?.medida}
                ayuda="Ej. 12R22.5"
              />
              <Entrada
                id="cocadaNueva"
                label="Cocada nueva (mm)"
                estado={e}
                valor={fila ? String(fila.cocadaNueva) : ""}
                tipo="decimal"
              />
              <Entrada
                id="costo"
                label="Costo (S/)"
                estado={e}
                valor={fila?.costo?.toString() ?? ""}
                tipo="decimal"
                opcional
              />
            </>
          )}
        </Formulario>
      )}
    </ConModal>
  );
}

// ---------- Umbrales ----------

export function ModalUmbrales({
  umbrales,
  categorias,
  equipos,
}: {
  umbrales: UmbralGuardado[];
  categorias: Opcion[];
  equipos: { id: string; codigo: string }[];
}) {
  return (
    <ConModal
      boton="Umbrales"
      titulo="Umbrales de neumáticos"
      descripcion="Por categoría. Un equipo con umbrales propios usa esos en lugar de los de su categoría."
    >
      {(cerrar) => (
        <FormUmbrales
          umbrales={umbrales}
          categorias={categorias}
          equipos={equipos}
          onCerrar={cerrar}
        />
      )}
    </ConModal>
  );
}

function FormUmbrales({
  umbrales,
  categorias,
  equipos,
  onCerrar,
}: {
  umbrales: UmbralGuardado[];
  categorias: Opcion[];
  equipos: { id: string; codigo: string }[];
  onCerrar: () => void;
}) {
  const [destino, setDestino] = useState(
    categorias[0] ? `categoria:${categorias[0].id}` : "",
  );
  const [tipo, id] = destino.split(":");
  const actual = umbrales.find((u) =>
    tipo === "categoria" ? u.categoriaId === id : u.equipoId === id,
  );
  const v = (n: number | undefined) => (n === undefined ? "" : String(n));
  return (
    <Formulario
      accion={umbralesAction}
      texto="Guardar umbrales"
      onCerrar={onCerrar}
      conClave={false}
    >
      {(e) => (
        <>
          <div className="sm:col-span-2">
            <Campo id="destino" label="Aplicar a" error={e.errores?.destinoId}>
              <select
                id="destino"
                name="destino"
                value={destino}
                onChange={(x) => setDestino(x.target.value)}
                className={campo}
              >
                <optgroup label="Categorías">
                  {categorias.map((c) => (
                    <option key={c.id} value={`categoria:${c.id}`}>
                      {c.nombre}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Equipos (valores propios)">
                  {equipos.map((q) => (
                    <option key={q.id} value={`equipo:${q.id}`}>
                      {q.codigo}
                    </option>
                  ))}
                </optgroup>
              </select>
            </Campo>
          </div>
          {/* key: al cambiar de destino se cargan sus valores guardados. */}
          <div key={destino} className="contents">
            <Entrada
              id="cocadaMinima"
              label="Cocada mínima (mm): cambiar"
              estado={e}
              valor={v(actual?.cocadaMinima)}
              tipo="decimal"
            />
            <Entrada
              id="cocadaAlerta"
              label="Cocada de alerta (mm)"
              estado={e}
              valor={v(actual?.cocadaAlerta)}
              tipo="decimal"
            />
            <Entrada
              id="diasSinMedir"
              label="Medir cada (días)"
              estado={e}
              valor={v(actual?.diasSinMedir)}
            />
            <Entrada
              id="diferenciaMaxima"
              label="Desgaste irregular desde (mm)"
              estado={e}
              valor={v(actual?.diferenciaMaxima)}
              tipo="decimal"
              ayuda="Diferencia entre el punto más alto y el más bajo."
            />
          </div>
          {actual && (
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input
                type="checkbox"
                name="quitar"
                className="size-4 accent-[var(--primary)]"
              />
              {tipo === "equipo"
                ? "Quitar los umbrales propios (vuelve a los de su categoría)"
                : "Quitar los umbrales de esta categoría"}
            </label>
          )}
        </>
      )}
    </Formulario>
  );
}

// ---------- Posiciones ----------

export function ModalPosiciones({
  equipoId,
  posiciones,
  plantillas,
}: {
  equipoId: string;
  posiciones: Posicion[];
  plantillas: (Opcion & { layout: string })[];
}) {
  const actual = [...new Set(posiciones.map((p) => p.eje))]
    .sort((a, b) => a - b)
    .map((eje) =>
      posiciones
        .filter((p) => p.eje === eje)
        .map((p) => p.codigo)
        .join(" | "),
    )
    .join("\n");
  return (
    <ConModal
      boton="Posiciones"
      titulo="Posiciones del equipo"
      descripcion="Una línea por eje, posiciones separadas por |. Una posición con cubierta montada no se puede quitar."
    >
      {(cerrar) => (
        <FormPosiciones
          equipoId={equipoId}
          actual={actual}
          plantillas={plantillas}
          onCerrar={cerrar}
        />
      )}
    </ConModal>
  );
}

function FormPosiciones({
  equipoId,
  actual,
  plantillas,
  onCerrar,
}: {
  equipoId: string;
  actual: string;
  plantillas: (Opcion & { layout: string })[];
  onCerrar: () => void;
}) {
  const [texto, setTexto] = useState(actual);
  return (
    <Formulario
      accion={posicionesAction}
      texto="Guardar posiciones"
      onCerrar={onCerrar}
      conClave={false}
    >
      {(e) => (
        <>
          <input type="hidden" name="equipoId" value={equipoId} />
          {plantillas.length > 0 && (
            <div className="sm:col-span-2">
              <Campo id="plantilla" label="Partir de una plantilla" opcional>
                <select
                  id="plantilla"
                  defaultValue=""
                  onChange={(x) => {
                    const p = plantillas.find((q) => q.id === x.target.value);
                    if (p) setTexto(p.layout);
                  }}
                  className={campo}
                >
                  <option value="">Elige…</option>
                  {plantillas.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre}
                    </option>
                  ))}
                </select>
              </Campo>
            </div>
          )}
          <div className="sm:col-span-2">
            <Campo
              id="layout"
              label="Posiciones"
              error={e.errores?.layout}
              ayuda="Ej. DEL-I | DEL-D"
            >
              <textarea
                id="layout"
                name="layout"
                rows={5}
                maxLength={500}
                value={texto}
                onChange={(x) => setTexto(x.target.value.toUpperCase())}
                className={`${campo} font-mono`}
              />
            </Campo>
          </div>
        </>
      )}
    </Formulario>
  );
}

// ---------- Montar ----------

export function ModalMontar({
  posicion,
  stock,
  hoy,
  horometro,
}: {
  posicion: Posicion;
  stock: FilaNeumatico[];
  hoy: string;
  horometro: number;
}) {
  return (
    <ConModal
      boton="Montar"
      estilo={boton.primario}
      titulo={`Montar en ${posicion.codigo}`}
    >
      {(cerrar) =>
        stock.length === 0 ? (
          <p className="p-6 text-sm text-muted">
            No hay cubiertas en stock. Carga una desde Neumáticos.
          </p>
        ) : (
          <FormMontar
            posicion={posicion}
            stock={stock}
            hoy={hoy}
            horometro={horometro}
            onCerrar={cerrar}
          />
        )
      }
    </ConModal>
  );
}

function FormMontar({
  posicion,
  stock,
  hoy,
  horometro,
  onCerrar,
}: {
  posicion: Posicion;
  stock: FilaNeumatico[];
  hoy: string;
  horometro: number;
  onCerrar: () => void;
}) {
  const [elegida, setElegida] = useState(stock[0].id);
  const cubierta = stock.find((s) => s.id === elegida);
  return (
    <Formulario accion={montarAction} texto="Montar" onCerrar={onCerrar}>
      {(e) => (
        <>
          <input type="hidden" name="posicionId" value={posicion.id} />
          <div className="sm:col-span-2">
            <Campo
              id="neumaticoId"
              label="Cubierta"
              error={e.errores?.neumaticoId}
            >
              <select
                id="neumaticoId"
                name="neumaticoId"
                value={elegida}
                onChange={(x) => setElegida(x.target.value)}
                className={campo}
              >
                {stock.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.codigo} · {s.marca} {s.medida} · {mm(s.cocadaActual)}
                  </option>
                ))}
              </select>
            </Campo>
          </div>
          <FechaYHorometro estado={e} hoy={hoy} horometro={horometro} />
          <div key={elegida}>
            <Entrada
              id="cocada"
              label="Cocada al montar (mm)"
              estado={e}
              valor={String(cubierta?.cocadaActual ?? "")}
              tipo="decimal"
            />
          </div>
        </>
      )}
    </Formulario>
  );
}

// ---------- Desmontar ----------

export function ModalDesmontar({
  fila,
  motivos,
  hoy,
}: {
  fila: FilaNeumatico;
  motivos: Opcion[];
  hoy: string;
}) {
  return (
    <ConModal
      boton="Desmontar"
      titulo={`Desmontar ${fila.codigo}`}
      descripcion="Las horas trabajadas se suman a la cubierta."
    >
      {(cerrar) =>
        motivos.length === 0 ? (
          <p className="p-6 text-sm text-muted">
            Primero crea los motivos en Catálogos → Retiro de neumático.
          </p>
        ) : (
          <Formulario
            accion={desmontarAction}
            texto="Desmontar"
            onCerrar={cerrar}
          >
            {(e) => (
              <>
                <input type="hidden" name="neumaticoId" value={fila.id} />
                <FechaYHorometro
                  estado={e}
                  hoy={hoy}
                  horometro={fila.montaje?.equipoHorometro ?? 0}
                />
                <Selector
                  id="motivoId"
                  label="Motivo"
                  estado={e}
                  opciones={motivos}
                />
                <Selector
                  id="destino"
                  label="Destino"
                  estado={e}
                  valor="STOCK"
                  opciones={Object.entries(DESTINOS).map(([id, nombre]) => ({
                    id,
                    nombre,
                  }))}
                />
              </>
            )}
          </Formulario>
        )
      }
    </ConModal>
  );
}

// ---------- Rotar ----------

export function ModalRotar({
  origen,
  posiciones,
  ocupantes,
  hoy,
  horometro,
}: {
  origen: Posicion;
  posiciones: Posicion[];
  ocupantes: Record<string, string>;
  hoy: string;
  horometro: number;
}) {
  const otras = posiciones
    .filter((p) => p.id !== origen.id)
    .map((p) => ({
      id: p.id,
      nombre: ocupantes[p.id]
        ? `${p.codigo} (intercambia con ${ocupantes[p.id]})`
        : `${p.codigo} (libre)`,
    }));
  return (
    <ConModal
      boton="Rotar"
      titulo={`Rotar desde ${origen.codigo}`}
      descripcion="Si el destino tiene cubierta, se intercambian las dos."
    >
      {(cerrar) => (
        <Formulario accion={rotarAction} texto="Rotar" onCerrar={cerrar}>
          {(e) => (
            <>
              <input type="hidden" name="origenId" value={origen.id} />
              <div className="sm:col-span-2">
                <Selector
                  id="destinoId"
                  label="Posición de destino"
                  estado={e}
                  opciones={otras}
                />
              </div>
              <FechaYHorometro estado={e} hoy={hoy} horometro={horometro} />
            </>
          )}
        </Formulario>
      )}
    </ConModal>
  );
}

// ---------- Recapar ----------

export function ModalRecapar({ fila }: { fila: FilaNeumatico }) {
  return (
    <ConModal
      boton="Recapar"
      titulo={`Recapar ${fila.codigo}`}
      descripcion="Vuelve a stock con un recapado más."
    >
      {(cerrar) => (
        <Formulario
          accion={recaparAction}
          texto="Registrar recapado"
          onCerrar={cerrar}
        >
          {(e) => (
            <>
              <input type="hidden" name="neumaticoId" value={fila.id} />
              <Entrada
                id="cocadaNueva"
                label="Cocada nueva (mm)"
                estado={e}
                valor={String(fila.cocadaNueva)}
                tipo="decimal"
              />
              <Entrada
                id="costo"
                label="Costo del recapado (S/)"
                estado={e}
                tipo="decimal"
                opcional
              />
            </>
          )}
        </Formulario>
      )}
    </ConModal>
  );
}

// ---------- Medir ----------

export function ModalMedir({
  equipoId,
  montadas,
  hoy,
  horometro,
}: {
  equipoId: string;
  montadas: FilaNeumatico[];
  hoy: string;
  horometro: number;
}) {
  return (
    <ConModal
      boton="Medir"
      estilo={boton.primario}
      titulo="Medir cocada"
      descripcion="Tres puntos por cubierta, en mm. La cocada es el más bajo. Deja vacías las que no midas."
    >
      {(cerrar) => (
        <Formulario
          accion={medirAction}
          texto="Guardar medición"
          onCerrar={cerrar}
        >
          {(e) => (
            <>
              <input type="hidden" name="equipoId" value={equipoId} />
              <FechaYHorometro estado={e} hoy={hoy} horometro={horometro} />
              <div className="overflow-x-auto sm:col-span-2">
                <table className="w-full min-w-[34rem] text-sm">
                  <thead className="text-left text-[11px] text-muted uppercase">
                    <tr>
                      {[
                        "Posición",
                        "Interno",
                        "Centro",
                        "Externo",
                        "Presión (psi)",
                      ].map((t) => (
                        <th key={t} className="pb-2 font-semibold">
                          {t}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {montadas.map((f) => (
                      <tr key={f.id}>
                        <td className="py-1 pr-2 font-mono text-[12px]">
                          {f.montaje?.posicionCodigo}
                          <span className="block text-muted">{f.codigo}</span>
                        </td>
                        {(
                          ["interno", "centro", "externo", "presion"] as const
                        ).map((p) => (
                          <td key={p} className="py-1 pr-2">
                            <input
                              name={`${p}:${f.id}`}
                              aria-label={`${p} ${f.montaje?.posicionCodigo}`}
                              inputMode="decimal"
                              defaultValue={e.valores?.[`${p}:${f.id}`] ?? ""}
                              className={campo}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </Formulario>
      )}
    </ConModal>
  );
}

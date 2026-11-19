import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { z } from "zod";
import { exigirAccesoEnPagina } from "@/modules/acceso/infrastructure/sesion";
import {
  opcionesTrabajo,
  responsablesOt,
  verTrabajo,
} from "@/modules/trabajos/application/casos-uso";
import { atraso } from "@/modules/trabajos/domain/bandeja";
import {
  CRITICIDADES,
  ESTADOS_BACKLOG,
} from "@/modules/trabajos/domain/backlog-estado";
import { reposTrabajos } from "@/modules/trabajos/infrastructure";
import {
  COLOR_CRITICIDAD,
  COLOR_ESTADO_BACKLOG,
  ESTADOS_REQUISICION,
  EVENTOS_HISTORIAL,
} from "@/modules/trabajos/ui/formato";
import { hoyEn } from "@/shared/kernel/fechas";
import { cabeceraSeccion, tarjeta } from "@/shared/ui/estilos";
import { formatoFecha, formatoFechaHora } from "@/shared/ui/formato";
import { IconoAtras, IconoLlave } from "@/shared/ui/iconos";
import { Encabezado, Esqueleto } from "../../encabezado";
import {
  BotonRequisicion,
  ModalAbrirOt,
  ModalBacklog,
  ModalCerrar,
  ModalReabrir,
  ModalRequisicion,
  ModalValidar,
} from "../modales-trabajo";

export const metadata: Metadata = { title: "Trabajo" };

export default function TrabajoPage({ params }: PageProps<"/trabajos/[id]">) {
  return (
    <>
      <Link
        href="/trabajos"
        className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg"
      >
        <IconoAtras width={16} height={16} />
        Backlogs y OT
      </Link>
      <Suspense
        fallback={
          <div className="flex flex-col gap-6">
            <Esqueleto alto="h-16" />
            <Esqueleto alto="h-72" />
          </div>
        }
      >
        <Detalle params={params} />
      </Suspense>
    </>
  );
}

const pill = "rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-normal";

async function Detalle({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const actor = await exigirAccesoEnPagina({
    accion: "leer",
    recurso: "trabajos",
  });
  const repos = await reposTrabajos();
  const r = await verTrabajo(actor, id, repos);
  if (!r.ok) throw r.error;
  if (!r.value) notFound();
  const { backlog: b, eventos, edicion, tieneFirma } = r.value;
  const hoy = hoyEn(r.value.zonaHoraria);

  const [opciones, responsables] = await Promise.all([
    edicion.permitido ? opcionesTrabajo(actor, repos) : null,
    eventos.includes("ABRIR_OT") ? responsablesOt(actor, repos) : null,
  ]);
  const dias = atraso(b, hoy);
  const antes = b.fotos.filter((f) => f.rol === "ANTES");
  const despues = b.fotos.filter((f) => f.rol === "DESPUES");

  return (
    <>
      <Encabezado
        icono={IconoLlave}
        color="var(--mod-mantenimiento)"
        titulo={
          <span className="flex flex-wrap items-center gap-3">
            <span className="font-mono">{b.codigo}</span>
            <span className={`${pill} ${COLOR_ESTADO_BACKLOG[b.estado]}`}>
              {ESTADOS_BACKLOG[b.estado]}
            </span>
            <span className={`${pill} ${COLOR_CRITICIDAD[b.criticidad]}`}>
              {CRITICIDADES[b.criticidad]}
            </span>
          </span>
        }
        descripcion={
          <span>
            <span className="font-mono">{b.equipo}</span> · {b.componente}
            {b.sistema && ` · ${b.sistema}`}
          </span>
        }
        acciones={
          <>
            {edicion.permitido && opciones?.ok && (
              <ModalBacklog
                backlog={b}
                opciones={opciones.value}
                hoy={hoy}
                exigeMotivo={edicion.exigeMotivo}
              />
            )}
            {eventos.includes("REABRIR") && <ModalReabrir backlogId={b.id} />}
            {eventos.includes("ABRIR_OT") && responsables?.ok && (
              <ModalAbrirOt
                backlogId={b.id}
                responsables={responsables.value}
              />
            )}
            {eventos.includes("CERRAR_RM") && (
              <ModalCerrar backlog={b} hoy={hoy} tieneFirma={tieneFirma} />
            )}
            {eventos.includes("APROBAR") && (
              <ModalValidar backlogId={b.id} tieneFirma={tieneFirma} />
            )}
          </>
        }
      />

      {b.devuelto && b.notaDevolucion && (
        <p className="mb-6 rounded-xl border border-bad/30 bg-bad-soft px-5 py-3.5 text-sm">
          <strong className="font-semibold text-bad">Devuelto:</strong>{" "}
          {b.notaDevolucion}
        </p>
      )}
      {b.estado === "PENDIENTE_VALIDACION" &&
        b.cerradoPorId === actor.id &&
        !eventos.includes("APROBAR") && (
          <p className="mb-6 rounded-xl border border-border bg-surface-2 px-5 py-3.5 text-sm text-muted">
            Cerraste este trabajo: lo valida otra persona.
          </p>
        )}

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="flex flex-col gap-6">
          <Seccion titulo="Datos del backlog">
            <dl className="grid gap-5 p-5 text-sm sm:grid-cols-2 sm:p-6">
              <Dato etiqueta="Equipo" valor={b.equipo} mono />
              <Dato etiqueta="Sistema" valor={b.sistema ?? "—"} />
              <Dato
                etiqueta="Observado"
                valor={formatoFecha(b.fechaObservacion)}
              />
              <Dato
                etiqueta="Programado"
                valor={
                  formatoFecha(b.fechaProgramada) +
                  (dias > 0 ? ` · ${dias} d de atraso` : "")
                }
              />
              <Dato
                etiqueta="Costo estimado"
                valor={new Intl.NumberFormat("es-PE", {
                  minimumFractionDigits: 2,
                }).format(b.costoEstimado)}
                mono
              />
              <Dato
                etiqueta="Creado por"
                valor={`${b.creadoPor ?? "—"} · ${formatoFechaHora(b.creadoEn)}`}
              />
              <div className="sm:col-span-2">
                <dt className="text-xs text-muted">Descripción</dt>
                <dd className="mt-0.5 whitespace-pre-line">{b.descripcion}</dd>
              </div>
            </dl>
            <Fotos titulo="Fotos antes" fotos={antes} />
          </Seccion>

          <Seccion
            titulo={
              b.ot ? `Orden de trabajo ${b.ot.codigo}` : "Orden de trabajo"
            }
            accion={
              r.value.pideRepuestos && <ModalRequisicion backlogId={b.id} />
            }
          >
            {b.ot ? (
              <>
                <dl className="grid gap-5 p-5 text-sm sm:grid-cols-2 sm:p-6">
                  <Dato etiqueta="Responsable" valor={b.ot.responsable} />
                  <Dato
                    etiqueta="Estado"
                    valor={b.ot.abierta ? "Abierta" : "Cerrada"}
                  />
                </dl>
                <Requisiciones
                  filas={b.requisiciones}
                  gestiona={r.value.gestionaRepuestos}
                />
              </>
            ) : (
              <p className="px-5 py-8 text-center text-sm text-muted">
                Sin OT todavía. La abre el supervisor o el planificador.
              </p>
            )}
          </Seccion>

          {b.rm && (
            <Seccion titulo={`Reporte de mantenimiento ${b.rm.codigo}`}>
              <dl className="grid gap-5 p-5 text-sm sm:grid-cols-2 sm:p-6">
                <Dato etiqueta="Fecha" valor={formatoFecha(b.rm.fecha)} />
                <Dato
                  etiqueta="Horómetro"
                  valor={new Intl.NumberFormat("es-PE").format(b.rm.horometro)}
                  mono
                />
                <Dato
                  etiqueta="Estado"
                  valor={b.rm.cerrado ? "Cerrado" : "Reabierto"}
                />
                <Dato etiqueta="Cerrado por" valor={b.rm.cerradoPor ?? "—"} />
                <div className="sm:col-span-2">
                  <dt className="text-xs text-muted">Trabajo realizado</dt>
                  <dd className="mt-0.5 whitespace-pre-line">
                    {b.rm.notas ?? "—"}
                  </dd>
                </div>
              </dl>
              <Fotos titulo="Fotos después" fotos={despues} />
            </Seccion>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <Seccion titulo="Firmas">
            {b.firmas.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-muted">
                Aún sin firmas.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {b.firmas.map((f) => (
                  <li
                    key={f.id}
                    className={`flex items-center gap-4 px-5 py-3 ${f.vigente ? "" : "opacity-55"}`}
                  >
                    {f.url ? (
                      // eslint-disable-next-line @next/next/no-img-element -- URL firmada de vida corta
                      <img
                        src={f.url}
                        alt={`Firma de ${f.nombre}`}
                        className="h-12 w-28 shrink-0 rounded-md border border-border bg-white object-contain"
                      />
                    ) : (
                      <span className="h-12 w-28 shrink-0 rounded-md border border-border bg-surface-2" />
                    )}
                    <span className="min-w-0 text-sm">
                      <span className="block font-medium">{f.nombre}</span>
                      <span className="block text-xs text-muted">
                        {f.tipo === "CIERRE" ? "Cierre" : "Validación"} ·{" "}
                        {formatoFechaHora(f.creadoEn)}
                        {!f.vigente && " · sin validez (reabierto o devuelto)"}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Seccion>

          <Seccion titulo="Historial">
            <ol className="divide-y divide-border">
              {b.historial.map((h) => (
                <li key={h.id} className="px-5 py-3 text-sm">
                  <p className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium">
                      {EVENTOS_HISTORIAL[h.evento] ?? h.evento}
                    </span>
                    <span
                      className={`${pill} ${COLOR_ESTADO_BACKLOG[h.estadoNuevo]}`}
                    >
                      {ESTADOS_BACKLOG[h.estadoNuevo]}
                    </span>
                  </p>
                  {h.nota && <p className="mt-1 text-muted">{h.nota}</p>}
                  <p className="mt-1 font-mono text-[11px] text-muted">
                    {h.usuario ?? "—"} · {formatoFechaHora(h.creadoEn)}
                  </p>
                </li>
              ))}
            </ol>
          </Seccion>
        </div>
      </div>
    </>
  );
}

function Seccion({
  titulo,
  accion,
  children,
}: {
  titulo: string;
  accion?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className={`${tarjeta} overflow-hidden`}>
      <div className={cabeceraSeccion}>
        <h2 className="text-sm font-semibold tracking-tight">{titulo}</h2>
        {accion}
      </div>
      {children}
    </section>
  );
}

function Fotos({
  titulo,
  fotos,
}: {
  titulo: string;
  fotos: { id: string; url: string | null }[];
}) {
  if (fotos.length === 0) return null;
  return (
    <div className="border-t border-border px-5 py-4 sm:px-6">
      <p className="mb-2 text-xs text-muted">{titulo}</p>
      <div className="grid grid-cols-3 gap-3">
        {fotos.map((f) =>
          f.url ? (
            <a key={f.id} href={f.url} target="_blank" rel="noreferrer">
              {/* eslint-disable-next-line @next/next/no-img-element -- URL firmada de vida corta */}
              <img
                src={f.url}
                alt={titulo}
                className="aspect-square w-full rounded-lg border border-border object-cover"
              />
            </a>
          ) : (
            <span
              key={f.id}
              className="aspect-square rounded-lg border border-border bg-surface-2"
            />
          ),
        )}
      </div>
    </div>
  );
}

function Requisiciones({
  filas,
  gestiona,
}: {
  filas: {
    id: string;
    codigo: string;
    descripcion: string;
    cantidad: number;
    unidad: string | null;
    estado: keyof typeof ESTADOS_REQUISICION;
    solicitadoPor: string | null;
  }[];
  gestiona: boolean;
}) {
  if (filas.length === 0) {
    return (
      <p className="border-t border-border px-5 py-4 text-sm text-muted sm:px-6">
        Sin requisiciones de repuestos.
      </p>
    );
  }
  return (
    <div className="overflow-x-auto border-t border-border">
      <table className="w-full min-w-[32rem] text-sm">
        <thead className="bg-surface-2/70 text-left">
          <tr>
            {["Código", "Repuesto", "Cantidad", "Estado", ""].map((th) => (
              <th
                key={th}
                className="px-5 py-2.5 text-[10px] font-semibold tracking-[0.13em] text-muted uppercase"
              >
                {th}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {filas.map((q) => (
            <tr key={q.id}>
              <td className="px-5 py-2.5 font-mono text-[12px]">{q.codigo}</td>
              <td className="px-5 py-2.5">
                {q.descripcion}
                <span className="block text-xs text-muted">
                  {q.solicitadoPor ?? "—"}
                </span>
              </td>
              <td className="px-5 py-2.5 tabular-nums">
                {q.cantidad} {q.unidad}
              </td>
              <td className="px-5 py-2.5">{ESTADOS_REQUISICION[q.estado]}</td>
              <td className="px-5 py-2.5 text-right">
                {gestiona && q.estado === "SOLICITADA" && (
                  <BotonRequisicion id={q.id} codigo={q.codigo} />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Dato({
  etiqueta,
  valor,
  mono,
}: {
  etiqueta: string;
  valor: string;
  mono?: boolean;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted">{etiqueta}</dt>
      <dd
        className={`mt-0.5 font-medium ${mono ? "font-mono tabular-nums" : ""}`}
      >
        {valor}
      </dd>
    </div>
  );
}

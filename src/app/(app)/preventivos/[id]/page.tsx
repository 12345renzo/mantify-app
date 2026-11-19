import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { z } from "zod";
import { exigirAccesoEnPagina } from "@/modules/acceso/infrastructure/sesion";
import {
  opcionesPreventivo,
  verPreventivo,
} from "@/modules/preventivos/application/casos-uso";
import { RESULTADOS } from "@/modules/preventivos/domain/actividad-observada";
import {
  ESTADOS_PREVENTIVO,
  TURNOS,
} from "@/modules/preventivos/domain/preventivo-estado";
import { situacion } from "@/modules/preventivos/domain/vencimiento";
import { reposPreventivos } from "@/modules/preventivos/infrastructure";
import {
  COLOR_ESTADO_PREVENTIVO,
  COLOR_RESULTADO,
  EVENTOS_PREVENTIVO,
  SITUACION,
} from "@/modules/preventivos/ui/formato";
import { cabeceraSeccion, tarjeta } from "@/shared/ui/estilos";
import { formatoFecha, formatoFechaHora } from "@/shared/ui/formato";
import { IconoAtras, IconoCalendario } from "@/shared/ui/iconos";
import { Encabezado, Esqueleto } from "../../encabezado";
import {
  ModalBacklogObservacion,
  ModalEjecutar,
  ModalProgramar,
  ModalReprogramar,
  ModalValidar,
} from "../modales-preventivo";

export const metadata: Metadata = { title: "Preventivo" };

export default function PreventivoPage({
  params,
}: PageProps<"/preventivos/[id]">) {
  return (
    <>
      <Link
        href="/preventivos"
        className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg"
      >
        <IconoAtras width={16} height={16} />
        Preventivos
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
const nf = new Intl.NumberFormat("es-PE");
const horas = (v: number | null) => (v === null ? "—" : nf.format(v));

async function Detalle({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const actor = await exigirAccesoEnPagina({
    accion: "leer",
    recurso: "trabajos",
  });
  const repos = await reposPreventivos();
  const r = await verPreventivo(actor, id, repos);
  if (!r.ok) throw r.error;
  if (!r.value) notFound();
  const { preventivo: p, hoy, siguiente, creaBacklog } = r.value;
  const opciones = siguiente ? await opcionesPreventivo(actor, repos) : null;
  const sit = situacion(p, hoy, p.horometroActual);

  return (
    <>
      <Encabezado
        icono={IconoCalendario}
        color="var(--mod-preventivos)"
        titulo={
          <span className="flex flex-wrap items-center gap-3">
            <span className="font-mono">{p.codigo}</span>
            <span className={`${pill} ${COLOR_ESTADO_PREVENTIVO[p.estado]}`}>
              {ESTADOS_PREVENTIVO[p.estado]}
            </span>
            {sit && sit !== "AL_DIA" && (
              <span className={`${pill} ${SITUACION[sit].color}`}>
                {SITUACION[sit].texto}
              </span>
            )}
          </span>
        }
        descripcion={
          <span>
            <span className="font-mono">{p.equipo}</span> · {p.plan} · {p.tipo}
          </span>
        }
        acciones={
          <>
            {r.value.reprograma && (
              <ModalReprogramar
                preventivoId={p.id}
                hoy={hoy}
                fechaActual={p.fechaProgramada}
              />
            )}
            {siguiente && opciones?.ok && (
              <ModalProgramar
                opciones={opciones.value}
                hoy={hoy}
                prellenado={{
                  equipoId: p.equipoId,
                  nombrePlanId: p.nombrePlanId,
                  tipo: p.tipo,
                  fechaProgramada: siguiente.fecha ?? hoy,
                  horometroProgramado:
                    siguiente.horometro === null
                      ? ""
                      : String(siguiente.horometro),
                  responsableId: p.esTercero ? "" : (p.responsableId ?? ""),
                  tercero: p.esTercero ? p.responsable : "",
                  cadaDias: p.cadaDias === null ? "" : String(p.cadaDias),
                  cadaHoras: p.cadaHoras === null ? "" : String(p.cadaHoras),
                }}
              />
            )}
            {r.value.ejecuta && (
              <ModalEjecutar
                preventivo={p}
                personas={r.value.personas}
                hoy={hoy}
                tieneFirma={r.value.tieneFirma}
              />
            )}
            {r.value.valida && (
              <ModalValidar
                preventivoId={p.id}
                tieneFirma={r.value.tieneFirma}
              />
            )}
          </>
        }
      />

      {p.estado === "DEVUELTO" && p.notaDevolucion && (
        <p className="mb-6 rounded-xl border border-bad/30 bg-bad-soft px-5 py-3.5 text-sm">
          <strong className="font-semibold text-bad">Devuelto:</strong>{" "}
          {p.notaDevolucion}
        </p>
      )}
      {p.estado === "COMPLETADO" &&
        p.ejecutadoPorId === actor.id &&
        !r.value.valida && (
          <p className="mb-6 rounded-xl border border-border bg-surface-2 px-5 py-3.5 text-sm text-muted">
            Ejecutaste este preventivo: lo valida otra persona.
          </p>
        )}

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="flex flex-col gap-6">
          <Seccion titulo="Programación">
            <dl className="grid gap-5 p-5 text-sm sm:grid-cols-2 sm:p-6">
              <Dato etiqueta="Equipo" valor={p.equipo} mono />
              <Dato etiqueta="Plan" valor={`${p.plan} · ${p.tipo}`} />
              <Dato
                etiqueta="Fecha programada"
                valor={formatoFecha(p.fechaProgramada)}
              />
              <Dato
                etiqueta="Horómetro programado / actual"
                valor={`${horas(p.horometroProgramado)} / ${horas(p.horometroActual)}`}
                mono
              />
              <Dato
                etiqueta={p.esTercero ? "Tercero" : "Responsable"}
                valor={p.responsable}
              />
              <Dato
                etiqueta="Recurrencia"
                valor={
                  [
                    p.cadaDias && `cada ${p.cadaDias} días`,
                    p.cadaHoras && `cada ${nf.format(p.cadaHoras)} h`,
                  ]
                    .filter(Boolean)
                    .join(" o ") || "—"
                }
              />
            </dl>
          </Seccion>

          <Seccion titulo="Actividades">
            {p.actividades.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-muted">
                Sin actividades de plantilla.
              </p>
            ) : (
              <ol className="divide-y divide-border">
                {p.actividades.map((a, i) => (
                  <li key={a.id} className="px-5 py-3 text-sm sm:px-6">
                    <p className="flex flex-wrap items-center justify-between gap-2">
                      <span>
                        <span className="mr-2 font-mono text-xs text-muted">
                          {i + 1}.
                        </span>
                        {a.descripcion}
                      </span>
                      {a.resultado && (
                        <span
                          className={`${pill} ${COLOR_RESULTADO[a.resultado]}`}
                        >
                          {RESULTADOS[a.resultado]}
                        </span>
                      )}
                    </p>
                    {a.observacion && (
                      <p className="mt-1 text-muted">{a.observacion}</p>
                    )}
                    {a.resultado === "OBSERVADO" && (
                      <p className="mt-1.5">
                        {a.backlog ? (
                          <Link
                            href={`/trabajos/${a.backlog.id}`}
                            className="font-mono text-xs font-semibold text-primary hover:underline"
                          >
                            Backlog {a.backlog.codigo}
                          </Link>
                        ) : (
                          creaBacklog && (
                            <ModalBacklogObservacion
                              preventivoId={p.id}
                              actividad={a}
                            />
                          )
                        )}
                      </p>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </Seccion>

          {p.fechaEjecucion && (
            <Seccion titulo="Ejecución">
              <dl className="grid gap-5 p-5 text-sm sm:grid-cols-2 sm:p-6">
                <Dato etiqueta="Fecha" valor={formatoFecha(p.fechaEjecucion)} />
                <Dato
                  etiqueta="Turno"
                  valor={p.turno ? TURNOS[p.turno] : "—"}
                />
                <Dato
                  etiqueta="Horas"
                  valor={`${p.horaInicio} → ${p.horaFin} · ${horas(p.duracionHoras)} h`}
                  mono
                />
                <Dato
                  etiqueta="Horómetro"
                  valor={horas(p.horometroEjecucion)}
                  mono
                />
                <Dato etiqueta="Ejecutado por" valor={p.ejecutadoPor ?? "—"} />
                <Dato etiqueta="Validado por" valor={p.validadoPor ?? "—"} />
                <Dato
                  etiqueta="Personal"
                  valor={p.personal.map((x) => x.nombre).join(", ") || "—"}
                />
                <div className="sm:col-span-2">
                  <dt className="text-xs text-muted">Notas</dt>
                  <dd className="mt-0.5 whitespace-pre-line">
                    {p.notas ?? "—"}
                  </dd>
                </div>
              </dl>
              {p.repuestos.length > 0 && (
                <ul className="divide-y divide-border border-t border-border text-sm">
                  {p.repuestos.map((x, i) => (
                    <li
                      key={i}
                      className="flex justify-between gap-4 px-5 py-2.5 sm:px-6"
                    >
                      <span>{x.descripcion}</span>
                      <span className="tabular-nums text-muted">
                        {nf.format(x.cantidad)} {x.unidad}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              {p.fotos.length > 0 && (
                <div className="grid grid-cols-3 gap-3 border-t border-border px-5 py-4 sm:px-6">
                  {p.fotos.map((f) =>
                    f.url ? (
                      <a
                        key={f.id}
                        href={f.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element -- URL firmada de vida corta */}
                        <img
                          src={f.url}
                          alt="Foto de la ejecución"
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
              )}
            </Seccion>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <Seccion titulo="Firmas">
            {p.firmas.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-muted">
                Aún sin firmas.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {p.firmas.map((f) => (
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
                        {f.tipo === "EJECUCION" ? "Ejecución" : "Validación"} ·{" "}
                        {formatoFechaHora(f.creadoEn)}
                        {!f.vigente && " · sin validez (devuelto)"}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Seccion>

          <Seccion titulo="Historial">
            <ol className="divide-y divide-border">
              {p.historial.map((h) => (
                <li key={h.id} className="px-5 py-3 text-sm">
                  <p className="font-medium">
                    {EVENTOS_PREVENTIVO[h.evento] ?? h.evento}
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
  children,
}: {
  titulo: string;
  children: ReactNode;
}) {
  return (
    <section className={`${tarjeta} overflow-hidden`}>
      <div className={cabeceraSeccion}>
        <h2 className="text-sm font-semibold tracking-tight">{titulo}</h2>
      </div>
      {children}
    </section>
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

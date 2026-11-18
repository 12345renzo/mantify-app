import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";
import { exigirAccesoEnPagina } from "@/modules/acceso/infrastructure/sesion";
import { verEquipo } from "@/modules/equipos/application/casos-uso";
import {
  ESTADOS_MOVILIZACION,
  ESTADOS_OPERATIVOS,
  ORIGENES_LECTURA,
} from "@/modules/equipos/domain/equipo";
import { reposEquipos } from "@/modules/equipos/infrastructure";
import { COLOR_ESTADO, formatoHorometro } from "@/modules/equipos/ui/formato";
import { puede } from "@/modules/identidad/domain/permisos";
import { hoyEn } from "@/shared/kernel/fechas";
import { tarjeta } from "@/shared/ui/estilos";
import { formatoFecha, formatoFechaHora } from "@/shared/ui/formato";
import { IconoAtras, IconoEquipo } from "@/shared/ui/iconos";
import { Paginacion, paginar, type ParamsUrl } from "@/shared/ui/paginacion";
import { Encabezado, Esqueleto } from "../../encabezado";
import {
  BotonMovilizacion,
  ModalEquipo,
  ModalLectura,
} from "../modales-equipo";
import { opcionesEquipo } from "../opciones";

export const metadata: Metadata = { title: "Equipo" };

export default function EquipoPage({
  params,
  searchParams,
}: PageProps<"/equipos/[id]">) {
  return (
    <>
      <Link
        href="/equipos"
        className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg"
      >
        <IconoAtras width={16} height={16} />
        Equipos
      </Link>
      <Suspense
        fallback={
          <div className="flex flex-col gap-6">
            <Esqueleto alto="h-16" />
            <Esqueleto alto="h-72" />
          </div>
        }
      >
        <Ficha params={params} searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Ficha({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<ParamsUrl>;
}) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  if (!z.uuid().safeParse(id).success) notFound();
  const actor = await exigirAccesoEnPagina({
    accion: "leer",
    recurso: "flota",
  });

  const r = await verEquipo(actor, id, await reposEquipos());
  if (!r.ok) throw r.error;
  if (!r.value) notFound();
  const { equipo: e, lecturas } = r.value;

  const tab = sp.tab === "horometro" ? "horometro" : "datos";
  const gestiona = puede(actor.rol, "editar", "flota");
  const registra = puede(actor.rol, "crear", "horometro");
  const corrige = puede(actor.rol, "editar", "horometro");
  const desmovilizado = e.estadoMovilizacion === "DESMOVILIZADO";
  const opciones = gestiona ? await opcionesEquipo(actor) : null;
  const unidad = e.tipoMedidor === "KILOMETROS" ? "km" : "h";
  const actual = formatoHorometro(e.horometroActual, e.tipoMedidor);
  const hoy = hoyEn("America/Lima");
  const pag = paginar(lecturas, sp.pagina);

  const pestaña = (valor: "datos" | "horometro", texto: string) => (
    <Link
      href={valor === "datos" ? "?" : "?tab=horometro"}
      aria-current={tab === valor ? "page" : undefined}
      className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
        tab === valor ? "bg-primary-soft text-fg" : "text-muted hover:text-fg"
      }`}
    >
      {texto}
    </Link>
  );

  return (
    <>
      <Encabezado
        icono={IconoEquipo}
        color="var(--mod-equipos)"
        titulo={
          <span className="flex flex-wrap items-center gap-3">
            <span className="font-mono">{e.codigo}</span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-normal ${COLOR_ESTADO[e.estadoOperativo]}`}
            >
              {ESTADOS_OPERATIVOS[e.estadoOperativo]}
            </span>
            {e.estadoMovilizacion !== "MOVILIZADO" && (
              <span className="rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-semibold tracking-normal text-muted">
                {ESTADOS_MOVILIZACION[e.estadoMovilizacion]}
              </span>
            )}
          </span>
        }
        descripcion={
          <span>
            {e.categoria}
            {(e.marca || e.modelo) &&
              ` · ${[e.marca, e.modelo].filter(Boolean).join(" ")}`}
            {` · ${actual}`}
          </span>
        }
        acciones={
          gestiona &&
          opciones && (
            <>
              {!desmovilizado && (
                <ModalEquipo
                  equipo={e}
                  categorias={opciones.categorias}
                  ubicaciones={opciones.ubicaciones}
                />
              )}
              <BotonMovilizacion
                equipoId={e.id}
                codigo={e.codigo}
                desmovilizado={desmovilizado}
              />
            </>
          )
        }
      />

      {desmovilizado && (
        <p className="mb-6 rounded-xl border border-border bg-surface-2 px-5 py-3.5 text-sm text-muted">
          Equipo desmovilizado: está en inactivos y conserva su historial. No
          admite lecturas nuevas mientras no se vuelva a movilizar.
        </p>
      )}

      <nav
        aria-label="Secciones del equipo"
        className="mb-6 inline-flex rounded-lg border border-border p-1"
      >
        {pestaña("datos", "Datos")}
        {pestaña("horometro", `Horómetro (${lecturas.length})`)}
      </nav>

      {tab === "datos" ? (
        <section className={`${tarjeta} p-5 sm:p-6`}>
          <dl className="grid gap-5 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <Dato etiqueta="Código" valor={e.codigo} mono />
            <Dato etiqueta="Categoría" valor={e.categoria} />
            <Dato etiqueta="Ubicación" valor={e.ubicacion ?? "—"} />
            <Dato etiqueta="Marca" valor={e.marca ?? "—"} />
            <Dato etiqueta="Modelo" valor={e.modelo ?? "—"} />
            <Dato etiqueta="N.º de serie" valor={e.numeroSerie ?? "—"} mono />
            <Dato
              etiqueta="Estado operativo"
              valor={ESTADOS_OPERATIVOS[e.estadoOperativo]}
            />
            <Dato
              etiqueta="Movilización"
              valor={ESTADOS_MOVILIZACION[e.estadoMovilizacion]}
            />
            <Dato
              etiqueta="Requiere engrase"
              valor={e.requiereEngrase ? "Sí" : "No"}
            />
            <Dato
              etiqueta="Código en otro sistema"
              valor={e.idExterno ?? "—"}
              mono
            />
            <Dato etiqueta="Horómetro actual" valor={actual} mono />
            <Dato
              etiqueta="Última lectura"
              valor={
                e.horometroActualEn
                  ? formatoFechaHora(e.horometroActualEn)
                  : "—"
              }
            />
          </dl>
        </section>
      ) : (
        <section className={`${tarjeta} overflow-hidden`}>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4 sm:px-6">
            <div>
              <p className="text-sm text-muted">Horómetro actual</p>
              <p className="mt-0.5 font-mono text-2xl font-semibold tabular-nums">
                {actual}
              </p>
            </div>
            {!desmovilizado && (registra || corrige) && (
              <div className="flex flex-wrap items-center gap-4">
                {corrige && e.horometroActual > 0 && (
                  <ModalLectura
                    equipoId={e.id}
                    actual={actual}
                    unidad={unidad}
                    hoy={hoy}
                    correccion
                  />
                )}
                {registra && (
                  <ModalLectura
                    equipoId={e.id}
                    actual={actual}
                    unidad={unidad}
                    hoy={hoy}
                  />
                )}
              </div>
            )}
          </div>
          {lecturas.length === 0 ? (
            <p className="px-5 py-12 text-center text-sm text-muted">
              Sin lecturas todavía.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[40rem] text-sm">
                <thead className="bg-surface-2/70 text-left">
                  <tr>
                    {[
                      "Fecha",
                      "Lectura",
                      "Origen",
                      "Detalle",
                      "Registrada por",
                    ].map((th) => (
                      <th
                        key={th}
                        className={`px-5 py-3 text-[10px] font-semibold tracking-[0.13em] text-muted uppercase ${
                          th === "Lectura" ? "text-right" : ""
                        }`}
                      >
                        {th}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {pag.items.map((l) => (
                    <tr
                      key={l.id}
                      className={l.esCorreccion ? "bg-bad-soft/40" : ""}
                    >
                      <td className="px-5 py-3 tabular-nums">
                        {formatoFecha(l.fecha)}
                      </td>
                      <td className="px-5 py-3 text-right font-mono text-[12px] tabular-nums">
                        {formatoHorometro(l.valor, e.tipoMedidor)}
                      </td>
                      <td className="px-5 py-3 text-muted">
                        {ORIGENES_LECTURA[l.origen]}
                      </td>
                      <td className="px-5 py-3">
                        {l.esCorreccion ? (
                          <span className="text-bad">
                            <strong className="font-semibold">
                              Corrección:
                            </strong>{" "}
                            {l.motivo}
                          </span>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <span className="font-medium">
                          {l.autor ?? "Sistema"}
                        </span>
                        <span className="block font-mono text-[11px] text-muted">
                          {formatoFechaHora(l.creadoEn)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Paginacion
            param="pagina"
            params={sp}
            pagina={pag.pagina}
            paginas={pag.paginas}
            total={pag.total}
          />
        </section>
      )}
    </>
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
        className={`mt-0.5 truncate font-medium ${mono ? "font-mono tabular-nums" : ""}`}
      >
        {valor}
      </dd>
    </div>
  );
}

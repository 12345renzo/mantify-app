import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";
import { exigirAccesoEnPagina } from "@/modules/acceso/infrastructure/sesion";
import { puede } from "@/modules/identidad/domain/permisos";
import { verNeumatico } from "@/modules/neumaticos/application/casos-uso";
import { cocada } from "@/modules/neumaticos/domain/salud";
import { reposNeumaticos } from "@/modules/neumaticos/infrastructure";
import {
  costoUnidad,
  ESTADO_NEUMATICO,
  EVENTO_NEUMATICO,
  mm,
  moneda,
  numero,
  SALUD,
  unidad,
} from "@/modules/neumaticos/ui/formato";
import { cabeceraSeccion, tarjeta } from "@/shared/ui/estilos";
import { formatoFecha, formatoFechaHora } from "@/shared/ui/formato";
import { IconoAtras, IconoNeumatico } from "@/shared/ui/iconos";
import { Encabezado, Esqueleto } from "../../encabezado";
import { ModalCubierta, ModalRecapar } from "../modales-neumatico";

export const metadata: Metadata = { title: "Cubierta" };

export default function CubiertaPage({
  params,
}: PageProps<"/neumaticos/[id]">) {
  return (
    <>
      <Link
        href="/neumaticos"
        className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg"
      >
        <IconoAtras width={16} height={16} />
        Neumáticos
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
const th =
  "px-5 py-3 text-[10px] font-semibold tracking-[0.13em] text-muted uppercase";

function Dato({
  etiqueta,
  valor,
}: {
  etiqueta: string;
  valor: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs text-muted">{etiqueta}</p>
      <p className="font-mono text-sm tabular-nums">{valor}</p>
    </div>
  );
}

async function Detalle({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const actor = await exigirAccesoEnPagina({
    accion: "leer",
    recurso: "neumaticos",
  });
  const r = await verNeumatico(actor, id, await reposNeumaticos());
  if (!r.ok) {
    if (r.error.code === "NOT_FOUND") notFound();
    throw r.error;
  }
  const { fila: f, eventos, mediciones, esPro, proyeccion, veCostos } = r.value;
  const edita = puede(actor.rol, "editar", "neumaticos");
  const u = f.montaje ? unidad(f.montaje.medidor) : "h";

  return (
    <>
      <Encabezado
        icono={IconoNeumatico}
        color="var(--mod-neumaticos)"
        titulo={
          <span className="flex flex-wrap items-center gap-3">
            <span className="font-mono">{f.codigo}</span>
            {f.salud ? (
              <span className={`${pill} ${SALUD[f.salud].color}`}>
                {SALUD[f.salud].texto}
              </span>
            ) : (
              <span className={`${pill} bg-surface-2 text-muted`}>
                {ESTADO_NEUMATICO[f.estado]}
              </span>
            )}
            {f.irregular && (
              <span className={`${pill} bg-warn-soft text-warn`}>
                Desgaste irregular
              </span>
            )}
          </span>
        }
        descripcion={`${f.marca}${f.modelo ? ` ${f.modelo}` : ""} · ${f.medida}`}
        acciones={
          edita && (
            <>
              {f.estado === "STOCK" && <ModalCubierta fila={f} />}
              {f.estado === "RECAPADO" && <ModalRecapar fila={f} />}
            </>
          )
        }
      />

      <section
        className={`${tarjeta} mb-6 grid gap-4 px-5 py-4 sm:grid-cols-3 lg:grid-cols-4`}
      >
        <Dato etiqueta="Cocada actual" valor={mm(f.cocadaActual)} />
        <Dato etiqueta="Cocada nueva" valor={mm(f.cocadaNueva)} />
        <Dato
          etiqueta="Montada en"
          valor={
            f.montaje ? (
              <Link
                href={`/neumaticos/equipo/${f.montaje.equipoId}`}
                className="hover:text-primary"
              >
                {f.montaje.equipoCodigo} · {f.montaje.posicionCodigo}
              </Link>
            ) : (
              "—"
            )
          }
        />
        <Dato etiqueta="Recapados" valor={f.recapados} />
        <Dato
          etiqueta={`Trabajado (${u})`}
          valor={numero(
            f.horasAcumuladas +
              (f.montaje
                ? Math.max(
                    0,
                    f.montaje.equipoHorometro - f.montaje.horometroMontaje,
                  )
                : 0),
          )}
        />
        {f.diasSinMedir !== null && (
          <Dato
            etiqueta="Días desde la última medición"
            valor={f.diasSinMedir}
          />
        )}
        {veCostos && (
          <>
            <Dato
              etiqueta="Costo + recapados"
              valor={moneda(
                f.costo === null ? null : f.costo + (f.costoRecapados ?? 0),
              )}
            />
            <Dato
              etiqueta={`Costo por ${u}`}
              valor={costoUnidad(f.costoPorHora, f.montaje?.medidor ?? "HORAS")}
            />
          </>
        )}
      </section>

      <section className={`${tarjeta} mb-6 px-5 py-4`}>
        <p className="mb-1 text-sm font-semibold">Proyección de desgaste</p>
        {!esPro ? (
          <p className="text-sm text-muted">Disponible en el plan Pro.</p>
        ) : proyeccion ? (
          <p className="text-sm">
            Desgaste de {proyeccion.desgastePorHora} mm por {u}. Llega a la
            cocada mínima en unas{" "}
            <span className="font-mono">
              {numero(proyeccion.horasRestantes)}
            </span>{" "}
            {u}.
          </p>
        ) : (
          <p className="text-sm text-muted">
            Hacen falta al menos dos mediciones con desgaste, y umbrales
            definidos.
          </p>
        )}
      </section>

      <section className={`${tarjeta} mb-6 overflow-hidden`}>
        <div className={cabeceraSeccion}>
          <h2 className="text-sm font-semibold tracking-tight">Mediciones</h2>
        </div>
        {mediciones.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted">
            Todavía no se midió.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem] text-sm">
              <thead className="bg-surface-2/70 text-left">
                <tr>
                  {[
                    "Fecha",
                    "Equipo · posición",
                    "Int / Cen / Ext",
                    "Cocada",
                    "Presión",
                  ].map((t) => (
                    <th key={t} className={th}>
                      {t}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {mediciones.map((m, i) => (
                  <tr key={i}>
                    <td className="px-5 py-3 tabular-nums">
                      {formatoFecha(m.fecha)}
                      {m.recapado !== f.recapados && (
                        <span className="ml-2 text-xs text-muted">
                          (antes del recapado)
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 font-mono text-[12px]">
                      {m.equipo} · {m.posicion}
                    </td>
                    <td className="px-5 py-3 font-mono text-[12px] tabular-nums">
                      {numero(m.puntos.interno)} / {numero(m.puntos.centro)} /{" "}
                      {numero(m.puntos.externo)}
                    </td>
                    <td className="px-5 py-3 font-mono text-[12px] tabular-nums">
                      {mm(cocada(m.puntos))}
                    </td>
                    <td className="px-5 py-3 tabular-nums">
                      {m.presion === null ? "—" : `${numero(m.presion)} psi`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className={`${tarjeta} overflow-hidden`}>
        <div className={cabeceraSeccion}>
          <h2 className="text-sm font-semibold tracking-tight">Historial</h2>
        </div>
        <ul className="divide-y divide-border">
          {eventos.map((e) => (
            <li
              key={e.id}
              className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3 text-sm sm:px-6"
            >
              <span className="font-semibold">
                {EVENTO_NEUMATICO[e.tipo] ?? e.tipo}
              </span>
              {e.equipo && (
                <span className="font-mono text-[12px]">
                  {e.equipo}
                  {e.posicion && ` · ${e.posicion}`}
                </span>
              )}
              {e.horometro !== null && (
                <span className="font-mono text-[12px] text-muted">
                  {numero(e.horometro)} {u}
                </span>
              )}
              {e.detalle && <span className="text-muted">{e.detalle}</span>}
              <span className="ml-auto text-xs text-muted">
                {e.registradoPor} · {formatoFechaHora(e.creadoEn)}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";
import { exigirAccesoEnPagina } from "@/modules/acceso/infrastructure/sesion";
import { verEngrase } from "@/modules/engrase/application/casos-uso";
import { reposEngrase } from "@/modules/engrase/infrastructure";
import {
  ESTADO_ENGRASE,
  formatoFrecuencia,
  formatoNumero,
  formatoRestante,
  unidad,
} from "@/modules/engrase/ui/formato";
import { puede } from "@/modules/identidad/domain/permisos";
import { cabeceraSeccion, tarjeta } from "@/shared/ui/estilos";
import { formatoFecha, formatoFechaHora } from "@/shared/ui/formato";
import { IconoAtras, IconoGota } from "@/shared/ui/iconos";
import { Encabezado, Esqueleto } from "../../encabezado";
import { ModalPlan, ModalRegistrar } from "../modales-engrase";

export const metadata: Metadata = { title: "Engrase del equipo" };

export default function EngraseEquipoPage({
  params,
}: PageProps<"/engrase/[id]">) {
  return (
    <>
      <Link
        href="/engrase"
        className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg"
      >
        <IconoAtras width={16} height={16} />
        Engrase
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
    recurso: "engrase",
  });
  const r = await verEngrase(actor, id, await reposEngrase());
  if (!r.ok) {
    if (r.error.code === "NOT_FOUND") notFound();
    throw r.error;
  }
  const { fila: f, grasas, hoy, registros } = r.value;
  const grasaPlan = grasas.find((g) => g.id === f.plan?.tipoGrasaId)?.nombre;

  return (
    <>
      <Encabezado
        icono={IconoGota}
        color="var(--mod-engrase)"
        titulo={
          <span className="flex flex-wrap items-center gap-3">
            <span className="font-mono">{f.codigo}</span>
            <span className={`${pill} ${ESTADO_ENGRASE[f.estado].color}`}>
              {ESTADO_ENGRASE[f.estado].texto}
            </span>
          </span>
        }
        descripcion={
          <span>
            {f.plan
              ? `${formatoFrecuencia(f.plan, f.medidor)}${grasaPlan ? ` · ${grasaPlan}` : ""}`
              : "Sin plan de engrase"}{" "}
            · horómetro actual{" "}
            <span className="font-mono">
              {formatoNumero(f.horometro)} {unidad(f.medidor)}
            </span>
          </span>
        }
        acciones={
          <>
            {puede(actor.rol, "editar", "engrase") && (
              <ModalPlan fila={f} grasas={grasas} />
            )}
            {puede(actor.rol, "crear", "engrase") && (
              <ModalRegistrar fila={f} grasas={grasas} hoy={hoy} />
            )}
          </>
        }
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        <section className={`${tarjeta} px-5 py-4`}>
          <p className="text-sm text-muted">Le falta</p>
          <p className="font-mono text-xl font-semibold tabular-nums">
            {formatoRestante(f)}
          </p>
          {f.ultimoCompleto && (
            <p className="mt-1 text-sm text-muted">
              Último completo: {formatoFecha(f.ultimoCompleto.fecha)} ·{" "}
              {formatoNumero(f.ultimoCompleto.horometro)} {unidad(f.medidor)}
            </p>
          )}
        </section>
        <section className={`${tarjeta} px-5 py-4`}>
          <p className="text-sm text-muted">
            Puntos {f.puntosPropios ? "del plan" : "de plantilla (categoría)"}
          </p>
          {f.puntos.length ? (
            <p className="text-sm">
              {f.puntos.map((p) => p.descripcion).join(", ")}
            </p>
          ) : (
            <p className="text-sm text-muted">
              Sin puntos. Crea el plan o agrega plantillas en Catálogos → Puntos
              de engrase.
            </p>
          )}
        </section>
      </div>

      <section className={`${tarjeta} overflow-hidden`}>
        <div className={cabeceraSeccion}>
          <h2 className="text-sm font-semibold tracking-tight">Historial</h2>
        </div>
        {registros.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-muted">
            Todavía no hay engrases registrados.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {registros.map((g) => {
              const hechos = g.puntos.filter((p) => p.engrasado).length;
              return (
                <li key={g.id} className="px-5 py-4 sm:px-6">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                    <span className="font-semibold tabular-nums">
                      {formatoFecha(g.fecha)}
                    </span>
                    <span className="font-mono text-[12px] tabular-nums">
                      {formatoNumero(g.horometro)} {unidad(f.medidor)}
                    </span>
                    <span
                      className={`${pill} ${g.completo ? "bg-ok-soft text-ok" : "bg-warn-soft text-warn"}`}
                    >
                      {g.completo ? "Completo" : "Incompleto"} ({hechos}/
                      {g.puntos.length})
                    </span>
                    <span className="text-muted">{g.grasa}</span>
                    <span className="ml-auto text-xs text-muted">
                      {g.registradoPor} · {formatoFechaHora(g.creadoEn)}
                    </span>
                  </div>
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {g.puntos.map((p, i) => (
                      <li
                        key={i}
                        className={`rounded-md px-2 py-0.5 text-xs ${p.engrasado ? "bg-surface-2 text-fg" : "bg-bad-soft text-bad line-through"}`}
                      >
                        {p.descripcion}
                      </li>
                    ))}
                  </ul>
                  {g.observacion && (
                    <p className="mt-2 text-sm text-muted">
                      Observación: {g.observacion}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}

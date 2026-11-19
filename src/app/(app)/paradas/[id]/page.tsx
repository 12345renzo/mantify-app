import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";
import { exigirAccesoEnPagina } from "@/modules/acceso/infrastructure/sesion";
import {
  opcionesParada,
  verParada,
} from "@/modules/paradas/application/casos-uso";
import { reposParadas } from "@/modules/paradas/infrastructure";
import { cabeceraSeccion, tarjeta } from "@/shared/ui/estilos";
import { IconoAtras, IconoParada } from "@/shared/ui/iconos";
import { Encabezado, Esqueleto } from "../../encabezado";
import { ModalBacklogHallazgo, ModalCerrar } from "../modales-parada";

export const metadata: Metadata = { title: "Parada" };

export default function ParadaPage({ params }: PageProps<"/paradas/[id]">) {
  return (
    <>
      <Link
        href="/paradas"
        className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg"
      >
        <IconoAtras width={16} height={16} />
        Paradas
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
const nf = new Intl.NumberFormat("es-PE", { maximumFractionDigits: 2 });
const hora = (t: string | null) => (t ? t.replace("T", " ") : "—");

async function Detalle({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const actor = await exigirAccesoEnPagina({
    accion: "leer",
    recurso: "trabajos",
  });
  const repos = await reposParadas();
  const r = await verParada(actor, id, repos);
  if (!r.ok) throw r.error;
  if (!r.value) notFound();
  const { parada: p, cierra, creaBacklog, ahora } = r.value;
  const opciones = cierra ? await opcionesParada(actor, repos) : null;

  return (
    <>
      <Encabezado
        icono={IconoParada}
        color="var(--mod-paradas)"
        titulo={
          <span className="flex flex-wrap items-center gap-3">
            <span className="font-mono">{p.codigo}</span>
            <span
              className={`${pill} ${p.estado === "ABIERTA" ? "bg-warn-soft text-warn" : "bg-ok-soft text-ok"}`}
            >
              {p.estado === "ABIERTA" ? "Abierta" : "Cerrada"}
            </span>
            <span
              className={`${pill} ${p.esPlanificado ? "bg-surface-2 text-muted" : "bg-bad-soft text-bad"}`}
            >
              {p.esPlanificado ? "Planificada" : "No planificada"}
            </span>
          </span>
        }
        descripcion={
          <span>
            <span className="font-mono">{p.equipo}</span> · {p.motivoCodigo} —{" "}
            {p.motivo}
          </span>
        }
        acciones={
          <>
            {creaBacklog && <ModalBacklogHallazgo parada={p} />}
            {cierra && opciones?.ok && (
              <ModalCerrar
                parada={p}
                areas={opciones.value.areas}
                ahora={ahora}
              />
            )}
          </>
        }
      />

      {p.cruceConfirmado && (
        <p className="mb-6 rounded-xl border border-warn/30 bg-warn-soft px-5 py-3.5 text-sm">
          Se cruza con otra parada del mismo equipo (confirmado al registrar).
        </p>
      )}

      <section className={`${tarjeta} overflow-hidden`}>
        <div className={cabeceraSeccion}>
          <h2 className="text-sm font-semibold tracking-tight">Datos</h2>
        </div>
        <dl className="grid gap-5 p-5 text-sm sm:grid-cols-3 sm:p-6">
          <Dato etiqueta="Parada" valor={hora(p.inicio)} mono />
          <Dato etiqueta="Salida" valor={hora(p.fin)} mono />
          <Dato
            etiqueta="Duración"
            valor={
              p.duracionHoras === null ? "—" : `${nf.format(p.duracionHoras)} h`
            }
            mono
          />
          <Dato
            etiqueta="Horómetro parada / salida"
            valor={`${nf.format(p.horometroInicio)} / ${p.horometroFin === null ? "—" : nf.format(p.horometroFin)}`}
            mono
          />
          <Dato etiqueta="Responsable" valor={p.responsable} />
          <Dato
            etiqueta="Área parada / demora"
            valor={`${p.areaParada ?? "—"} / ${p.areaDemora ?? "—"}`}
          />
          <div className="sm:col-span-3">
            <dt className="text-xs text-muted">Tarea realizada</dt>
            <dd className="mt-0.5 whitespace-pre-line">
              {p.descripcion ?? "—"}
            </dd>
          </div>
          {p.hallazgo && (
            <div className="sm:col-span-3">
              <dt className="text-xs text-muted">Hallazgo</dt>
              <dd className="mt-0.5 whitespace-pre-line">
                {p.hallazgo}
                {p.backlog && (
                  <Link
                    href={`/trabajos/${p.backlog.id}`}
                    className="ml-2 font-mono text-xs font-semibold text-primary hover:underline"
                  >
                    Backlog {p.backlog.codigo}
                  </Link>
                )}
              </dd>
            </div>
          )}
        </dl>
        {p.fotos.length > 0 && (
          <div className="grid grid-cols-3 gap-3 border-t border-border px-5 py-4 sm:grid-cols-5 sm:px-6">
            {p.fotos.map((f) =>
              f.url ? (
                <a key={f.id} href={f.url} target="_blank" rel="noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element -- URL firmada de vida corta */}
                  <img
                    src={f.url}
                    alt="Foto de la parada"
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
      </section>
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
        className={`mt-0.5 font-medium ${mono ? "font-mono tabular-nums" : ""}`}
      >
        {valor}
      </dd>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";
import { exigirAccesoEnPagina } from "@/modules/acceso/infrastructure/sesion";
import { puede } from "@/modules/identidad/domain/permisos";
import { verEquipoNeumaticos } from "@/modules/neumaticos/application/casos-uso";
import { reposNeumaticos } from "@/modules/neumaticos/infrastructure";
import { mm, numero, SALUD, unidad } from "@/modules/neumaticos/ui/formato";
import { tarjeta } from "@/shared/ui/estilos";
import { IconoAtras, IconoNeumatico } from "@/shared/ui/iconos";
import { Encabezado, Esqueleto } from "../../../encabezado";
import {
  ModalDesmontar,
  ModalMedir,
  ModalMontar,
  ModalPosiciones,
  ModalRotar,
} from "../../modales-neumatico";

export const metadata: Metadata = { title: "Neumáticos del equipo" };

export default function MapaPage({
  params,
}: PageProps<"/neumaticos/equipo/[id]">) {
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
        <Mapa params={params} />
      </Suspense>
    </>
  );
}

const pill = "rounded-full px-2.5 py-0.5 text-xs font-semibold";

async function Mapa({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const actor = await exigirAccesoEnPagina({
    accion: "leer",
    recurso: "neumaticos",
  });
  const r = await verEquipoNeumaticos(actor, id, await reposNeumaticos());
  if (!r.ok) {
    if (r.error.code === "NOT_FOUND") notFound();
    throw r.error;
  }
  const { equipo, posiciones, montadas, stock, motivos, plantillas, hoy } =
    r.value;
  const opera = puede(actor.rol, "crear", "neumaticos");
  const edita = puede(actor.rol, "editar", "neumaticos");
  const en = new Map(montadas.map((f) => [f.montaje?.posicionId, f]));
  const ocupantes = Object.fromEntries(
    montadas.map((f) => [f.montaje?.posicionId ?? "", f.codigo]),
  );
  const ejes = [...new Set(posiciones.map((p) => p.eje))].sort((a, b) => a - b);

  return (
    <>
      <Encabezado
        icono={IconoNeumatico}
        color="var(--mod-neumaticos)"
        titulo={<span className="font-mono">{equipo.codigo}</span>}
        descripcion={`Horómetro ${numero(equipo.horometro)} ${unidad(equipo.medidor)}`}
        acciones={
          <>
            {edita && (
              <ModalPosiciones
                equipoId={equipo.id}
                posiciones={posiciones}
                plantillas={plantillas}
              />
            )}
            {opera && montadas.length > 0 && (
              <ModalMedir
                equipoId={equipo.id}
                montadas={montadas}
                hoy={hoy}
                horometro={equipo.horometro}
              />
            )}
          </>
        }
      />

      {posiciones.length === 0 ? (
        <p className={`${tarjeta} px-5 py-12 text-center text-sm text-muted`}>
          Este equipo no tiene posiciones.{" "}
          {edita
            ? "Defínelas con el botón Posiciones (puedes partir de una plantilla)."
            : "Pide al planificador o supervisor que las defina."}
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {ejes.map((eje) => (
            <section key={eje} className={`${tarjeta} px-5 py-4`}>
              <p className="mb-3 text-[10px] font-semibold tracking-[0.13em] text-muted uppercase">
                Eje {eje}
              </p>
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {posiciones
                  .filter((p) => p.eje === eje)
                  .map((p) => {
                    const f = en.get(p.id);
                    return (
                      <li
                        key={p.id}
                        className="rounded-xl border border-border p-3"
                      >
                        <p className="font-mono text-[12px] text-muted">
                          {p.codigo}
                        </p>
                        {f ? (
                          <>
                            <Link
                              href={`/neumaticos/${f.id}`}
                              className="font-mono font-semibold hover:text-primary"
                            >
                              {f.codigo}
                            </Link>
                            <p className="mt-1 flex flex-wrap items-center gap-2 text-sm">
                              <span className="font-mono tabular-nums">
                                {mm(f.cocadaActual)}
                              </span>
                              {f.salud && (
                                <span
                                  className={`${pill} ${SALUD[f.salud].color}`}
                                >
                                  {SALUD[f.salud].texto}
                                </span>
                              )}
                              {f.irregular && (
                                <span
                                  className={`${pill} bg-warn-soft text-warn`}
                                >
                                  Irregular
                                </span>
                              )}
                            </p>
                            {opera && (
                              <div className="mt-3 flex flex-wrap gap-2">
                                <ModalRotar
                                  origen={p}
                                  posiciones={posiciones}
                                  ocupantes={ocupantes}
                                  hoy={hoy}
                                  horometro={equipo.horometro}
                                />
                                <ModalDesmontar
                                  fila={f}
                                  motivos={motivos}
                                  hoy={hoy}
                                />
                              </div>
                            )}
                          </>
                        ) : (
                          <>
                            <p className="text-sm text-muted">Libre</p>
                            {opera && (
                              <div className="mt-3">
                                <ModalMontar
                                  posicion={p}
                                  stock={stock}
                                  hoy={hoy}
                                  horometro={equipo.horometro}
                                />
                              </div>
                            )}
                          </>
                        )}
                      </li>
                    );
                  })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </>
  );
}

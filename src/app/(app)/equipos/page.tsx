import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { exigirAccesoEnPagina } from "@/modules/acceso/infrastructure/sesion";
import {
  listarEquipos,
  sanearBusqueda,
} from "@/modules/equipos/application/casos-uso";
import {
  ESTADOS_MOVILIZACION,
  ESTADOS_OPERATIVOS,
} from "@/modules/equipos/domain/equipo";
import { reposEquipos } from "@/modules/equipos/infrastructure";
import { COLOR_ESTADO, formatoHorometro } from "@/modules/equipos/ui/formato";
import { puede } from "@/modules/identidad/domain/permisos";
import { boton, campo, tarjeta } from "@/shared/ui/estilos";
import { IconoEquipo } from "@/shared/ui/iconos";
import { Paginacion, paginar, type ParamsUrl } from "@/shared/ui/paginacion";
import { Encabezado, Esqueleto } from "../encabezado";
import { ModalEquipo } from "./modales-equipo";
import { ModalImportar } from "./modal-importar";
import { opcionesEquipo } from "./opciones";

export const metadata: Metadata = { title: "Equipos" };

export default function EquiposPage({ searchParams }: PageProps<"/equipos">) {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col gap-6">
          <Esqueleto alto="h-16" />
          <Esqueleto alto="h-12" />
          <Esqueleto alto="h-72" />
        </div>
      }
    >
      <Contenido searchParams={searchParams} />
    </Suspense>
  );
}

const uno = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

async function Contenido({
  searchParams,
}: {
  searchParams: Promise<ParamsUrl>;
}) {
  const params = await searchParams;
  const actor = await exigirAccesoEnPagina({
    accion: "leer",
    recurso: "flota",
  });
  const inactivos = uno(params.vista) === "inactivos";
  const buscar = sanearBusqueda(uno(params.q));
  const gestiona = puede(actor.rol, "crear", "flota");

  const [r, opciones] = await Promise.all([
    listarEquipos(actor, { inactivos, buscar }, await reposEquipos()),
    gestiona ? opcionesEquipo(actor) : null,
  ]);
  if (!r.ok) throw r.error;
  const pag = paginar(r.value, params.pagina);
  const sinCategorias =
    opciones !== null && !opciones.categorias.some((c) => c.activo);

  const pestaña = (vista: "activos" | "inactivos", texto: string) => {
    const activa = (vista === "inactivos") === inactivos;
    return (
      <Link
        href={vista === "inactivos" ? "?vista=inactivos" : "?"}
        aria-current={activa ? "page" : undefined}
        className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
          activa ? "bg-primary-soft text-fg" : "text-muted hover:text-fg"
        }`}
      >
        {texto}
      </Link>
    );
  };

  return (
    <>
      <Encabezado
        icono={IconoEquipo}
        color="var(--mod-equipos)"
        titulo="Equipos"
        descripcion="La flota de tu empresa, su estado y su horómetro."
        acciones={
          opciones &&
          !sinCategorias && (
            <>
              <ModalImportar />
              <ModalEquipo
                categorias={opciones.categorias}
                ubicaciones={opciones.ubicaciones}
              />
            </>
          )
        }
      />

      {sinCategorias && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-warn/30 bg-warn-soft px-5 py-4 text-sm">
          <p>
            Para crear equipos primero necesitas al menos una{" "}
            <strong>categoría de equipo</strong> (ej. Volquete, Cargador
            frontal).
          </p>
          <Link
            href="/catalogos?c=categorias_equipo"
            className={boton.primario}
          >
            Crear categoría
          </Link>
        </div>
      )}

      <section className={`${tarjeta} overflow-hidden`}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4 sm:px-6">
          <nav
            aria-label="Vista"
            className="inline-flex rounded-lg border border-border p-1"
          >
            {pestaña("activos", "Flota activa")}
            {pestaña("inactivos", "Inactivos")}
          </nav>
          <form className="flex w-full gap-2 sm:w-auto" role="search">
            {inactivos && (
              <input type="hidden" name="vista" value="inactivos" />
            )}
            <label htmlFor="q" className="sr-only">
              Buscar equipo
            </label>
            <input
              id="q"
              name="q"
              type="search"
              maxLength={40}
              defaultValue={buscar ?? ""}
              placeholder="Código, marca o modelo"
              className={`${campo} sm:w-64`}
            />
            <button type="submit" className={boton.secundario}>
              Buscar
            </button>
          </form>
        </div>

        {r.value.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-muted">
            {buscar
              ? `Ningún equipo coincide con «${buscar}».`
              : inactivos
                ? "No hay equipos desmovilizados."
                : "Todavía no hay equipos en la flota."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[48rem] text-sm">
              <thead className="bg-surface-2/70 text-left">
                <tr>
                  {[
                    "Código",
                    "Categoría",
                    "Marca / modelo",
                    "Ubicación",
                    "Horómetro",
                    "Estado",
                  ].map((th) => (
                    <th
                      key={th}
                      className={`px-5 py-3 text-[10px] font-semibold tracking-[0.13em] text-muted uppercase ${
                        th === "Horómetro" ? "text-right" : ""
                      }`}
                    >
                      {th}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pag.items.map((e) => (
                  <tr
                    key={e.id}
                    className="transition-colors hover:bg-surface-2/50"
                  >
                    <td className="px-5 py-3">
                      <Link
                        href={`/equipos/${e.id}`}
                        className="font-mono font-semibold hover:text-primary"
                      >
                        {e.codigo}
                      </Link>
                    </td>
                    <td className="px-5 py-3">{e.categoria}</td>
                    <td className="px-5 py-3 text-muted">
                      {[e.marca, e.modelo].filter(Boolean).join(" ") || "—"}
                    </td>
                    <td className="px-5 py-3 text-muted">
                      {e.ubicacion ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-[12px] tabular-nums">
                      {formatoHorometro(e.horometroActual, e.tipoMedidor)}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${COLOR_ESTADO[e.estadoOperativo]}`}
                      >
                        {ESTADOS_OPERATIVOS[e.estadoOperativo]}
                      </span>
                      {e.estadoMovilizacion === "PENDIENTE" && (
                        <span className="ml-2 rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-semibold text-muted">
                          {ESTADOS_MOVILIZACION.PENDIENTE}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Paginacion
          param="pagina"
          params={params}
          pagina={pag.pagina}
          paginas={pag.paginas}
          total={pag.total}
        />
      </section>
    </>
  );
}

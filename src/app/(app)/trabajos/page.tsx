import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { exigirAccesoEnPagina } from "@/modules/acceso/infrastructure/sesion";
import { sanearBusqueda } from "@/modules/equipos/application/casos-uso";
import { puede } from "@/modules/identidad/domain/permisos";
import {
  listarTrabajos,
  opcionesTrabajo,
} from "@/modules/trabajos/application/casos-uso";
import type { VistaBandeja } from "@/modules/trabajos/application/repositorios";
import { atraso, ordenarBandeja } from "@/modules/trabajos/domain/bandeja";
import {
  CRITICIDADES,
  ESTADOS_BACKLOG,
} from "@/modules/trabajos/domain/backlog-estado";
import { reposTrabajos } from "@/modules/trabajos/infrastructure";
import {
  COLOR_CRITICIDAD,
  COLOR_ESTADO_BACKLOG,
} from "@/modules/trabajos/ui/formato";
import { hoyEn } from "@/shared/kernel/fechas";
import { boton, campo, tarjeta } from "@/shared/ui/estilos";
import { formatoFecha } from "@/shared/ui/formato";
import { IconoLlave } from "@/shared/ui/iconos";
import { Paginacion, paginar, type ParamsUrl } from "@/shared/ui/paginacion";
import { Encabezado, Esqueleto } from "../encabezado";
import { ModalBacklog } from "./modales-trabajo";

export const metadata: Metadata = { title: "Backlogs y OT" };

export default function TrabajosPage({ searchParams }: PageProps<"/trabajos">) {
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
      <Bandeja searchParams={searchParams} />
    </Suspense>
  );
}

const uno = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

const VISTAS: Record<VistaBandeja, string> = {
  abiertos: "Abiertos",
  validacion: "Por validar",
  completados: "Completados",
};

const esVista = (v: string | undefined): v is VistaBandeja =>
  v !== undefined && v in VISTAS;

async function Bandeja({ searchParams }: { searchParams: Promise<ParamsUrl> }) {
  const params = await searchParams;
  const actor = await exigirAccesoEnPagina({
    accion: "leer",
    recurso: "trabajos",
  });
  const v = uno(params.vista);
  const vista: VistaBandeja = esVista(v) ? v : "abiertos";
  const buscar = sanearBusqueda(uno(params.q));
  const crea = puede(actor.rol, "crear", "trabajos");
  const repos = await reposTrabajos();

  const [r, opciones] = await Promise.all([
    listarTrabajos(actor, { vista, buscar }, repos),
    crea ? opcionesTrabajo(actor, repos) : null,
  ]);
  if (!r.ok) throw r.error;
  if (opciones && !opciones.ok) throw opciones.error;
  const hoy = hoyEn("America/Lima");
  const pag = paginar(ordenarBandeja(r.value, hoy), params.pagina);
  const sinEquipos =
    opciones?.ok && !opciones.value.equipos.some((e) => e.movilizado);

  return (
    <>
      <Encabezado
        icono={IconoLlave}
        color="var(--mod-mantenimiento)"
        titulo="Backlogs y OT"
        descripcion="Trabajos correctivos: de la falla detectada a la validación con firma."
        acciones={
          opciones?.ok &&
          !sinEquipos && <ModalBacklog opciones={opciones.value} hoy={hoy} />
        }
      />

      {sinEquipos && (
        <p className="mb-6 rounded-xl border border-warn/30 bg-warn-soft px-5 py-4 text-sm">
          Para crear backlogs primero tiene que haber equipos movilizados en la
          flota.
        </p>
      )}

      <section className={`${tarjeta} overflow-hidden`}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4 sm:px-6">
          <nav
            aria-label="Vista"
            className="inline-flex rounded-lg border border-border p-1"
          >
            {(Object.keys(VISTAS) as VistaBandeja[]).map((clave) => (
              <Link
                key={clave}
                href={clave === "abiertos" ? "?" : `?vista=${clave}`}
                aria-current={vista === clave ? "page" : undefined}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  vista === clave
                    ? "bg-primary-soft text-fg"
                    : "text-muted hover:text-fg"
                }`}
              >
                {VISTAS[clave]}
              </Link>
            ))}
          </nav>
          <form className="flex w-full gap-2 sm:w-auto" role="search">
            {vista !== "abiertos" && (
              <input type="hidden" name="vista" value={vista} />
            )}
            <label htmlFor="q" className="sr-only">
              Buscar trabajo
            </label>
            <input
              id="q"
              name="q"
              type="search"
              maxLength={40}
              defaultValue={buscar ?? ""}
              placeholder="Código o componente"
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
              ? `Ningún trabajo coincide con «${buscar}».`
              : vista === "abiertos"
                ? "No hay trabajos abiertos."
                : vista === "validacion"
                  ? "Nada pendiente de validar."
                  : "Todavía no hay trabajos completados."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[48rem] text-sm">
              <thead className="bg-surface-2/70 text-left">
                <tr>
                  {[
                    "Código",
                    "Equipo",
                    "Componente",
                    "Criticidad",
                    "Estado",
                    "Programada",
                  ].map((th) => (
                    <th
                      key={th}
                      className="px-5 py-3 text-[10px] font-semibold tracking-[0.13em] text-muted uppercase"
                    >
                      {th}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pag.items.map((b) => {
                  const dias = atraso(b, hoy);
                  return (
                    <tr
                      key={b.id}
                      className="transition-colors hover:bg-surface-2/50"
                    >
                      <td className="px-5 py-3">
                        <Link
                          href={`/trabajos/${b.id}`}
                          className="font-mono font-semibold hover:text-primary"
                        >
                          {b.codigo}
                        </Link>
                      </td>
                      <td className="px-5 py-3 font-mono text-[12px]">
                        {b.equipo}
                      </td>
                      <td className="max-w-56 truncate px-5 py-3">
                        {b.componente}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${COLOR_CRITICIDAD[b.criticidad]}`}
                        >
                          {CRITICIDADES[b.criticidad]}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${COLOR_ESTADO_BACKLOG[b.estado]}`}
                        >
                          {ESTADOS_BACKLOG[b.estado]}
                        </span>
                        {b.devuelto && (
                          <span className="ml-2 rounded-full bg-bad-soft px-2.5 py-0.5 text-xs font-semibold text-bad">
                            Devuelto
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 tabular-nums">
                        {formatoFecha(b.fechaProgramada)}
                        {dias > 0 && (
                          <span className="block text-xs font-semibold text-bad">
                            {dias} {dias === 1 ? "día" : "días"} de atraso
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
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

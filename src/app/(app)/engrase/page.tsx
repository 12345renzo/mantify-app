import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { exigirAccesoEnPagina } from "@/modules/acceso/infrastructure/sesion";
import { listarEngrase } from "@/modules/engrase/application/casos-uso";
import {
  ESTADOS_ENGRASE,
  type EstadoEngrase,
} from "@/modules/engrase/domain/estado-engrase";
import { reposEngrase } from "@/modules/engrase/infrastructure";
import {
  ESTADO_ENGRASE,
  formatoNumero,
  formatoRestante,
} from "@/modules/engrase/ui/formato";
import { sanearBusqueda } from "@/modules/equipos/application/casos-uso";
import { puede } from "@/modules/identidad/domain/permisos";
import { boton, campo, tarjeta } from "@/shared/ui/estilos";
import { formatoFecha } from "@/shared/ui/formato";
import { IconoGota } from "@/shared/ui/iconos";
import { Paginacion, paginar, type ParamsUrl } from "@/shared/ui/paginacion";
import { Encabezado, Esqueleto } from "../encabezado";
import { ModalAviso, ModalPlan, ModalRegistrar } from "./modales-engrase";

export const metadata: Metadata = { title: "Engrase" };

export default function EngrasePage({ searchParams }: PageProps<"/engrase">) {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col gap-6">
          <Esqueleto alto="h-16" />
          <Esqueleto alto="h-24" />
          <Esqueleto alto="h-72" />
        </div>
      }
    >
      <Lista searchParams={searchParams} />
    </Suspense>
  );
}

const uno = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const esEstado = (v: string | undefined): v is EstadoEngrase =>
  ESTADOS_ENGRASE.some((e) => e === v);
const pill = "rounded-full px-2.5 py-0.5 text-xs font-semibold";

async function Lista({ searchParams }: { searchParams: Promise<ParamsUrl> }) {
  const params = await searchParams;
  const actor = await exigirAccesoEnPagina({
    accion: "leer",
    recurso: "engrase",
  });
  const r = await listarEngrase(actor, await reposEngrase());
  if (!r.ok) throw r.error;
  const { filas, grasas, aviso, hoy } = r.value;
  const registra = puede(actor.rol, "crear", "engrase");
  const planifica = puede(actor.rol, "editar", "engrase");
  // Solo el planificador ve el botón; la base rechaza a cualquier otro rol.
  const configuraAviso = puede(actor.rol, "editar", "aviso_engrase");

  const e = uno(params.estado);
  const estado = esEstado(e) ? e : null;
  const buscar = sanearBusqueda(uno(params.q));
  const visibles = filas.filter(
    (f) =>
      (!estado || f.estado === estado) &&
      (!buscar || f.codigo.toLowerCase().includes(buscar.toLowerCase())),
  );
  const pag = paginar(visibles, params.pagina);
  const url = (est: EstadoEngrase | null) => {
    const q = new URLSearchParams();
    if (est) q.set("estado", est);
    if (buscar) q.set("q", buscar);
    return q.size ? `?${q}` : "?";
  };

  return (
    <>
      <Encabezado
        icono={IconoGota}
        color="var(--mod-engrase)"
        titulo="Engrase"
        descripcion="Estado de lubricación de cada equipo según su plan y el aviso de la empresa."
        acciones={configuraAviso && <ModalAviso aviso={aviso} />}
      />

      <nav
        aria-label="Filtrar por estado"
        className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
      >
        {ESTADOS_ENGRASE.map((est) => {
          const n = filas.filter((f) => f.estado === est).length;
          const activo = estado === est;
          return (
            <Link
              key={est}
              href={url(activo ? null : est)}
              aria-current={activo ? "true" : undefined}
              className={`${tarjeta} px-5 py-4 transition-colors hover:border-border-strong ${activo ? "ring-2 ring-primary" : ""}`}
            >
              <p
                className={`font-mono text-2xl font-semibold tabular-nums ${n ? ESTADO_ENGRASE[est].indicador : "text-muted"}`}
              >
                {n}
              </p>
              <p className="text-sm text-muted">{ESTADO_ENGRASE[est].texto}</p>
            </Link>
          );
        })}
      </nav>

      <section className={`${tarjeta} overflow-hidden`}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4 sm:px-6">
          <p className="text-sm text-muted">
            {estado
              ? `Mostrando: ${ESTADO_ENGRASE[estado].texto.toLowerCase()}`
              : "Todos los equipos que se engrasan"}
          </p>
          <form className="flex w-full gap-2 sm:w-auto" role="search">
            {estado && <input type="hidden" name="estado" value={estado} />}
            <label htmlFor="q" className="sr-only">
              Buscar equipo
            </label>
            <input
              id="q"
              name="q"
              type="search"
              maxLength={40}
              defaultValue={buscar ?? ""}
              placeholder="Código del equipo"
              className={`${campo} sm:w-56`}
            />
            <button type="submit" className={boton.secundario}>
              Buscar
            </button>
          </form>
        </div>

        {visibles.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-muted">
            {filas.length === 0
              ? "No hay equipos que requieran engrase. Se marca en Equipos → editar equipo."
              : "Ningún equipo coincide con el filtro."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[44rem] text-sm">
              <thead className="bg-surface-2/70 text-left">
                <tr>
                  {[
                    "Equipo",
                    "Estado",
                    "Le falta",
                    "Último engrase completo",
                    ...(registra || planifica ? ["Acciones"] : []),
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
                {pag.items.map((f) => (
                  <tr
                    key={f.id}
                    className="transition-colors hover:bg-surface-2/50"
                  >
                    <td className="px-5 py-3">
                      <Link
                        href={`/engrase/${f.id}`}
                        className="font-mono font-semibold hover:text-primary"
                      >
                        {f.codigo}
                      </Link>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`${pill} ${ESTADO_ENGRASE[f.estado].color}`}
                      >
                        {ESTADO_ENGRASE[f.estado].texto}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-mono text-[12px] tabular-nums">
                      {formatoRestante(f)}
                    </td>
                    <td className="px-5 py-3 tabular-nums">
                      {f.ultimoCompleto ? (
                        <>
                          {formatoFecha(f.ultimoCompleto.fecha)}
                          <span className="ml-2 font-mono text-[12px] text-muted">
                            {formatoNumero(f.ultimoCompleto.horometro)}
                          </span>
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    {(registra || planifica) && (
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-2">
                          {planifica && <ModalPlan fila={f} grasas={grasas} />}
                          {registra && (
                            <ModalRegistrar
                              fila={f}
                              grasas={grasas}
                              hoy={hoy}
                            />
                          )}
                        </div>
                      </td>
                    )}
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

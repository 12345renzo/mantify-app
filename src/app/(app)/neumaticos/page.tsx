import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { exigirAccesoEnPagina } from "@/modules/acceso/infrastructure/sesion";
import { puede } from "@/modules/identidad/domain/permisos";
import { listarNeumaticos } from "@/modules/neumaticos/application/casos-uso";
import { SALUDES, type Salud } from "@/modules/neumaticos/domain/salud";
import { reposNeumaticos } from "@/modules/neumaticos/infrastructure";
import {
  costoUnidad,
  ESTADO_NEUMATICO,
  mm,
  moneda,
  SALUD,
} from "@/modules/neumaticos/ui/formato";
import { tarjeta } from "@/shared/ui/estilos";
import { IconoNeumatico } from "@/shared/ui/iconos";
import { Paginacion, paginar, type ParamsUrl } from "@/shared/ui/paginacion";
import { Encabezado, Esqueleto } from "../encabezado";
import {
  ModalCubierta,
  ModalRecapar,
  ModalUmbrales,
} from "./modales-neumatico";

export const metadata: Metadata = { title: "Neumáticos" };

export default function NeumaticosPage({
  searchParams,
}: PageProps<"/neumaticos">) {
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
const pill = "rounded-full px-2.5 py-0.5 text-xs font-semibold";
const VISTAS = {
  montadas: "Montadas",
  stock: "Stock",
  otros: "Recapado y baja",
} as const;
type Vista = keyof typeof VISTAS;
const th =
  "px-5 py-3 text-[10px] font-semibold tracking-[0.13em] text-muted uppercase";
const td = "px-5 py-3";

async function Lista({ searchParams }: { searchParams: Promise<ParamsUrl> }) {
  const params = await searchParams;
  const actor = await exigirAccesoEnPagina({
    accion: "leer",
    recurso: "neumaticos",
  });
  const r = await listarNeumaticos(actor, await reposNeumaticos());
  if (!r.ok) throw r.error;
  const { filas, umbrales, equipos, categorias, veCostos } = r.value;
  const edita = puede(actor.rol, "editar", "neumaticos");
  // Solo el planificador ve el botón; la base rechaza a cualquier otro rol.
  const configura = puede(actor.rol, "editar", "umbrales_neumaticos");

  const v = uno(params.vista);
  const vista: Vista = v === "stock" || v === "otros" ? v : "montadas";
  const s = uno(params.salud);
  const salud = SALUDES.find((x) => x === s) ?? null;
  const montadas = filas.filter((f) => f.salud !== null);
  const visibles = filas.filter((f) =>
    vista === "montadas"
      ? f.salud !== null && (!salud || f.salud === salud)
      : vista === "stock"
        ? f.estado === "STOCK"
        : f.estado === "RECAPADO" || f.estado === "BAJA",
  );
  const pag = paginar(visibles, params.pagina);
  const conSalud = (x: Salud | null) => (x ? `?salud=${x}` : "?");

  return (
    <>
      <Encabezado
        icono={IconoNeumatico}
        color="var(--mod-neumaticos)"
        titulo="Neumáticos"
        descripcion="Cubiertas por posición, salud según los umbrales y costo por hora."
        acciones={
          <>
            {configura && (
              <ModalUmbrales
                umbrales={umbrales}
                categorias={categorias}
                equipos={equipos}
              />
            )}
            {edita && <ModalCubierta />}
          </>
        }
      />

      {configura && umbrales.length === 0 && (
        <p className="mb-6 rounded-xl border border-warn/30 bg-warn-soft px-5 py-4 text-sm">
          Sin umbrales, las cubiertas montadas salen «sin umbral». Defínelos por
          categoría con el botón Umbrales.
        </p>
      )}

      <nav
        aria-label="Filtrar por salud"
        className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
      >
        {SALUDES.map((x) => {
          const n = montadas.filter((f) => f.salud === x).length;
          const activo = vista === "montadas" && salud === x;
          return (
            <Link
              key={x}
              href={conSalud(activo ? null : x)}
              aria-current={activo ? "true" : undefined}
              className={`${tarjeta} px-5 py-4 transition-colors hover:border-border-strong ${activo ? "ring-2 ring-primary" : ""}`}
            >
              <p
                className={`font-mono text-2xl font-semibold tabular-nums ${n ? SALUD[x].indicador : "text-muted"}`}
              >
                {n}
              </p>
              <p className="text-sm text-muted">{SALUD[x].texto}</p>
            </Link>
          );
        })}
      </nav>

      {equipos.length > 0 && (
        <section className={`${tarjeta} mb-6 px-5 py-4`}>
          <p className="mb-2 text-sm font-semibold">Mapa por equipo</p>
          <div className="flex flex-wrap gap-2">
            {equipos.map((e) => (
              <Link
                key={e.id}
                href={`/neumaticos/equipo/${e.id}`}
                className="rounded-lg border border-border px-2.5 py-1 font-mono text-[12px] hover:border-border-strong hover:text-primary"
              >
                {e.codigo}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className={`${tarjeta} overflow-hidden`}>
        <div className="border-b border-border px-5 py-4 sm:px-6">
          <nav
            aria-label="Vista"
            className="inline-flex rounded-lg border border-border p-1"
          >
            {(Object.keys(VISTAS) as Vista[]).map((k) => (
              <Link
                key={k}
                href={k === "montadas" ? "?" : `?vista=${k}`}
                aria-current={vista === k ? "page" : undefined}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${vista === k ? "bg-primary-soft text-fg" : "text-muted hover:text-fg"}`}
              >
                {VISTAS[k]}
              </Link>
            ))}
          </nav>
        </div>

        {visibles.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-muted">
            {vista === "stock"
              ? "No hay cubiertas en stock."
              : vista === "otros"
                ? "No hay cubiertas en recapado ni de baja."
                : "No hay cubiertas montadas con ese filtro."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[46rem] text-sm">
              <thead className="bg-surface-2/70 text-left">
                <tr>
                  <th className={th}>Cubierta</th>
                  <th className={th}>
                    {vista === "montadas"
                      ? "Equipo · posición"
                      : "Marca · medida"}
                  </th>
                  <th className={th}>Cocada</th>
                  <th className={th}>
                    {vista === "montadas" ? "Salud" : "Estado"}
                  </th>
                  {veCostos && (
                    <th className={th}>
                      {vista === "montadas" ? "Costo por hora" : "Costo"}
                    </th>
                  )}
                  {edita && vista !== "montadas" && (
                    <th className={th}>Acciones</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pag.items.map((f) => (
                  <tr
                    key={f.id}
                    className="transition-colors hover:bg-surface-2/50"
                  >
                    <td className={td}>
                      <Link
                        href={`/neumaticos/${f.id}`}
                        className="font-mono font-semibold hover:text-primary"
                      >
                        {f.codigo}
                      </Link>
                    </td>
                    <td className={td}>
                      {f.montaje ? (
                        <Link
                          href={`/neumaticos/equipo/${f.montaje.equipoId}`}
                          className="font-mono text-[12px] hover:text-primary"
                        >
                          {f.montaje.equipoCodigo} · {f.montaje.posicionCodigo}
                        </Link>
                      ) : (
                        <span>
                          {f.marca} · {f.medida}
                        </span>
                      )}
                    </td>
                    <td className={`${td} font-mono text-[12px] tabular-nums`}>
                      {mm(f.cocadaActual)}
                      {f.irregular && (
                        <span className={`ml-2 ${pill} bg-warn-soft text-warn`}>
                          Irregular
                        </span>
                      )}
                    </td>
                    <td className={td}>
                      {f.salud ? (
                        <span className={`${pill} ${SALUD[f.salud].color}`}>
                          {SALUD[f.salud].texto}
                        </span>
                      ) : (
                        <span className="text-muted">
                          {ESTADO_NEUMATICO[f.estado]}
                          {f.recapados > 0 && ` · ${f.recapados} recap.`}
                        </span>
                      )}
                    </td>
                    {veCostos && (
                      <td className={`${td} tabular-nums`}>
                        {f.montaje
                          ? costoUnidad(f.costoPorHora, f.montaje.medidor)
                          : moneda(f.costo)}
                      </td>
                    )}
                    {edita && vista !== "montadas" && (
                      <td className={td}>
                        <div className="flex justify-end gap-2">
                          {f.estado === "RECAPADO" && <ModalRecapar fila={f} />}
                          {f.estado === "STOCK" && <ModalCubierta fila={f} />}
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

import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { exigirAccesoEnPagina } from "@/modules/acceso/infrastructure/sesion";
import { listarCatalogo } from "@/modules/catalogos/application/casos-uso";
import {
  CATALOGOS,
  CODIGOS_CATALOGO,
  esCatalogo,
  type Campo,
  type CodigoCatalogo,
  type Valores,
} from "@/modules/catalogos/domain/catalogos";
import { reposCatalogos } from "@/modules/catalogos/infrastructure";
import { BotonActivo, ModalElemento } from "./modales-catalogo";
import { puede } from "@/modules/identidad/domain/permisos";
import { tarjeta } from "@/shared/ui/estilos";
import { IconoCatalogo } from "@/shared/ui/iconos";
import { Paginacion, paginar, type ParamsUrl } from "@/shared/ui/paginacion";
import { Encabezado, Esqueleto } from "../encabezado";

export const metadata: Metadata = { title: "Catálogos" };

export default function CatalogosPage({
  searchParams,
}: PageProps<"/catalogos">) {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col gap-6">
          <Esqueleto alto="h-16" />
          <Esqueleto alto="h-12" />
          <Esqueleto alto="h-64" />
        </div>
      }
    >
      <Contenido searchParams={searchParams} />
    </Suspense>
  );
}

async function Contenido({
  searchParams,
}: {
  searchParams: Promise<ParamsUrl>;
}) {
  const params = await searchParams;
  const actor = await exigirAccesoEnPagina({
    accion: "leer",
    recurso: "catalogos",
  });
  // Un valor raro en la URL cae en el primer catálogo.
  const catalogo: CodigoCatalogo = esCatalogo(params.c)
    ? params.c
    : CODIGOS_CATALOGO[0];
  const def = CATALOGOS[catalogo];
  const repos = await reposCatalogos();
  const usaCategoria = def.campos.some((c) => c.tipo === "categoria");
  const [r, cats] = await Promise.all([
    listarCatalogo(actor, catalogo, repos),
    usaCategoria
      ? listarCatalogo(actor, "categorias_equipo", repos)
      : Promise.resolve(null),
  ]);
  if (!r.ok) throw r.error;
  if (cats && !cats.ok) throw cats.error;
  const nombreCategoria = new Map(
    (cats?.value ?? []).map((c) => [c.id, String(c.valores.nombre)]),
  );
  const categorias = (cats?.value ?? []).map((c) => ({
    id: c.id,
    nombre: String(c.valores.nombre),
    activo: c.activo,
  }));
  const gestiona = puede(actor.rol, "crear", "catalogos");
  const pag = paginar(r.value, params.pagina);
  const mostrar = (c: Campo, v: Valores): string => {
    const x = v[c.clave];
    if (c.tipo === "categoria") {
      return x ? (nombreCategoria.get(String(x)) ?? "—") : "Todas";
    }
    if (x === null || x === undefined) return "—";
    if (typeof x === "boolean") return x ? "Sí" : "No";
    if (c.tipo === "opciones") return c.opciones[String(x)] ?? String(x);
    return String(x);
  };
  const campos = [
    ...def.campos.filter((c) => c.clave === def.principal),
    ...def.campos.filter((c) => c.clave !== def.principal),
  ];

  return (
    <>
      <Encabezado
        icono={IconoCatalogo}
        color="var(--mod-catalogos)"
        titulo="Catálogos"
        descripcion="Listas de tu empresa que usan los formularios. Cambiarlas no afecta a otras empresas."
        acciones={
          gestiona && (
            <ModalElemento catalogo={catalogo} categorias={categorias} />
          )
        }
      />

      <nav
        aria-label="Catálogos"
        className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6"
      >
        {CODIGOS_CATALOGO.map((c) => (
          <Link
            key={c}
            href={`?c=${c}`}
            aria-current={c === catalogo ? "page" : undefined}
            className={`flex min-h-11 items-center justify-center rounded-lg border px-3 py-2 text-center text-sm leading-tight font-medium text-balance transition-colors ${
              c === catalogo
                ? "border-primary bg-primary-soft text-fg"
                : "border-border bg-surface text-muted hover:text-fg"
            }`}
          >
            {CATALOGOS[c].titulo}
          </Link>
        ))}
      </nav>

      <section className={`${tarjeta} overflow-hidden`}>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-base font-semibold tracking-[-0.02em]">
              {def.titulo}
            </h2>
            <p className="mt-0.5 text-sm text-muted">{def.descripcion}</p>
          </div>
          <span className="rounded-full border border-border bg-surface-2/60 px-2.5 py-1 font-mono text-[10px] text-muted tabular-nums">
            {r.value.length}
          </span>
        </div>
        {r.value.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-muted">
            Todavía no hay elementos.
            {gestiona && " Crea el primero con «Nuevo»."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[36rem] text-sm">
              <thead className="bg-surface-2/70 text-left">
                <tr>
                  {campos.map((c) => (
                    <th
                      key={c.clave}
                      className="px-5 py-3 text-[10px] font-semibold tracking-[0.13em] text-muted uppercase"
                    >
                      {c.etiqueta}
                    </th>
                  ))}
                  <th className="px-5 py-3 text-[10px] font-semibold tracking-[0.13em] text-muted uppercase">
                    Estado
                  </th>
                  {gestiona && (
                    <th className="px-5 py-3 text-right text-[10px] font-semibold tracking-[0.13em] text-muted uppercase">
                      Acciones
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pag.items.map((e) => (
                  <tr
                    key={e.id}
                    className={`transition-colors hover:bg-surface-2/50 ${e.activo ? "" : "text-muted"}`}
                  >
                    {campos.map((c, i) => (
                      <td
                        key={c.clave}
                        className={`px-5 py-3 ${
                          i === 0 ? "font-medium" : "text-muted"
                        } ${c.tipo === "texto" && c.largo ? "font-mono text-[11px] whitespace-pre-line" : ""}`}
                      >
                        {mostrar(c, e.valores)}
                      </td>
                    ))}
                    <td className="px-5 py-3">
                      {e.activo ? (
                        <span className="rounded-full bg-ok-soft px-2.5 py-0.5 text-xs font-semibold text-ok">
                          Activo
                        </span>
                      ) : (
                        <span className="rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-semibold text-muted">
                          Inactivo
                        </span>
                      )}
                    </td>
                    {gestiona && (
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-4">
                          <ModalElemento
                            catalogo={catalogo}
                            elemento={e}
                            categorias={categorias}
                          />
                          <BotonActivo catalogo={catalogo} elemento={e} />
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

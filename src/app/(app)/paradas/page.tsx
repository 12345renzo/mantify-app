import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { exigirAccesoEnPagina } from "@/modules/acceso/infrastructure/sesion";
import { sanearBusqueda } from "@/modules/equipos/application/casos-uso";
import { puede } from "@/modules/identidad/domain/permisos";
import {
  opcionesParada,
  rankingParadas,
  reporteParadas,
} from "@/modules/paradas/application/casos-uso";
import { fechaUrl } from "@/modules/paradas/application/esquemas";
import {
  COLUMNAS_DIARIO,
  filaDiario,
} from "@/modules/paradas/application/reportes";
import { ahoraEn } from "@/modules/paradas/domain/duracion";
import { reposParadas } from "@/modules/paradas/infrastructure";
import { programa } from "@/modules/preventivos/domain/preventivo-estado";
import { hoyEn } from "@/shared/kernel/fechas";
import { boton, campo, tarjeta } from "@/shared/ui/estilos";
import { formatoFecha } from "@/shared/ui/formato";
import { IconoParada } from "@/shared/ui/iconos";
import { Encabezado, Esqueleto } from "../encabezado";
import { ModalImportar, ModalIniciar } from "./modales-parada";

export const metadata: Metadata = { title: "Paradas" };

export default function ParadasPage({ searchParams }: PageProps<"/paradas">) {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col gap-6">
          <Esqueleto alto="h-16" />
          <Esqueleto alto="h-72" />
        </div>
      }
    >
      <Contenido searchParams={searchParams} />
    </Suspense>
  );
}

type Params = Record<string, string | string[] | undefined>;
const uno = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

const VISTAS = {
  abiertas: "Abiertas",
  diario: "Reporte diario",
  ranking: "Ranking de fallas",
} as const;
type Vista = keyof typeof VISTAS;

const nf = new Intl.NumberFormat("es-PE", { maximumFractionDigits: 2 });
const th =
  "px-4 py-3 text-[10px] font-semibold tracking-[0.13em] text-muted uppercase";
const td = "px-4 py-2.5";

async function Contenido({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const actor = await exigirAccesoEnPagina({
    accion: "leer",
    recurso: "trabajos",
  });
  const v = uno(params.vista);
  const vista: Vista = v && v in VISTAS ? (v as Vista) : "abiertas";
  // Fecha y hora del servidor en la zona de Perú: el reloj del cliente no decide.
  const hoy = hoyEn("America/Lima");
  const ahora = ahoraEn("America/Lima");
  const repos = await reposParadas();
  const registra = puede(actor.rol, "crear", "trabajos");
  const opciones = registra ? await opcionesParada(actor, repos) : null;
  if (opciones && !opciones.ok) throw opciones.error;

  return (
    <>
      <Encabezado
        icono={IconoParada}
        color="var(--mod-paradas)"
        titulo="Paradas"
        descripcion="Inicio y cierre de paradas, reporte diario, Excel mensual y ranking de fallas."
        acciones={
          opciones?.ok && (
            <>
              {programa(actor.rol) && <ModalImportar />}
              <ModalIniciar opciones={opciones.value} ahora={ahora} />
            </>
          )
        }
      />

      <nav
        aria-label="Vista"
        className="mb-6 inline-flex rounded-lg border border-border bg-surface p-1"
      >
        {(Object.keys(VISTAS) as Vista[]).map((clave) => (
          <Link
            key={clave}
            href={clave === "abiertas" ? "?" : `?vista=${clave}`}
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

      {vista === "abiertas" && <Abiertas hoy={hoy} />}
      {vista === "diario" && <Diario params={params} hoy={hoy} />}
      {vista === "ranking" && <Ranking params={params} hoy={hoy} />}
    </>
  );
}

async function Abiertas({ hoy }: { hoy: string }) {
  const actor = await exigirAccesoEnPagina({
    accion: "leer",
    recurso: "trabajos",
  });
  const r = await reporteParadas(
    actor,
    { desde: hoy, hasta: hoy, abiertas: true },
    await reposParadas(),
  );
  if (!r.ok) throw r.error;
  const abiertas = r.value.filter((p) => p.estado === "ABIERTA");
  return (
    <section className={`${tarjeta} overflow-hidden`}>
      {abiertas.length === 0 ? (
        <p className="px-5 py-12 text-center text-sm text-muted">
          No hay equipos parados en este momento.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[44rem] text-sm">
            <thead className="bg-surface-2/70 text-left">
              <tr>
                {[
                  "Código",
                  "Equipo",
                  "Motivo",
                  "Desde",
                  "Horómetro",
                  "Responsable",
                ].map((t) => (
                  <th key={t} className={th}>
                    {t}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {abiertas.map((p) => (
                <tr key={p.id} className="hover:bg-surface-2/50">
                  <td className={td}>
                    <Link
                      href={`/paradas/${p.id}`}
                      className="font-mono font-semibold hover:text-primary"
                    >
                      {p.codigo}
                    </Link>
                  </td>
                  <td className={`${td} font-mono text-[12px]`}>{p.equipo}</td>
                  <td className={td}>
                    {p.motivoCodigo}
                    {!p.esPlanificado && (
                      <span className="ml-2 rounded-full bg-bad-soft px-2 py-0.5 text-xs font-semibold text-bad">
                        No planificada
                      </span>
                    )}
                  </td>
                  <td className={`${td} tabular-nums`}>
                    {p.inicio.replace("T", " ")}
                  </td>
                  <td className={`${td} font-mono text-[12px] tabular-nums`}>
                    {nf.format(p.horometroInicio)}
                  </td>
                  <td className={`${td} max-w-40 truncate`}>{p.responsable}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

async function Diario({ params, hoy }: { params: Params; hoy: string }) {
  const actor = await exigirAccesoEnPagina({
    accion: "leer",
    recurso: "trabajos",
  });
  const f = fechaUrl.safeParse(uno(params.fecha));
  const fecha = f.success && f.data <= hoy ? f.data : hoy;
  const buscar = sanearBusqueda(uno(params.q))?.toLowerCase() ?? null;
  const tipo = uno(params.tipo);
  const r = await reporteParadas(
    actor,
    { desde: fecha, hasta: fecha },
    await reposParadas(),
  );
  if (!r.ok) throw r.error;
  const filas = r.value.filter(
    (p) =>
      (tipo !== "no" || !p.esPlanificado) &&
      (tipo !== "si" || p.esPlanificado) &&
      (!buscar ||
        [p.codigo, p.equipo, p.motivoCodigo, p.responsable, p.descripcion ?? ""]
          .join(" ")
          .toLowerCase()
          .includes(buscar)),
  );
  const horas = filas.reduce((s, p) => s + (p.duracionHoras ?? 0), 0);

  return (
    <section className={`${tarjeta} overflow-hidden`}>
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border px-5 py-4 sm:px-6">
        <form className="flex flex-wrap items-end gap-2" role="search">
          <input type="hidden" name="vista" value="diario" />
          <label className="text-xs text-muted">
            Día
            <input
              name="fecha"
              type="date"
              max={hoy}
              defaultValue={fecha}
              className={`${campo} mt-1`}
            />
          </label>
          <label className="text-xs text-muted">
            Tipo
            <select
              name="tipo"
              defaultValue={tipo ?? ""}
              className={`${campo} mt-1`}
            >
              <option value="">Todas</option>
              <option value="no">No planificadas</option>
              <option value="si">Planificadas</option>
            </select>
          </label>
          <label className="text-xs text-muted">
            Buscar
            <input
              name="q"
              type="search"
              maxLength={40}
              defaultValue={uno(params.q) ?? ""}
              placeholder="Código, equipo, tarea…"
              className={`${campo} mt-1 sm:w-56`}
            />
          </label>
          <button type="submit" className={boton.secundario}>
            Ver
          </button>
        </form>
        <div className="flex flex-wrap items-end gap-2">
          <a
            href={`/api/paradas/diario?fecha=${fecha}`}
            className={boton.secundario}
            download
          >
            PDF del día
          </a>
          <form action="/api/paradas/mensual" className="flex items-end gap-2">
            <label className="text-xs text-muted">
              Mes
              <input
                name="mes"
                type="month"
                max={hoy.slice(0, 7)}
                defaultValue={fecha.slice(0, 7)}
                className={`${campo} mt-1`}
              />
            </label>
            <button type="submit" className={boton.secundario}>
              Excel mensual
            </button>
          </form>
        </div>
      </div>
      <p className="px-5 py-3 text-sm text-muted sm:px-6">
        {formatoFecha(fecha)} · {filas.length}{" "}
        {filas.length === 1 ? "intervención" : "intervenciones"} ·{" "}
        {nf.format(horas)} h paradas
        {filas.length !== r.value.length && ` (de ${r.value.length} del día)`}
      </p>
      {filas.length === 0 ? (
        <p className="px-5 py-12 text-center text-sm text-muted">
          Sin paradas para este día y filtro.
        </p>
      ) : (
        <div className="overflow-x-auto border-t border-border">
          <table className="w-full min-w-[64rem] text-sm">
            <thead className="bg-surface-2/70 text-left">
              <tr>
                {COLUMNAS_DIARIO.map((c) => (
                  <th key={c.titulo} className={th}>
                    {c.titulo}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filas.map((p) => (
                <tr key={p.id} className="hover:bg-surface-2/50">
                  {filaDiario(p).map((celda, i) => (
                    <td
                      key={i}
                      className={`${td} ${i === 9 ? "max-w-64 truncate" : "whitespace-nowrap"}`}
                    >
                      {i === 0 ? (
                        <Link
                          href={`/paradas/${p.id}`}
                          className="font-mono font-semibold hover:text-primary"
                        >
                          {celda}
                        </Link>
                      ) : (
                        celda
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

async function Ranking({ params, hoy }: { params: Params; hoy: string }) {
  const actor = await exigirAccesoEnPagina({
    accion: "leer",
    recurso: "trabajos",
  });
  const d = fechaUrl.safeParse(uno(params.desde));
  const h = fechaUrl.safeParse(uno(params.hasta));
  const hasta = h.success && h.data <= hoy ? h.data : hoy;
  const desde = d.success && d.data <= hasta ? d.data : `${hoy.slice(0, 7)}-01`;
  const r = await rankingParadas(actor, { desde, hasta }, await reposParadas());
  return (
    <section className={`${tarjeta} overflow-hidden`}>
      <form
        className="flex flex-wrap items-end gap-2 border-b border-border px-5 py-4 sm:px-6"
        role="search"
      >
        <input type="hidden" name="vista" value="ranking" />
        <label className="text-xs text-muted">
          Desde
          <input
            name="desde"
            type="date"
            max={hoy}
            defaultValue={desde}
            className={`${campo} mt-1`}
          />
        </label>
        <label className="text-xs text-muted">
          Hasta
          <input
            name="hasta"
            type="date"
            max={hoy}
            defaultValue={hasta}
            className={`${campo} mt-1`}
          />
        </label>
        <button type="submit" className={boton.secundario}>
          Ver
        </button>
        <p className="ml-auto self-center text-xs text-muted">
          Paradas no planificadas (MCI y otras). Máximo un año.
        </p>
      </form>
      {!r.ok ? (
        <p className="px-5 py-12 text-center text-sm text-bad">
          El periodo no es válido: máximo 366 días.
        </p>
      ) : r.value.length === 0 ? (
        <p className="px-5 py-12 text-center text-sm text-muted">
          Ninguna parada no planificada en el periodo.
        </p>
      ) : (
        <table className="w-full text-sm">
          <thead className="bg-surface-2/70 text-left">
            <tr>
              {["#", "Equipo", "Fallas", "Horas paradas"].map((t) => (
                <th key={t} className={th}>
                  {t}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {r.value.map((f, i) => (
              <tr key={f.equipoId}>
                <td className={`${td} font-mono text-muted`}>{i + 1}</td>
                <td className={`${td} font-mono font-semibold`}>{f.equipo}</td>
                <td className={`${td} tabular-nums`}>{f.fallas}</td>
                <td className={`${td} tabular-nums`}>{nf.format(f.horas)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

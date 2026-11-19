import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { exigirAccesoEnPagina } from "@/modules/acceso/infrastructure/sesion";
import {
  listarPreventivos,
  opcionesPreventivo,
} from "@/modules/preventivos/application/casos-uso";
import {
  ESTADOS_PREVENTIVO,
  programa,
} from "@/modules/preventivos/domain/preventivo-estado";
import { situacion } from "@/modules/preventivos/domain/vencimiento";
import { reposPreventivos } from "@/modules/preventivos/infrastructure";
import {
  COLOR_ESTADO_PREVENTIVO,
  SITUACION,
} from "@/modules/preventivos/ui/formato";
import { hoyEn } from "@/shared/kernel/fechas";
import { tarjeta } from "@/shared/ui/estilos";
import { formatoFecha } from "@/shared/ui/formato";
import { IconoCalendario } from "@/shared/ui/iconos";
import { Paginacion, paginar, type ParamsUrl } from "@/shared/ui/paginacion";
import { Encabezado, Esqueleto } from "../encabezado";
import { ModalImportar, ModalProgramar } from "./modales-preventivo";

export const metadata: Metadata = { title: "Preventivos" };

export default function PreventivosPage({
  searchParams,
}: PageProps<"/preventivos">) {
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

const VISTAS = {
  pendientes: "Por ejecutar",
  validacion: "Por validar",
  validados: "Validados",
} as const;
type Vista = keyof typeof VISTAS;
const esVista = (v: string | undefined): v is Vista =>
  v !== undefined && v in VISTAS;

const EN_VISTA: Record<Vista, string[]> = {
  pendientes: ["PROGRAMADO", "DEVUELTO"],
  validacion: ["COMPLETADO"],
  validados: ["VALIDADO"],
};

const pill = "rounded-full px-2.5 py-0.5 text-xs font-semibold";
const nf = new Intl.NumberFormat("es-PE");

async function Lista({ searchParams }: { searchParams: Promise<ParamsUrl> }) {
  const params = await searchParams;
  const actor = await exigirAccesoEnPagina({
    accion: "leer",
    recurso: "trabajos",
  });
  const v = uno(params.vista);
  const vista: Vista = esVista(v) ? v : "pendientes";
  const repos = await reposPreventivos();
  const planifica = programa(actor.rol);
  const [r, opciones] = await Promise.all([
    listarPreventivos(actor, repos),
    planifica ? opcionesPreventivo(actor, repos) : null,
  ]);
  if (!r.ok) throw r.error;
  if (opciones && !opciones.ok) throw opciones.error;
  // Fecha del servidor en hora de Perú (como la bandeja de trabajos): el reloj del cliente no decide.
  const hoy = hoyEn("America/Lima");

  const filas = r.value.map((p) => ({
    ...p,
    situacion: situacion(p, hoy, p.horometroActual),
  }));
  const cuenta = (f: (x: (typeof filas)[number]) => boolean) =>
    filas.filter(f).length;
  const indicadores = [
    {
      texto: "Vencidos",
      valor: cuenta((p) => p.situacion === "VENCIDO"),
      color: "text-bad",
    },
    {
      texto: "Próximos (7 días u horómetro)",
      valor: cuenta((p) => p.situacion === "ALERTA"),
      color: "text-warn",
    },
    {
      texto: "Devueltos",
      valor: cuenta((p) => p.estado === "DEVUELTO"),
      color: "text-bad",
    },
    {
      texto: "Por validar",
      valor: cuenta((p) => p.estado === "COMPLETADO"),
      color: "text-primary",
    },
  ];
  // Vencidos y devueltos primero; luego por fecha.
  const PESO = { VENCIDO: 0, ALERTA: 1, AL_DIA: 2 } as const;
  const enVista = filas
    .filter((p) => EN_VISTA[vista].includes(p.estado))
    .sort((a, b) =>
      vista === "pendientes"
        ? Number(b.estado === "DEVUELTO") - Number(a.estado === "DEVUELTO") ||
          PESO[a.situacion ?? "AL_DIA"] - PESO[b.situacion ?? "AL_DIA"] ||
          a.fechaProgramada.localeCompare(b.fechaProgramada)
        : b.fechaProgramada.localeCompare(a.fechaProgramada),
    );
  const pag = paginar(enVista, params.pagina);

  return (
    <>
      <Encabezado
        icono={IconoCalendario}
        color="var(--mod-preventivos)"
        titulo="Preventivos"
        descripcion="PM1 a PM4: alerta 7 días antes o al acercarse al horómetro, ejecución y validación."
        acciones={
          opciones?.ok && (
            <>
              <ModalImportar />
              <ModalProgramar opciones={opciones.value} hoy={hoy} />
            </>
          )
        }
      />

      {opciones?.ok && opciones.value.planes.length === 0 && (
        <p className="mb-6 rounded-xl border border-warn/30 bg-warn-soft px-5 py-4 text-sm">
          Para programar, primero crea los nombres de plan en Catálogos → Planes
          preventivos (y sus actividades en Catálogos → Actividades).
        </p>
      )}

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {indicadores.map((i) => (
          <div key={i.texto} className={`${tarjeta} px-5 py-4`}>
            <p
              className={`font-mono text-2xl font-semibold tabular-nums ${i.valor ? i.color : "text-muted"}`}
            >
              {i.valor}
            </p>
            <p className="text-sm text-muted">{i.texto}</p>
          </div>
        ))}
      </div>

      <section className={`${tarjeta} overflow-hidden`}>
        <div className="border-b border-border px-5 py-4 sm:px-6">
          <nav
            aria-label="Vista"
            className="inline-flex rounded-lg border border-border p-1"
          >
            {(Object.keys(VISTAS) as Vista[]).map((clave) => (
              <Link
                key={clave}
                href={clave === "pendientes" ? "?" : `?vista=${clave}`}
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
        </div>

        {enVista.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-muted">
            {vista === "pendientes"
              ? "No hay preventivos por ejecutar."
              : vista === "validacion"
                ? "Nada pendiente de validar."
                : "Todavía no hay preventivos validados."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[52rem] text-sm">
              <thead className="bg-surface-2/70 text-left">
                <tr>
                  {[
                    "Código",
                    "Equipo",
                    "Plan",
                    "Programado",
                    "Horómetro",
                    "Responsable",
                    "Estado",
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
                {pag.items.map((p) => (
                  <tr
                    key={p.id}
                    className="transition-colors hover:bg-surface-2/50"
                  >
                    <td className="px-5 py-3">
                      <Link
                        href={`/preventivos/${p.id}`}
                        className="font-mono font-semibold hover:text-primary"
                      >
                        {p.codigo}
                      </Link>
                    </td>
                    <td className="px-5 py-3 font-mono text-[12px]">
                      {p.equipo}
                    </td>
                    <td className="max-w-48 truncate px-5 py-3">
                      {p.plan}{" "}
                      <span className="font-mono text-xs text-muted">
                        {p.tipo}
                      </span>
                    </td>
                    <td className="px-5 py-3 tabular-nums">
                      {formatoFecha(p.fechaProgramada)}
                      {p.situacion && p.situacion !== "AL_DIA" && (
                        <span
                          className={`ml-2 ${pill} ${SITUACION[p.situacion].color}`}
                        >
                          {SITUACION[p.situacion].texto}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 font-mono text-[12px] tabular-nums">
                      {p.horometroProgramado === null
                        ? "—"
                        : nf.format(p.horometroProgramado)}
                      {p.horometroActual !== null && (
                        <span className="block text-muted">
                          actual {nf.format(p.horometroActual)}
                        </span>
                      )}
                    </td>
                    <td className="max-w-40 truncate px-5 py-3">
                      {p.responsable}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`${pill} ${COLOR_ESTADO_PREVENTIVO[p.estado]}`}
                      >
                        {ESTADOS_PREVENTIVO[p.estado]}
                      </span>
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

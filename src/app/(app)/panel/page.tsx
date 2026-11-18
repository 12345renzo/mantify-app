import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { exigirSuperadminEnPagina } from "@/modules/acceso/infrastructure/sesion";
import { listarEmpresas } from "@/modules/plataforma/application/consultas";
import type { EstadoMembresia } from "@/modules/plataforma/domain/estado-membresia";
import { reposPlataforma } from "@/modules/plataforma/infrastructure";
import { ESTADO_UI, EstadoPill } from "@/modules/plataforma/ui/estado-pill";
import { diasEntre, hoyEn } from "@/shared/kernel/fechas";
import { tarjeta } from "@/shared/ui/estilos";
import { formatoFecha } from "@/shared/ui/formato";
import {
  IconoActividad,
  IconoAlerta,
  IconoCheckCirculo,
  IconoEmpresa,
  IconoEscudoAlerta,
  IconoFlecha,
  IconoPanel,
  IconoReloj,
  IconoSalirArriba,
} from "@/shared/ui/iconos";
import { Encabezado, Esqueleto } from "../encabezado";
import {
  BotonNuevaEmpresa,
  BotonNuevaEmpresaCargando,
} from "../empresas/boton-nueva-empresa";
import { Modulos } from "../modulos";

export const metadata: Metadata = { title: "Panel" };

export default function PanelPage() {
  return (
    <>
      <Encabezado
        icono={IconoPanel}
        color="var(--mod-plataforma)"
        titulo="Panel"
        descripcion="Estado de las empresas y sus membresías."
        acciones={
          <Suspense fallback={<BotonNuevaEmpresaCargando />}>
            <BotonNuevaEmpresa />
          </Suspense>
        }
      />
      <Suspense
        fallback={
          <div className="flex flex-col gap-6">
            <Esqueleto alto="h-36" />
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
              {[0, 1, 2, 3].map((i) => (
                <Esqueleto key={i} alto="h-36" />
              ))}
            </div>
            <Esqueleto alto="h-64" />
          </div>
        }
      >
        <ResumenEmpresas />
      </Suspense>
      <Modulos rol="SUPERADMIN" />
    </>
  );
}

const ESTADOS_RESUMEN: {
  estado: EstadoMembresia;
  ayuda: string;
  tono: string;
  icono: typeof IconoCheckCirculo;
}[] = [
  {
    estado: "AL_DIA",
    ayuda: "Más de 7 días de membresía",
    tono: "var(--ok)",
    icono: IconoCheckCirculo,
  },
  {
    estado: "POR_VENCER",
    ayuda: "Vencen en 7 días o menos",
    tono: "var(--warn)",
    icono: IconoReloj,
  },
  {
    estado: "EN_GRACIA",
    ayuda: "Vencidas, dentro de la gracia",
    tono: "var(--grace)",
    icono: IconoAlerta,
  },
  {
    estado: "VENCIDA",
    ayuda: "Pasó la gracia: desactivar",
    tono: "var(--bad)",
    icono: IconoEscudoAlerta,
  },
];

const LEYENDA: { estado: EstadoMembresia; tono: string }[] = [
  ...ESTADOS_RESUMEN.map(({ estado, tono }) => ({ estado, tono })),
  { estado: "INACTIVA", tono: "var(--muted)" },
];

async function ResumenEmpresas() {
  const actor = await exigirSuperadminEnPagina();
  const { lector } = await reposPlataforma();
  const r = await listarEmpresas(actor, lector);
  if (!r.ok) throw r.error;
  const empresas = r.value;
  const hoy = hoyEn("America/Lima");

  const conteo = (e: EstadoMembresia) =>
    empresas.filter((x) => x.estado === e).length;
  const total = empresas.length;
  const proporcion = (n: number) => (total ? (n / total) * 100 : 0);
  const atencion = empresas
    .filter(
      (e) =>
        e.estado === "POR_VENCER" ||
        e.estado === "EN_GRACIA" ||
        e.estado === "VENCIDA",
    )
    .sort((a, b) => (a.fechaFin ?? "").localeCompare(b.fechaFin ?? ""));

  return (
    <div className="flex flex-col gap-6">
      {/* Lectura rápida de la cartera: total y reparto por estado. */}
      <section
        className={`${tarjeta} relative overflow-hidden`}
        aria-label="Resumen de la cartera"
      >
        <div
          className="reticula pointer-events-none absolute inset-0 text-fg opacity-[0.045]"
          style={{
            maskImage:
              "radial-gradient(ellipse at 12% 0%, black 4%, transparent 62%)",
          }}
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -top-24 -right-10 size-72 rounded-full opacity-40 blur-2xl"
          style={{
            background:
              "radial-gradient(circle, color-mix(in srgb, var(--primary) 22%, transparent), transparent 70%)",
          }}
          aria-hidden="true"
        />

        <div className="relative flex flex-wrap items-center gap-x-8 gap-y-6 p-5 sm:p-6">
          <div className="min-w-[10rem]">
            <p className="flex items-center gap-2 text-[9.5px] font-semibold tracking-[0.16em] text-muted uppercase">
              <IconoActividad width={13} height={13} className="text-primary" />
              Cartera total
            </p>
            <p className="cifra mt-2 text-[3rem] leading-none font-semibold">
              {total}
            </p>
            <p className="mt-1.5 text-xs text-muted">
              {total === 1 ? "empresa registrada" : "empresas registradas"}
            </p>
          </div>

          <span
            className="hidden h-14 w-px bg-border sm:block"
            aria-hidden="true"
          />

          <div className="min-w-[16rem] flex-1">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <p className="text-[9.5px] font-semibold tracking-[0.16em] text-muted uppercase">
                Distribución de membresías
              </p>
              <p className="font-mono text-[10px] text-muted/80 tabular-nums">
                {conteo("AL_DIA")} / {total} al día
              </p>
            </div>

            <div
              className="mt-3 flex h-2.5 overflow-hidden rounded-full bg-surface-2 ring-1 ring-inset ring-border/60"
              aria-hidden="true"
            >
              {total > 0 &&
                LEYENDA.map(({ estado, tono }) => {
                  const n = conteo(estado);
                  if (n === 0) return null;
                  return (
                    <span
                      key={estado}
                      className="h-full first:rounded-l-full last:rounded-r-full"
                      style={{
                        width: `${proporcion(n)}%`,
                        backgroundColor: tono,
                      }}
                    />
                  );
                })}
            </div>

            <ul className="mt-3.5 flex flex-wrap gap-x-4 gap-y-1.5">
              {LEYENDA.map(({ estado, tono }) => (
                <li
                  key={estado}
                  className="flex items-center gap-1.5 text-[11px] text-muted"
                >
                  <span
                    className="size-1.5 rounded-full"
                    style={{ backgroundColor: tono }}
                    aria-hidden="true"
                  />
                  {ESTADO_UI[estado].etiqueta}
                  <span className="font-mono text-[10px] text-fg/70 tabular-nums">
                    {conteo(estado)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section aria-label="Empresas por estado">
        <div className="mb-3 flex items-end justify-between gap-3">
          <h2 className="text-[11px] font-semibold tracking-[0.16em] text-muted uppercase">
            Membresías por estado
          </h2>
          <span className="font-mono text-[9.5px] tracking-[0.08em] text-muted/60 uppercase">
            Corte actual
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          {ESTADOS_RESUMEN.map(({ estado, ayuda, tono, icono: Icono }) => {
            const n = conteo(estado);
            return (
              <div
                key={estado}
                className={`${tarjeta} group relative overflow-hidden p-4 transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-border-strong hover:shadow-[var(--shadow-pop)]`}
              >
                <div
                  className="pointer-events-none absolute -top-10 -right-8 size-24 rounded-full opacity-25 blur-2xl transition-opacity group-hover:opacity-40"
                  style={{ backgroundColor: tono }}
                  aria-hidden="true"
                />

                <div className="relative flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.06em] text-muted uppercase">
                      <span
                        className="size-1.5 rounded-full"
                        style={{ backgroundColor: tono }}
                        aria-hidden="true"
                      />
                      {ESTADO_UI[estado].etiqueta}
                    </p>
                    <p className="cifra mt-2.5 text-[2.25rem] leading-none font-semibold">
                      {n}
                    </p>
                  </div>
                  <span
                    className="grid size-9 shrink-0 place-items-center rounded-xl ring-1 ring-inset ring-border/70"
                    style={{
                      color: tono,
                      backgroundColor: `color-mix(in srgb, ${tono} 11%, transparent)`,
                    }}
                  >
                    <Icono width={17} height={17} />
                  </span>
                </div>

                <p className="relative mt-2 text-[11px] leading-snug text-muted">
                  {ayuda}
                </p>

                <div className="relative mt-3 flex items-center gap-2">
                  <div
                    className="h-1 flex-1 overflow-hidden rounded-full bg-surface-2"
                    aria-hidden="true"
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${proporcion(n)}%`,
                        backgroundColor: tono,
                      }}
                    />
                  </div>
                  <span className="font-mono text-[9.5px] text-muted/70 tabular-nums">
                    {Math.round(proporcion(n))}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className={`${tarjeta} overflow-hidden`}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3.5">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-warn-soft text-warn ring-1 ring-inset ring-warn/15">
              <IconoAlerta width={19} height={19} />
            </span>
            <div>
              <h2 className="text-base font-semibold tracking-[-0.025em]">
                Requieren atención
              </h2>
              <p className="mt-0.5 text-sm text-muted">
                {total} {total === 1 ? "empresa" : "empresas"} en total ·{" "}
                {conteo("INACTIVA")}{" "}
                {conteo("INACTIVA") === 1 ? "inactiva" : "inactivas"}
              </p>
            </div>
          </div>
          <Link
            href="/empresas"
            className="group inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold shadow-[0_1px_2px_rgb(6_36_26/0.04)] transition-colors hover:border-border-strong hover:bg-surface-2"
          >
            Ver todas
            <IconoFlecha
              width={15}
              height={15}
              className="transition-transform group-hover:translate-x-0.5"
            />
          </Link>
        </div>

        {empresas.length === 0 ? (
          <div className="flex flex-col items-center px-5 py-14 text-center">
            <span className="relative grid size-14 place-items-center rounded-2xl bg-primary-soft text-primary ring-1 ring-inset ring-primary/15">
              <span
                className="absolute inset-0 rounded-2xl opacity-40 blur-lg"
                style={{ backgroundColor: "var(--primary)" }}
                aria-hidden="true"
              />
              <IconoEmpresa className="relative" width={24} height={24} />
            </span>
            <p className="mt-4 font-semibold">Todavía no hay empresas</p>
            <p className="mt-1 max-w-sm text-sm text-muted">
              Crea la primera con su RUC y registra su pago para que quede al
              día.
            </p>
            <div className="mt-5">
              <BotonNuevaEmpresa texto="Crear empresa" />
            </div>
          </div>
        ) : atencion.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-muted">
            Ninguna empresa vence en los próximos 7 días.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {atencion.map((e) => {
              const dias = e.fechaFin ? diasEntre(hoy, e.fechaFin) : 0;
              return (
                <li key={e.id}>
                  <Link
                    href={`/empresas/${e.id}`}
                    className="group flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3.5 transition-colors hover:bg-surface-2/60 sm:px-6"
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-border bg-surface-2/70 font-mono text-[11px] font-semibold text-muted uppercase transition-colors group-hover:border-primary/25 group-hover:bg-primary-soft/50 group-hover:text-primary">
                      {e.nombre.slice(0, 2)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium tracking-tight group-hover:text-primary">
                        {e.nombre}
                      </span>
                      <span className="font-mono text-[11px] text-muted">
                        RUC {e.ruc}
                      </span>
                    </span>
                    <span className="text-xs text-muted sm:text-sm">
                      <span className="tabular-nums">
                        {dias >= 0
                          ? dias === 0
                            ? "Vence hoy"
                            : `Vence en ${dias} ${dias === 1 ? "día" : "días"}`
                          : `Venció hace ${-dias} ${dias === -1 ? "día" : "días"}`}
                      </span>
                      {" · "}
                      <span className="tabular-nums">
                        {formatoFecha(e.fechaFin)}
                      </span>
                    </span>
                    <EstadoPill estado={e.estado} />
                    <IconoSalirArriba
                      width={15}
                      height={15}
                      className="hidden text-muted/40 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary sm:block"
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

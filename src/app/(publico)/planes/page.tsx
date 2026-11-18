import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { leerPlanesActivos } from "@/modules/plataforma/infrastructure/lector-plataforma";
import { createSupabasePublicClient } from "@/shared/supabase/publico";
import { CambiarTema } from "@/shared/ui/cambiar-tema";
import { boton, tarjeta } from "@/shared/ui/estilos";
import { formatoMoneda } from "@/shared/ui/formato";
import {
  IconoAtras,
  IconoCheck,
  IconoChispa,
  IconoPago,
  IconoReloj,
  IconoEscudo,
} from "@/shared/ui/iconos";
import { Logo } from "@/shared/ui/logo";

export const metadata: Metadata = { title: "Planes" };

// Funciones de cada plan según la propuesta (sección 0). Pro incluye todo lo de Estándar.
const FUNCIONES: Record<string, { resumen: string; funciones: string[] }> = {
  ESTANDAR: {
    resumen: "Todo el mantenimiento de la flota en línea.",
    funciones: [
      "Equipos, movilización y horómetro",
      "Backlogs con OT, RM, RQ, firma y validación",
      "Preventivos PM1 a PM4 con alerta a 7 días",
      "Paradas, reporte diario y mensual, importación Excel",
      "Engrase con puntos editables",
      "Neumáticos: medidas, cocadas, montajes y rotaciones",
      "Dashboard por rol y ranking de fallas",
      "Exportaciones PDF, Excel y respaldo JSON",
    ],
  },
  PRO: {
    resumen: "Para operaciones en mina o campo, con análisis.",
    funciones: [
      "Todo lo de Estándar",
      "Funciona sin señal y sincroniza al volver",
      "Disponibilidad mecánica, MTTR y MTBF",
      "Pareto de fallas y demora por repuestos",
      "Análisis de turnos día y noche",
      "Fecha sugerida de preventivo por promedio de horas",
      "Plan de acción y análisis de mejoras",
    ],
  },
};

const GARANTIAS = [
  { icono: IconoReloj, texto: "30 días por pago" },
  { icono: IconoEscudo, texto: "3 días de gracia" },
  { icono: IconoCheck, texto: "Sin tarjeta" },
];

export default function PlanesPage() {
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-20 border-b border-border/80 bg-bg/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6 lg:px-8">
          <Link href="/login" aria-label="Ir al inicio de sesión">
            <Logo />
          </Link>
          <div className="flex items-center gap-2">
            <CambiarTema />
            <Link href="/login" className={boton.secundario}>
              Ingresar
            </Link>
          </div>
        </div>
      </header>

      <main className="relative overflow-hidden">
        <div
          className="reticula pointer-events-none absolute inset-x-0 top-0 h-[34rem] text-fg opacity-[0.07]"
          style={{
            maskImage:
              "radial-gradient(ellipse at 50% 0%, black 8%, transparent 68%)",
          }}
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -top-40 left-1/2 size-[38rem] -translate-x-1/2 rounded-full opacity-35 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, color-mix(in srgb, var(--lime) 22%, transparent), transparent 68%)",
          }}
          aria-hidden="true"
        />

        <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="inline-flex items-center gap-2.5 rounded-full border border-border bg-surface px-3 py-1 font-mono text-[10px] tracking-[0.16em] text-muted uppercase shadow-[0_1px_2px_rgb(6_36_26/0.04)]">
              <span
                className="size-1.5 rounded-full bg-[var(--lime)] shadow-[0_0_8px_var(--lime)]"
                aria-hidden="true"
              />
              Planes
            </p>
            <h1 className="mt-5 text-[2.1rem] leading-[1.04] font-semibold tracking-[-0.05em] text-balance sm:text-[3rem]">
              Un precio por empresa,
              <br className="hidden sm:block" />{" "}
              <span className="text-primary">sin límite de equipos</span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-muted">
              Elige según cómo trabaja tu flota. Puedes cambiar de plan cuando
              lo necesites.
            </p>
          </div>

          <div className="mx-auto mt-8 flex max-w-2xl flex-wrap items-center justify-center gap-2">
            {GARANTIAS.map(({ icono: Icono, texto }) => (
              <span
                key={texto}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface/80 px-3 py-1.5 text-xs font-medium text-muted shadow-[0_1px_2px_rgb(6_36_26/0.03)]"
              >
                <Icono width={13} height={13} className="text-primary" />
                {texto}
              </span>
            ))}
          </div>

          <Suspense fallback={<TarjetasCargando />}>
            <TarjetasPlanes />
          </Suspense>

          <div
            className={`${tarjeta} mx-auto mt-10 flex max-w-3xl flex-col items-start gap-4 p-5 sm:flex-row sm:items-center sm:p-6`}
          >
            <span className="relative grid size-11 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary ring-1 ring-inset ring-primary/15">
              <IconoPago width={20} height={20} />
            </span>
            <div className="flex-1 text-sm">
              <p className="font-semibold tracking-[-0.01em]">
                Pago mensual por transferencia
              </p>
              <p className="mt-1 leading-relaxed text-muted">
                Sin tarjeta. Cada pago cubre 30 días y tienes 3 días de gracia
                si se te pasa la fecha. Nuestro equipo da de alta tu empresa con
                su RUC al confirmar la transferencia.
              </p>
            </div>
            <span className="rounded-full border border-border bg-surface-2/70 px-2.5 py-1 font-mono text-[9.5px] tracking-[0.08em] text-muted uppercase">
              Facturado por empresa
            </span>
          </div>

          <div className="mt-10 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-muted transition-colors hover:bg-surface-2 hover:text-fg"
            >
              <IconoAtras width={16} height={16} />
              Volver a ingresar
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

async function TarjetasPlanes() {
  // Precio vivo desde la base en cada visita; no se congela en el build.
  await connection();
  const planes = await leerPlanesActivos(createSupabasePublicClient());

  return (
    <div className="mx-auto mt-12 grid max-w-4xl items-stretch gap-5 md:grid-cols-2 lg:gap-6">
      {planes.map((plan) => {
        const destacado = plan.codigo === "PRO";
        const info = FUNCIONES[plan.codigo];
        return (
          <section
            key={plan.id}
            className={`relative flex flex-col overflow-hidden rounded-[var(--radius-panel)] border p-6 transition-[transform,box-shadow] duration-300 sm:p-7 ${
              destacado
                ? "border-[var(--fuerte-border)] text-[var(--fuerte-fg)] shadow-[var(--shadow-pop)] md:-translate-y-2"
                : "border-border bg-surface shadow-[var(--shadow-card)]"
            }`}
            style={
              destacado
                ? {
                    backgroundImage:
                      "linear-gradient(165deg, var(--fuerte-1) 0%, var(--fuerte-2) 58%, var(--fuerte-3) 100%)",
                  }
                : undefined
            }
          >
            {destacado && (
              <>
                <div
                  className="reticula pointer-events-none absolute inset-0 text-[var(--fuerte-fg)] opacity-[0.05]"
                  style={{
                    maskImage:
                      "radial-gradient(ellipse at 70% 0%, black 4%, transparent 65%)",
                  }}
                  aria-hidden="true"
                />
                <div
                  className="pointer-events-none absolute -top-24 -right-16 size-64 rounded-full opacity-50 blur-2xl"
                  style={{
                    background:
                      "radial-gradient(circle, color-mix(in srgb, var(--fuerte-accent) 22%, transparent), transparent 70%)",
                  }}
                  aria-hidden="true"
                />
                <span
                  className="absolute inset-x-0 top-0 h-[3px]"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent, var(--fuerte-top-1) 35%, var(--fuerte-top-2) 70%, transparent)",
                  }}
                  aria-hidden="true"
                />
              </>
            )}
            {!destacado && (
              <span
                className="absolute inset-x-0 top-0 h-[3px] bg-border"
                aria-hidden="true"
              />
            )}

            <div className="relative mb-6 flex min-h-6 items-center justify-between gap-2">
              {destacado ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--fuerte-badge-bg)] px-2.5 py-1 font-mono text-[9px] font-semibold tracking-[0.1em] text-[var(--fuerte-badge-fg)] uppercase">
                  <IconoChispa width={11} height={11} />
                  Recomendado para mina
                </span>
              ) : (
                <span className="font-mono text-[9.5px] tracking-[0.12em] text-muted uppercase">
                  Pago mensual
                </span>
              )}
              <span
                className={`rounded-full border px-2 py-0.5 font-mono text-[9px] font-semibold tracking-[0.08em] uppercase ${
                  destacado
                    ? "border-[var(--fuerte-line)] bg-[var(--fuerte-chip)] text-[var(--fuerte-muted)]"
                    : "border-border bg-surface-2/60 text-muted"
                }`}
              >
                {plan.codigo}
              </span>
            </div>

            <div className="relative">
              <h2 className="text-lg font-semibold tracking-[-0.03em]">
                {plan.nombre}
              </h2>
              {info && (
                <p
                  className={`mt-1 text-sm ${
                    destacado ? "text-[var(--fuerte-muted)]" : "text-muted"
                  }`}
                >
                  {info.resumen}
                </p>
              )}
            </div>

            <p className="relative mt-7 flex items-baseline gap-1.5">
              <span className="cifra text-[2.7rem] leading-none font-semibold">
                {formatoMoneda(plan.precioMensual, plan.moneda)}
              </span>
              <span
                className={`font-mono text-[11px] ${
                  destacado ? "text-[var(--fuerte-muted)]" : "text-muted"
                }`}
              >
                / mes
              </span>
            </p>
            <p
              className={`relative mt-2 text-xs ${
                destacado ? "text-[var(--fuerte-muted)]" : "text-muted"
              }`}
            >
              {plan.maxAccesos
                ? `${plan.maxAccesos} accesos incluidos`
                : "Accesos sin límite"}
            </p>

            <ul
              className={`relative mt-6 flex flex-1 flex-col gap-3 border-t pt-6 text-sm ${
                destacado ? "border-[var(--fuerte-line)]" : "border-border"
              }`}
            >
              {(info?.funciones ?? []).map((f) => (
                <li key={f} className="flex gap-3">
                  <span
                    className={`mt-px grid size-[18px] shrink-0 place-items-center rounded-full ${
                      destacado
                        ? "bg-[var(--fuerte-accent-soft)] text-[var(--fuerte-accent)]"
                        : "bg-primary-soft text-primary"
                    }`}
                  >
                    <IconoCheck width={11} height={11} />
                  </span>
                  <span className="leading-snug">{f}</span>
                </li>
              ))}
            </ul>

            <div className="relative mt-7">
              <Link
                href="/login"
                className={
                  destacado
                    ? "sombra-cta-fuerte inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--fuerte-cta)] px-4 py-2.5 text-sm font-semibold tracking-tight text-[var(--fuerte-cta-fg)] transition-[background-color,transform] hover:bg-[var(--fuerte-cta-hover)] active:translate-y-px"
                    : `${boton.secundario} w-full`
                }
              >
                Empezar con {plan.nombre}
              </Link>
            </div>
          </section>
        );
      })}
    </div>
  );
}

function TarjetasCargando() {
  return (
    <div
      className="mx-auto mt-12 grid max-w-4xl gap-5 md:grid-cols-2 lg:gap-6"
      aria-busy="true"
    >
      {[0, 1].map((i) => (
        <div
          key={i}
          className={`${tarjeta} h-[32rem] animate-pulse bg-surface-2/70`}
        />
      ))}
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CambiarTema } from "@/shared/ui/cambiar-tema";
import {
  IconoCalendario,
  IconoCandado,
  IconoEquipo,
  IconoFlecha,
  IconoLlave,
  IconoReloj,
} from "@/shared/ui/iconos";
import { Logo } from "@/shared/ui/logo";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Ingresar" };

// El panel de marca sigue al tema: los puntos cambian de señal para mantener contraste.
const PUNTOS = [
  {
    icono: IconoEquipo,
    color: "var(--fuerte-point-1)",
    titulo: "Equipos y horómetro",
    texto: "Toda la flota con su estado y horas al día.",
  },
  {
    icono: IconoLlave,
    color: "var(--fuerte-point-2)",
    titulo: "Backlogs, OT y RM con firma",
    texto: "Del reporte de falla al cierre validado.",
  },
  {
    icono: IconoCalendario,
    color: "var(--fuerte-point-3)",
    titulo: "Preventivos PM1 a PM4",
    texto: "Alerta 7 días antes de cada servicio.",
  },
];

export default function LoginPage() {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1.06fr)_minmax(0,1fr)]">
      {/* Panel de marca: porcelana verde de día, verde profundo de noche. */}
      <aside
        className="grano relative hidden overflow-hidden border-r border-[var(--fuerte-border)] text-[var(--fuerte-fg)] lg:flex lg:flex-col lg:justify-between lg:p-10 xl:p-14"
        style={{
          backgroundImage:
            "linear-gradient(160deg, var(--fuerte-1) 0%, var(--fuerte-2) 55%, var(--fuerte-3) 100%)",
        }}
      >
        <div
          className="reticula pointer-events-none absolute inset-0 text-[var(--fuerte-fg)] opacity-[0.06]"
          style={{
            maskImage:
              "radial-gradient(ellipse at 24% 30%, black 8%, transparent 70%)",
          }}
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -top-40 -right-28 size-[34rem] rounded-full opacity-60 blur-2xl"
          style={{
            background:
              "radial-gradient(circle, color-mix(in srgb, var(--fuerte-bar-1) 28%, transparent), transparent 68%)",
          }}
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-40 -left-24 size-[30rem] rounded-full opacity-45 blur-2xl"
          style={{
            background:
              "radial-gradient(circle, color-mix(in srgb, var(--fuerte-accent) 18%, transparent), transparent 70%)",
          }}
          aria-hidden="true"
        />

        <div className="relative flex items-start justify-between gap-6">
          <Logo className="[--logo-bg:var(--fuerte-cta)] [--logo-dot:var(--fuerte-logo-dot)] [--logo-fg:var(--fuerte-cta-fg)] [--logo-ring:var(--fuerte-2)]" />
          <span className="mt-1 rounded-full border border-[var(--fuerte-line)] bg-[var(--fuerte-chip)] px-2.5 py-1 font-mono text-[9px] tracking-[0.16em] text-[var(--fuerte-muted)] uppercase">
            MTTO · 2026
          </span>
        </div>

        <div className="relative max-w-lg">
          <p className="flex items-center gap-3 font-mono text-[10px] tracking-[0.2em] text-[var(--fuerte-accent)] uppercase">
            <span
              className="h-px w-8 bg-[var(--fuerte-accent)] opacity-60"
              aria-hidden="true"
            />
            Control de mantenimiento
          </p>
          <h1 className="mt-5 text-[2.2rem] leading-[1.03] font-semibold tracking-[-0.05em] text-balance xl:text-[2.9rem]">
            Tu flota en orden,
            <span className="text-[var(--fuerte-accent)]">
              {" "}
              de la falla al cierre.
            </span>
          </h1>
          <p className="mt-4 max-w-md text-[14.5px] leading-relaxed text-[var(--fuerte-muted)]">
            Mantify ordena el mantenimiento de equipos pesados: horómetros,
            órdenes de trabajo, preventivos y paradas en un solo lugar.
          </p>
          <ul className="mt-7 flex flex-col gap-0.5">
            {PUNTOS.map(({ icono: Icono, color, titulo, texto }, i) => (
              <li
                key={titulo}
                className="flex items-center gap-4 rounded-xl border border-transparent py-3 transition-colors hover:border-[var(--fuerte-line)] hover:bg-[var(--fuerte-chip)]"
              >
                <span
                  className="grid size-9 shrink-0 place-items-center rounded-lg border border-[var(--fuerte-line)] bg-[var(--fuerte-chip)]"
                  style={{ color }}
                >
                  <Icono width={18} height={18} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">{titulo}</span>
                  <span className="text-[13px] text-[var(--fuerte-muted)]">
                    {texto}
                  </span>
                </span>
                <span className="font-mono text-[10px] text-[var(--fuerte-muted)]">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Ejemplo de cómo se ve un equipo en la app. */}
        <div className="relative max-w-md">
          <div className="rounded-2xl border border-[var(--fuerte-line)] bg-[var(--fuerte-chip)] p-4 backdrop-blur">
            <div className="flex items-center gap-3.5">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-[var(--fuerte-line)] bg-[var(--fuerte-accent-soft)] text-[var(--fuerte-accent)]">
                <IconoEquipo width={19} height={19} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  Excavadora CAT 320D · EX-07
                </p>
                <p className="font-mono text-[11px] text-[var(--fuerte-muted)]">
                  Horómetro 12 482 h · PM2 en 18 h
                </p>
              </div>
              <span className="hidden rounded-full border border-[var(--fuerte-line)] bg-[var(--fuerte-accent-soft)] px-2.5 py-0.5 text-[10px] font-semibold tracking-wide text-[var(--fuerte-accent)] uppercase sm:block">
                Por vencer
              </span>
            </div>

            <div className="mt-3.5 flex items-end gap-[3px]" aria-hidden="true">
              {[42, 58, 48, 70, 62, 78, 66, 86, 74, 92, 82, 100].map(
                (alto, i) => (
                  <span
                    key={i}
                    className="h-5 flex-1 rounded-[2px] bg-[var(--fuerte-accent)]"
                    style={{
                      height: `${(alto / 100) * 22}px`,
                      opacity: 0.18 + i * 0.06,
                    }}
                  />
                ),
              )}
            </div>
          </div>
          <p className="mt-3 flex items-center justify-between gap-2 font-mono text-[9.5px] tracking-[0.14em] text-[var(--fuerte-muted)] uppercase">
            <span className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-[var(--fuerte-accent)]" />
              Vista de flota en tiempo real
            </span>
            <span>API · DB</span>
          </p>
        </div>
      </aside>

      <main className="relative flex flex-col px-4 py-5 sm:px-8 lg:px-12">
        <div className="flex items-center justify-between lg:justify-end">
          <Logo className="lg:hidden" />
          <CambiarTema />
        </div>

        <div className="mx-auto flex w-full max-w-[25rem] flex-1 flex-col justify-center py-10 lg:py-14">
          <div className="filete rounded-[var(--radius-panel)] border border-border bg-surface p-6 shadow-[var(--shadow-card)] sm:p-8">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-2/70 px-2.5 py-1 font-mono text-[9.5px] tracking-[0.14em] text-muted uppercase">
              <IconoCandado width={12} height={12} className="text-primary" />
              Acceso privado
            </span>

            <h2 className="mt-4 text-[1.7rem] leading-tight font-semibold tracking-[-0.045em]">
              Ingresa a Mantify
            </h2>
            <p className="mt-1.5 text-sm text-muted">
              Usa el correo y la contraseña de tu cuenta.
            </p>

            <Suspense>
              <LoginForm />
            </Suspense>

            <p className="mt-5 flex items-center gap-2 border-t border-border pt-4 text-[11px] text-muted">
              <IconoReloj width={13} height={13} className="text-muted/70" />
              Tu sesión se mantiene activa en este equipo.
            </p>
          </div>

          <div className="mt-8 text-center text-sm text-muted">
            <p>¿Tu empresa aún no usa Mantify?</p>
            <Link
              href="/planes"
              className="mt-1.5 inline-flex items-center gap-1.5 font-semibold text-primary transition-colors hover:text-primary-hover"
            >
              Ver planes y precios
              <IconoFlecha width={16} height={16} />
            </Link>
          </div>
        </div>

        <p className="text-center font-mono text-[9.5px] tracking-[0.14em] text-muted uppercase">
          © 2026 Mantify · Gestión de flotas
        </p>
      </main>
    </div>
  );
}

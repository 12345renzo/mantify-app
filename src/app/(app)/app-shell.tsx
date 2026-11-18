"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  createContext,
  Suspense,
  use,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { CambiarTema } from "@/shared/ui/cambiar-tema";
import { IconoCerrar, IconoMenu } from "@/shared/ui/iconos";
import { Logo } from "@/shared/ui/logo";
import {
  buscarSeccion,
  navegacionPara,
  type GrupoNav,
  type ItemNav,
} from "./navegacion";

// Permite que el menú (que llega del servidor) cierre el panel lateral en móvil al navegar.
const ShellContexto = createContext<{ cerrar: () => void }>({
  cerrar: () => {},
});

// Pulso decorativo del pie del sidebar: la señal del sistema, no un dato real.
const SENAL = [36, 52, 44, 66, 58, 74, 62, 84, 70, 90, 78, 96];

export function AppShell({
  perfil,
  menu,
  aviso,
  children,
}: {
  perfil: ReactNode;
  menu: ReactNode;
  aviso: ReactNode;
  children: ReactNode;
}) {
  const [abierto, setAbierto] = useState(false);
  const cerrar = () => setAbierto(false);

  useEffect(() => {
    if (!abierto) return;
    const alPresionar = (e: KeyboardEvent) =>
      e.key === "Escape" && setAbierto(false);
    document.addEventListener("keydown", alPresionar);
    return () => document.removeEventListener("keydown", alPresionar);
  }, [abierto]);

  return (
    <ShellContexto value={{ cerrar }}>
      <div className="min-h-dvh lg:pl-[18rem]">
        {abierto && (
          <button
            type="button"
            aria-label="Cerrar menú"
            onClick={cerrar}
            className="fixed inset-0 z-30 cursor-default bg-black/40 backdrop-blur-[3px] dark:bg-[#03130e]/60 lg:hidden"
          />
        )}

        <aside
          id="menu-lateral"
          className={`grano fixed inset-y-0 left-0 z-40 flex w-[18rem] flex-col overflow-hidden border-r border-sidebar-border bg-sidebar text-sidebar-fg shadow-[var(--shadow-pop)] transition-transform duration-300 ease-out [--logo-bg:var(--sidebar-logo-bg)] [--logo-dot:var(--sidebar-logo-dot)] [--logo-fg:var(--sidebar-logo-fg)] [--logo-ring:var(--sidebar-logo-ring)] lg:translate-x-0 lg:shadow-none ${
            abierto ? "translate-x-0" : "-translate-x-full"
          }`}
          style={{
            backgroundImage:
              "linear-gradient(180deg, var(--sidebar-2) 0%, var(--sidebar) 58%, var(--sidebar-3) 100%)",
          }}
        >
          {/* Malla y halo: profundidad sin gradientes de landing. */}
          <div
            className="reticula pointer-events-none absolute inset-0 text-sidebar-fg opacity-[0.05]"
            style={{
              maskImage:
                "radial-gradient(ellipse at 30% 0%, black 5%, transparent 68%)",
            }}
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -top-32 -left-16 size-[22rem] rounded-full opacity-60 blur-2xl"
            style={{
              background:
                "radial-gradient(circle, color-mix(in srgb, var(--sidebar-glow) 26%, transparent), transparent 68%)",
            }}
            aria-hidden="true"
          />

          <div className="relative flex h-[4.75rem] shrink-0 items-center justify-between border-b border-sidebar-border px-5">
            <Logo />
            <button
              type="button"
              onClick={cerrar}
              className="grid size-9 place-items-center rounded-lg text-sidebar-muted transition-colors hover:bg-sidebar-hover hover:text-sidebar-fg lg:hidden"
              aria-label="Cerrar menú"
            >
              <IconoCerrar width={18} height={18} />
            </button>
          </div>

          {menu}

          <div className="relative shrink-0 p-3">
            <div className="rounded-2xl border border-sidebar-border bg-sidebar-card p-3.5 shadow-[0_1px_2px_rgb(6_36_26/0.04)] dark:shadow-none">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[9.5px] font-semibold tracking-[0.16em] text-sidebar-muted uppercase">
                  Estado del sistema
                </span>
                <span className="flex items-center gap-1.5 text-[10px] font-semibold tracking-wide text-[var(--sidebar-signal)] uppercase">
                  <span className="relative flex size-1.5">
                    <span className="animar-latir absolute inline-flex size-1.5 rounded-full bg-[var(--sidebar-signal)]" />
                    <span className="relative inline-flex size-1.5 rounded-full bg-[var(--sidebar-signal)]" />
                  </span>
                  En línea
                </span>
              </div>

              <div
                className="mt-3 flex h-7 items-end gap-[3px]"
                aria-hidden="true"
              >
                {SENAL.map((alto, i) => (
                  <span
                    key={i}
                    className="flex-1 rounded-[2px] bg-[var(--sidebar-signal)]"
                    style={{
                      height: `${alto}%`,
                      opacity: i === SENAL.length - 1 ? 0.95 : 0.2 + i * 0.045,
                    }}
                  />
                ))}
              </div>

              <div className="mt-2.5 flex items-center justify-between font-mono text-[9px] tracking-[0.08em] text-sidebar-muted uppercase">
                <span>API · DB</span>
                <span>v0.1</span>
              </div>
            </div>
          </div>
        </aside>

        <header className="sticky top-0 z-20 flex h-[4.75rem] items-center gap-3 border-b border-border/80 bg-bg/80 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => setAbierto(true)}
            className="grid size-10 place-items-center rounded-xl border border-border bg-surface text-muted shadow-[0_1px_2px_rgb(6_36_26/0.05)] transition-colors hover:border-border-strong hover:text-fg lg:hidden"
            aria-label="Abrir menú"
            aria-controls="menu-lateral"
            aria-expanded={abierto}
          >
            <IconoMenu width={18} height={18} />
          </button>

          <Suspense>
            <Ubicacion />
          </Suspense>

          <div className="ml-auto flex items-center gap-2">
            <CambiarTema />
            <span className="hidden h-7 w-px bg-border sm:block" />
            {perfil}
          </div>
        </header>

        <main className="mx-auto w-full max-w-[88rem] px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
          {aviso}
          {children}
        </main>
      </div>
    </ShellContexto>
  );
}

// Menú del rol, con el enlace de la página actual resaltado.
export function MenuConRuta({ rol }: { rol: string | null }) {
  const { cerrar } = use(ShellContexto);
  const actual = buscarSeccion(usePathname());
  return (
    <MenuModulos
      grupos={navegacionPara(rol)}
      activo={actual?.item ?? null}
      alNavegar={cerrar}
    />
  );
}

export function MenuCargando() {
  return (
    <div className="flex-1 space-y-2 px-4 pt-5" aria-busy="true">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="h-9 animate-pulse rounded-xl bg-sidebar-hover"
        />
      ))}
    </div>
  );
}

function Ubicacion() {
  const actual = buscarSeccion(usePathname());
  if (!actual) return null;
  return (
    <nav
      aria-label="Ubicación"
      className="flex min-w-0 items-center gap-3 text-sm"
    >
      <span className="hidden items-center gap-2 rounded-full border border-border bg-surface/80 px-2.5 py-1 text-[10px] font-semibold tracking-[0.14em] text-muted uppercase sm:inline-flex">
        <span
          className="size-1.5 rounded-full bg-[var(--lime)] shadow-[0_0_8px_var(--lime)]"
          aria-hidden="true"
        />
        {actual.grupo.titulo}
      </span>
      <span className="hidden text-border-strong sm:inline" aria-hidden="true">
        /
      </span>
      <span className="truncate font-semibold tracking-[-0.02em]">
        {actual.item.etiqueta}
      </span>
    </nav>
  );
}

function MenuModulos({
  grupos,
  activo,
  alNavegar,
}: {
  grupos: GrupoNav[];
  activo: ItemNav | null;
  alNavegar: () => void;
}) {
  return (
    <nav
      className="relative flex-1 overflow-y-auto px-3 pt-3 pb-5"
      aria-label="Módulos"
    >
      {grupos.map((grupo) => (
        <div key={grupo.titulo} className="mt-5 first:mt-1">
          <p className="mb-2 flex items-center gap-2 px-3 text-[9.5px] font-semibold tracking-[0.16em] text-sidebar-muted uppercase">
            <span>{grupo.titulo}</span>
            <span
              className="h-px flex-1 bg-sidebar-border"
              aria-hidden="true"
            />
            <span className="font-mono text-[9px] text-sidebar-muted tabular-nums">
              {String(grupo.items.length).padStart(2, "0")}
            </span>
          </p>
          <ul className="flex flex-col gap-0.5">
            {grupo.items.map((item) => {
              const Icono = item.icono;
              const esActivo = activo === item;
              const contenido = (
                <>
                  <span
                    className="grid size-8 shrink-0 place-items-center rounded-[9px] ring-1 ring-inset ring-sidebar-border transition-colors"
                    style={
                      esActivo
                        ? {
                            color: "var(--sidebar-signal)",
                            backgroundColor:
                              "color-mix(in srgb, var(--sidebar-signal) 13%, transparent)",
                          }
                        : {
                            color: `color-mix(in srgb, ${item.color} 74%, var(--sidebar-fg))`,
                            backgroundColor: `color-mix(in srgb, ${item.color} 14%, transparent)`,
                          }
                    }
                  >
                    <Icono width={16} height={16} />
                  </span>
                  <span className="flex-1 truncate">{item.etiqueta}</span>
                </>
              );
              if (!item.href) {
                return (
                  <li key={item.etiqueta}>
                    <span
                      className="flex cursor-default items-center gap-3 rounded-xl px-3 py-2 text-sm text-sidebar-muted"
                      title={`Disponible en el corte ${item.corte}`}
                    >
                      {contenido}
                      <span className="rounded-md border border-sidebar-border bg-sidebar-chip px-1.5 py-0.5 font-mono text-[8.5px] font-semibold tracking-wide text-sidebar-muted uppercase">
                        C{item.corte}
                      </span>
                    </span>
                  </li>
                );
              }
              return (
                <li key={item.etiqueta}>
                  <Link
                    href={item.href}
                    onClick={alNavegar}
                    aria-current={esActivo ? "page" : undefined}
                    className={`group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors ${
                      esActivo
                        ? "font-semibold text-sidebar-fg shadow-[inset_0_1px_0_rgb(255_255_255/0.4)] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.06)]"
                        : "text-sidebar-fg/70 hover:bg-sidebar-hover hover:text-sidebar-fg"
                    }`}
                    style={
                      esActivo
                        ? {
                            backgroundImage:
                              "linear-gradient(90deg, color-mix(in srgb, var(--sidebar-signal) 14%, transparent), color-mix(in srgb, var(--sidebar-signal) 2%, transparent))",
                          }
                        : undefined
                    }
                  >
                    {esActivo && (
                      <span
                        className="absolute top-1/2 left-0 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-[var(--sidebar-signal)] shadow-[0_0_12px_var(--sidebar-signal)]"
                        aria-hidden="true"
                      />
                    )}
                    {contenido}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

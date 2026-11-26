import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import {
  exigirAccesoEnPagina,
  inicioDe,
} from "@/modules/acceso/infrastructure/sesion";
import {
  ETIQUETA_ROL,
  esRol,
  puede,
} from "@/modules/identidad/domain/permisos";
import { reposIdentidad } from "@/modules/identidad/infrastructure";
import { obtenerDashboard } from "@/modules/reportes/application/obtener-dashboard";
import { reposReportes } from "@/modules/reportes/infrastructure";
import {
  BloqueFlota,
  DashboardGestion,
  DashboardTecnico,
} from "@/modules/reportes/ui/dashboard";
import type { Actor } from "@/shared/kernel/actor";
import { tarjeta } from "@/shared/ui/estilos";
import { IconoFlecha, IconoPanel, IconoPersonas } from "@/shared/ui/iconos";
import { redirect } from "next/navigation";
import { Encabezado, Esqueleto } from "../encabezado";
import { Modulos } from "../modulos";

export const metadata: Metadata = { title: "Inicio" };

export default function InicioPage() {
  return (
    <Suspense fallback={<Esqueleto alto="h-64" />}>
      <Contenido />
    </Suspense>
  );
}

async function Contenido() {
  const actor = await exigirAccesoEnPagina();
  if (actor.rol === "SUPERADMIN") redirect(inicioDe(actor));
  const { lector } = await reposIdentidad();
  const perfil = await lector.miPerfil(actor);
  const rol = esRol(actor.rol) ? ETIQUETA_ROL[actor.rol] : "Usuario";

  return (
    <>
      <Encabezado
        icono={IconoPanel}
        color="var(--mod-plataforma)"
        titulo={
          perfil.nombre ? `Hola, ${perfil.nombre.split(" ")[0]}` : "Inicio"
        }
        descripcion={[rol, perfil.empresa].filter(Boolean).join(" · ")}
      />

      <Suspense fallback={<Esqueleto alto="h-96" />}>
        <Panel actor={actor} />
      </Suspense>

      {puede(actor.rol, "leer", "cuentas") && (
        <Link
          href="/personal"
          className={`${tarjeta} group flex items-center gap-4 p-5 transition-[border-color,transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[var(--shadow-pop)]`}
        >
          <span
            className="grid size-12 shrink-0 place-items-center rounded-xl border border-black/5 dark:border-white/5"
            style={{
              color: "var(--mod-personas)",
              backgroundColor:
                "color-mix(in srgb, var(--mod-personas) 13%, transparent)",
            }}
          >
            <IconoPersonas />
          </span>
          <span className="min-w-0 flex-1">
            <span className="mb-1 block text-[10px] font-semibold tracking-[0.14em] text-muted uppercase">
              Equipo
            </span>
            <span className="block font-semibold tracking-tight">
              Personal y cuentas
            </span>
            <span className="mt-0.5 block text-sm text-muted">
              {puede(actor.rol, "crear", "cuentas")
                ? "Registra a tu personal y dales acceso a Mantify."
                : "Consulta el personal y sus cuentas."}
            </span>
          </span>
          <span className="grid size-9 shrink-0 place-items-center rounded-full border border-border bg-surface text-muted transition-colors group-hover:border-primary/30 group-hover:bg-primary-soft group-hover:text-primary">
            <IconoFlecha width={17} height={17} />
          </span>
        </Link>
      )}

      <Modulos rol={actor.rol} />
    </>
  );
}

// Dashboard y bandeja según el rol (corte 10). Cada número sale de la misma regla que su módulo.
async function Panel({ actor }: { actor: Actor }) {
  const r = await obtenerDashboard(actor, await reposReportes(actor));
  if (!r.ok) throw r.error;
  const d = r.value;
  return (
    <div className="mb-6">
      {d.tipo === "GESTION" && <DashboardGestion d={d} />}
      {d.tipo === "GERENTE" && <BloqueFlota flota={d.flota} />}
      {d.tipo === "TECNICO" && (
        <DashboardTecnico
          d={d}
          accesos={[
            { href: "/trabajos", texto: "Mis trabajos", ok: true },
            {
              href: "/paradas",
              texto: "Iniciar parada",
              ok: puede(actor.rol, "crear", "trabajos"),
            },
            {
              href: "/engrase",
              texto: "Registrar engrase",
              ok: puede(actor.rol, "crear", "engrase"),
            },
            {
              href: "/neumaticos",
              texto: "Medir neumáticos",
              ok: puede(actor.rol, "crear", "neumaticos"),
            },
          ].filter((a) => a.ok)}
        />
      )}
    </div>
  );
}

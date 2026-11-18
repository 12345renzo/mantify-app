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

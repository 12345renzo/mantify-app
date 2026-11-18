import { Suspense, type ReactNode } from "react";
import { obtenerActor } from "@/modules/acceso/infrastructure/sesion";
import { ETIQUETA_ROL, esRol } from "@/modules/identidad/domain/permisos";
import { AppShell, MenuCargando, MenuConRuta } from "./app-shell";
import { AvisoClave } from "./cuenta/formulario-clave";
import { MenuPerfil } from "./menu-perfil";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell
      perfil={
        <Suspense
          fallback={
            <span className="size-8 animate-pulse rounded-full bg-surface-2" />
          }
        >
          <Perfil />
        </Suspense>
      }
      menu={
        <Suspense fallback={<MenuCargando />}>
          <MenuDelUsuario />
        </Suspense>
      }
      aviso={
        <Suspense>
          <AvisoClaveServidor />
        </Suspense>
      }
    >
      {children}
    </AppShell>
  );
}

// El permiso lo revisa cada página; aquí solo se arma lo que se muestra.
async function Perfil() {
  const actor = await obtenerActor();
  if (!actor) return null;
  return (
    <MenuPerfil
      email={actor.email}
      rol={esRol(actor.rol) ? ETIQUETA_ROL[actor.rol] : "Usuario"}
    />
  );
}

async function MenuDelUsuario() {
  const actor = await obtenerActor();
  return <MenuConRuta rol={actor?.habilitado ? actor.rol : null} />;
}

// Aviso, no bloqueo: la clave asignada sirve, pero conviene cambiarla.
async function AvisoClaveServidor() {
  const actor = await obtenerActor();
  if (!actor?.habilitado) return null;
  return <AvisoClave mostrar={actor.debeCambiarClave} />;
}

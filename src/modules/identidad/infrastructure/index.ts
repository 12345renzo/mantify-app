import "server-only";
import { createSupabaseServerClient } from "@/shared/supabase/server";
import { crearServicioAuth } from "./auth-supabase";
import { crearLectorIdentidad } from "./lector-identidad";
import { crearPersonasRepositorio } from "./personas-repositorio";
import { crearCuentasRepositorio } from "./usuarios-repositorio";

// Tablas con la sesión del usuario (RLS revisa cada permiso). Auth admin solo para credenciales.
export async function reposIdentidad() {
  const db = await createSupabaseServerClient();
  return {
    personas: crearPersonasRepositorio(db),
    cuentas: crearCuentasRepositorio(db),
    auth: crearServicioAuth(db),
    lector: crearLectorIdentidad(db),
  };
}

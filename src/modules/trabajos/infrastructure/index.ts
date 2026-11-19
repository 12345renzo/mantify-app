import "server-only";
import { createSupabaseServerClient } from "@/shared/supabase/server";
import {
  crearLectorTrabajos,
  crearTrabajosRepositorio,
} from "./trabajos-repositorio";

// Con la sesión del usuario: RLS y las funciones de la base vuelven a revisar empresa, rol y estado.
export async function reposTrabajos() {
  const db = await createSupabaseServerClient();
  return {
    lector: crearLectorTrabajos(db),
    trabajos: crearTrabajosRepositorio(db),
  };
}

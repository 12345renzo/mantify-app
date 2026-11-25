import "server-only";
import { createSupabaseServerClient } from "@/shared/supabase/server";
import type { ReposNeumaticos } from "../application/repositorios";
import {
  crearLectorNeumaticos,
  crearNeumaticosRepositorio,
} from "./neumaticos-repositorio";

// Con la sesión del usuario: RLS y las funciones de la base vuelven a revisar empresa y rol.
export async function reposNeumaticos(): Promise<ReposNeumaticos> {
  const db = await createSupabaseServerClient();
  return {
    lector: crearLectorNeumaticos(db),
    neumaticos: crearNeumaticosRepositorio(db),
  };
}

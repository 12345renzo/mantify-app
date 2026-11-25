import "server-only";
import { createSupabaseServerClient } from "@/shared/supabase/server";
import type { ReposEngrase } from "../application/repositorios";
import {
  crearEngraseRepositorio,
  crearLectorEngrase,
} from "./engrase-repositorio";

// Con la sesión del usuario: RLS y las funciones de la base vuelven a revisar empresa y rol.
export async function reposEngrase(): Promise<ReposEngrase> {
  const db = await createSupabaseServerClient();
  return {
    lector: crearLectorEngrase(db),
    engrase: crearEngraseRepositorio(db),
  };
}

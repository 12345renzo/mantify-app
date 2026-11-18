import "server-only";
import { createSupabaseServerClient } from "@/shared/supabase/server";
import { crearCatalogosRepositorio } from "./catalogos-repositorio";

// Con la sesión del usuario: RLS vuelve a revisar empresa y rol en cada consulta.
export async function reposCatalogos() {
  return {
    catalogos: crearCatalogosRepositorio(await createSupabaseServerClient()),
  };
}

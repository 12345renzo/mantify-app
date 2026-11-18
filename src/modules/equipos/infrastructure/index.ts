import "server-only";
import { createSupabaseServerClient } from "@/shared/supabase/server";
import {
  crearEquiposRepositorio,
  crearLectorEquipos,
} from "./equipos-repositorio";
import { lectorExcel } from "./excel-lector";

// Con la sesión del usuario: RLS y los triggers revisan empresa, rol y "solo sube".
export async function reposEquipos() {
  const db = await createSupabaseServerClient();
  return {
    equipos: crearEquiposRepositorio(db),
    lector: crearLectorEquipos(db),
    excel: lectorExcel,
  };
}

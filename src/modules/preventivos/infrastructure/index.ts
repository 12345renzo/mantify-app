import "server-only";
import {
  crearLectorTrabajos,
  crearTrabajosRepositorio,
} from "@/modules/trabajos/infrastructure/trabajos-repositorio";
import { createSupabaseServerClient } from "@/shared/supabase/server";
import type { ReposPreventivos } from "../application/repositorios";
import {
  crearLectorPreventivos,
  crearPreventivosRepositorio,
} from "./preventivos-repositorio";

// Con la sesión del usuario: RLS y las funciones de la base vuelven a revisar empresa, rol y estado.
export async function reposPreventivos(): Promise<ReposPreventivos> {
  const db = await createSupabaseServerClient();
  return {
    lector: crearLectorPreventivos(db),
    preventivos: crearPreventivosRepositorio(db),
    trabajos: {
      lector: crearLectorTrabajos(db),
      trabajos: crearTrabajosRepositorio(db),
    },
  };
}

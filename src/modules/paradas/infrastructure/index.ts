import "server-only";
import { lectorExcel } from "@/modules/equipos/infrastructure/excel-lector";
import {
  crearLectorTrabajos,
  crearTrabajosRepositorio,
} from "@/modules/trabajos/infrastructure/trabajos-repositorio";
import { createSupabaseServerClient } from "@/shared/supabase/server";
import type { ReposParadas } from "../application/repositorios";
import {
  crearLectorParadas,
  crearParadasRepositorio,
} from "./paradas-repositorio";

// Con la sesión del usuario: RLS y las funciones de la base vuelven a revisar empresa, rol y estado.
export async function reposParadas(): Promise<ReposParadas> {
  const db = await createSupabaseServerClient();
  return {
    lector: crearLectorParadas(db),
    paradas: crearParadasRepositorio(db),
    trabajos: {
      lector: crearLectorTrabajos(db),
      trabajos: crearTrabajosRepositorio(db),
    },
    excel: lectorExcel,
  };
}

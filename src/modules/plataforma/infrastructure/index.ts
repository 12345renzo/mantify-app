import "server-only";
import { createSupabaseServerClient } from "@/shared/supabase/server";
import { crearEmpresasRepositorio } from "./empresas-repositorio";
import { crearLectorPlataforma } from "./lector-plataforma";
import { crearMembresiasRepositorio } from "./membresias-repositorio";
import { crearPlanesRepositorio } from "./planes-repositorio";

// Repositorios con la sesión del usuario: RLS de la base vuelve a comprobar cada permiso.
export async function reposPlataforma() {
  const db = await createSupabaseServerClient();
  return {
    empresas: crearEmpresasRepositorio(db),
    membresias: crearMembresiasRepositorio(db),
    planes: crearPlanesRepositorio(db),
    lector: crearLectorPlataforma(db),
  };
}

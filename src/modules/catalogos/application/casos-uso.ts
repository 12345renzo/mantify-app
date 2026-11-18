import {
  empresaDeTrabajo,
  exigirPermiso,
} from "@/modules/identidad/application/acceso";
import type { Actor } from "@/shared/kernel/actor";
import { ok, type Result } from "@/shared/kernel/result";
import type { CodigoCatalogo } from "../domain/catalogos";
import type { CambiarActivoEntrada, ElementoEntrada } from "./esquemas";
import type { CatalogosRepositorio, Elemento } from "./repositorios";

// Todos los roles de la empresa leen (los usan en sus formularios); solo el planificador escribe.
export async function listarCatalogo(
  actor: Actor | null,
  catalogo: CodigoCatalogo,
  repos: { catalogos: CatalogosRepositorio },
): Promise<Result<Elemento[]>> {
  const permiso = exigirPermiso(actor, "leer", "catalogos");
  if (!permiso.ok) return permiso;
  const empresa = empresaDeTrabajo(permiso.value, null);
  if (!empresa.ok) return empresa;
  return ok(await repos.catalogos.listar(catalogo, empresa.value));
}

// Crea si no trae id; si lo trae, edita. La empresa sale del actor, nunca del formulario.
export async function guardarElemento(
  actor: Actor | null,
  entrada: ElementoEntrada,
  repos: { catalogos: CatalogosRepositorio },
): Promise<Result<void>> {
  const permiso = exigirPermiso(
    actor,
    entrada.id ? "editar" : "crear",
    "catalogos",
  );
  if (!permiso.ok) return permiso;
  const empresa = empresaDeTrabajo(permiso.value, null);
  if (!empresa.ok) return empresa;

  return entrada.id
    ? repos.catalogos.actualizar(entrada.catalogo, entrada.id, entrada.valores)
    : repos.catalogos.crear(entrada.catalogo, empresa.value, entrada.valores);
}

// No se borra: se desactiva y lo que ya lo usa conserva su historial.
export async function cambiarActivoElemento(
  actor: Actor | null,
  entrada: CambiarActivoEntrada,
  repos: { catalogos: CatalogosRepositorio },
): Promise<Result<void>> {
  const permiso = exigirPermiso(actor, "dar_baja", "catalogos");
  if (!permiso.ok) return permiso;
  const empresa = empresaDeTrabajo(permiso.value, null);
  if (!empresa.ok) return empresa;
  return repos.catalogos.cambiarActivo(
    entrada.catalogo,
    entrada.id,
    entrada.activo,
  );
}

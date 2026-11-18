import "server-only";
import { listarCatalogo } from "@/modules/catalogos/application/casos-uso";
import { reposCatalogos } from "@/modules/catalogos/infrastructure";
import type { Actor } from "@/shared/kernel/actor";
import type { Opcion } from "./modales-equipo";

// Categorías y ubicaciones de la empresa para el formulario (activas e inactivas: el formulario filtra).
export async function opcionesEquipo(actor: Actor) {
  const repos = await reposCatalogos();
  const [cats, ubis] = await Promise.all([
    listarCatalogo(actor, "categorias_equipo", repos),
    listarCatalogo(actor, "ubicaciones", repos),
  ]);
  const aOpcion = (r: typeof cats): Opcion[] =>
    r.ok
      ? r.value.map((e) => ({
          id: e.id,
          nombre: String(e.valores.nombre),
          activo: e.activo,
        }))
      : [];
  return { categorias: aOpcion(cats), ubicaciones: aOpcion(ubis) };
}

import type { CatalogosRepositorio } from "@/modules/catalogos/application/repositorios";
import {
  empresaDeTrabajo,
  exigirPermiso,
} from "@/modules/identidad/application/acceso";
import type { Actor } from "@/shared/kernel/actor";
import { DomainError } from "@/shared/kernel/errors";
import { err, ok, type Result } from "@/shared/kernel/result";
import {
  claveNombre,
  LIMITES_IMPORTACION,
  pareceXlsx,
  prepararImportacion,
  type ErrorFila,
} from "../domain/importacion";
import type { EquiposRepositorio, LectorExcel } from "./repositorios";

export type ResumenImportacion = {
  creados: number;
  actualizados: number;
  errores: ErrorFila[];
};

const MOTIVO_BASE = {
  HOROMETRO_MENOR:
    "El horómetro es menor que el actual del equipo. Corrígelo a mano si está mal.",
  DUPLICADO: "Otro equipo ya usa ese código.",
  CATALOGO: "La categoría o la ubicación ya no es válida.",
  DATOS: "Algún dato no es válido para guardar.",
} as const;

// Crea los equipos nuevos y actualiza los existentes por código. Las filas con error
// se reportan sin cortar la importación. Un archivo inválido (tamaño, formato, columnas) se rechaza entero.
export async function importarEquipos(
  actor: Actor | null,
  bytes: Uint8Array,
  repos: {
    equipos: EquiposRepositorio;
    catalogos: CatalogosRepositorio;
    excel: LectorExcel;
  },
): Promise<Result<ResumenImportacion>> {
  const permiso = exigirPermiso(actor, "crear", "flota");
  if (!permiso.ok) return permiso;
  const empresa = empresaDeTrabajo(permiso.value, null);
  if (!empresa.ok) return empresa;

  if (bytes.length > LIMITES_IMPORTACION.bytes) {
    return err(new DomainError("VALIDATION", "ARCHIVO_GRANDE"));
  }
  if (!pareceXlsx(bytes)) {
    return err(new DomainError("VALIDATION", "NO_XLSX"));
  }
  const filas = await repos.excel.leer(bytes);
  if (!filas.ok) return filas;

  // Categorías por nombre o por nombre de flota; ubicaciones por nombre. Solo activas.
  const [cats, ubis] = await Promise.all([
    repos.catalogos.listar("categorias_equipo", empresa.value),
    repos.catalogos.listar("ubicaciones", empresa.value),
  ]);
  const categorias = new Map<string, string>();
  for (const c of cats.filter((x) => x.activo)) {
    for (const n of [c.valores.nombre, c.valores.nombre_flota]) {
      if (typeof n === "string" && n) categorias.set(claveNombre(n), c.id);
    }
  }
  const ubicaciones = new Map(
    ubis
      .filter((u) => u.activo)
      .map((u) => [claveNombre(String(u.valores.nombre)), u.id] as const),
  );

  const prep = prepararImportacion(filas.value, { categorias, ubicaciones });
  if (!prep.ok) return err(new DomainError("VALIDATION", prep.error));

  if (prep.validas.length === 0) {
    return ok({ creados: 0, actualizados: 0, errores: prep.errores });
  }
  const r = await repos.equipos.importar(prep.validas);
  if (!r.ok) return r;

  const errores = [...prep.errores];
  let creados = 0;
  let actualizados = 0;
  for (const x of r.value) {
    if ("error" in x)
      errores.push({ fila: x.fila, motivo: MOTIVO_BASE[x.error] });
    else if (x.accion === "CREADO") creados++;
    else actualizados++;
  }
  errores.sort((a, b) => a.fila - b.fila);
  return ok({ creados, actualizados, errores });
}

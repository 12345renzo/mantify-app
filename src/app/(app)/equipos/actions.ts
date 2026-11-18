"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { obtenerActor } from "@/modules/acceso/infrastructure/sesion";
import {
  cambiarMovilizacion,
  crearEquipo,
  editarEquipo,
  registrarLectura,
} from "@/modules/equipos/application/casos-uso";
import {
  crearEquipoSchema,
  editarEquipoSchema,
  lecturaSchema,
  movilizacionSchema,
} from "@/modules/equipos/application/esquemas";
import {
  importarEquipos,
  type ResumenImportacion,
} from "@/modules/equipos/application/importar-equipos";
import { LIMITES_IMPORTACION } from "@/modules/equipos/domain/importacion";
import { reposEquipos } from "@/modules/equipos/infrastructure";
import { reposCatalogos } from "@/modules/catalogos/infrastructure";
import type { DomainError } from "@/shared/kernel/errors";
import { mensajeError } from "../mensajes";

export type EstadoEquipo = {
  error?: string;
  exito?: string;
  errores?: Record<string, string | undefined>;
  valores?: Record<string, string>;
};

const CAMPOS = [
  "codigo",
  "categoriaId",
  "ubicacionId",
  "marca",
  "modelo",
  "numeroSerie",
  "idExterno",
  "estadoOperativo",
  "estadoMovilizacion",
  "requiereEngrase",
];

const valoresDe = (fd: FormData, campos: string[]) =>
  Object.fromEntries(campos.map((c) => [c, String(fd.get(c) ?? "")]));

const primerError = (e: z.ZodError) =>
  Object.fromEntries(
    Object.entries(z.flattenError(e).fieldErrors).map(([k, v]) => [
      k,
      (v as string[] | undefined)?.[0],
    ]),
  );

const errorEquipo = (e: DomainError) => ({
  error: mensajeError(e, {
    CONFLICT:
      e.message === "otro lo cambió o no puede editarlo"
        ? "Otra persona cambió este equipo. Cierra y vuelve a abrir para ver lo último."
        : "Ya hay un equipo con ese código.",
    VALIDATION:
      "La categoría o la ubicación ya no es válida. Recarga la página.",
  }),
  errores:
    e.code === "CONFLICT" && e.message !== "otro lo cambió o no puede editarlo"
      ? { codigo: "Este código ya existe en tu flota." }
      : undefined,
});

export async function crearEquipoAction(
  _previo: EstadoEquipo,
  fd: FormData,
): Promise<EstadoEquipo> {
  const valores = valoresDe(fd, [...CAMPOS, "horometroInicial"]);
  const datos = crearEquipoSchema.safeParse(valores);
  if (!datos.success) return { errores: primerError(datos.error), valores };
  const r = await crearEquipo(
    await obtenerActor(),
    datos.data,
    await reposEquipos(),
  );
  if (!r.ok) return { valores, ...errorEquipo(r.error) };
  redirect(`/equipos/${r.value.id}`);
}

export async function editarEquipoAction(
  _previo: EstadoEquipo,
  fd: FormData,
): Promise<EstadoEquipo> {
  const valores = valoresDe(fd, [...CAMPOS, "id", "version"]);
  const datos = editarEquipoSchema.safeParse(valores);
  if (!datos.success) return { errores: primerError(datos.error), valores };
  const r = await editarEquipo(
    await obtenerActor(),
    datos.data,
    await reposEquipos(),
  );
  if (!r.ok) return { valores, ...errorEquipo(r.error) };
  refresh();
  return { exito: "Cambios guardados." };
}

export async function movilizacionAction(
  _previo: EstadoEquipo,
  fd: FormData,
): Promise<EstadoEquipo> {
  const datos = movilizacionSchema.safeParse(valoresDe(fd, ["id", "estado"]));
  if (!datos.success) return { error: "Acción no válida." };
  const r = await cambiarMovilizacion(
    await obtenerActor(),
    datos.data,
    await reposEquipos(),
  );
  if (!r.ok) return { error: mensajeError(r.error) };
  refresh();
  return {
    exito:
      datos.data.estado === "DESMOVILIZADO"
        ? "Equipo desmovilizado."
        : "Equipo movilizado.",
  };
}

const MENSAJES_LECTURA: Record<string, string> = {
  "lectura menor que la actual":
    "La lectura es menor que el horómetro actual. Si el horómetro está mal, usa «Corregir».",
  "una corrección debe bajar el horómetro":
    "Una corrección debe ser menor que el horómetro actual. Para subirlo, registra una lectura normal.",
  "la corrección exige motivo": "Explica el motivo de la corrección.",
  "equipo desmovilizado":
    "El equipo está desmovilizado. Movilízalo para registrar lecturas.",
  "fecha futura": "La fecha no puede ser posterior a hoy.",
};

export async function lecturaAction(
  _previo: EstadoEquipo,
  fd: FormData,
): Promise<EstadoEquipo> {
  const valores = valoresDe(fd, [
    "equipoId",
    "valor",
    "fecha",
    "esCorreccion",
    "motivo",
  ]);
  const datos = lecturaSchema.safeParse(valores);
  if (!datos.success) return { errores: primerError(datos.error), valores };
  const r = await registrarLectura(
    await obtenerActor(),
    datos.data,
    await reposEquipos(),
  );
  if (!r.ok) {
    return {
      valores,
      error: mensajeError(r.error, {
        VALIDATION: MENSAJES_LECTURA[r.error.message],
        CONFLICT:
          "Otra lectura entró antes y el horómetro cambió. Cierra y vuelve a intentarlo.",
        FORBIDDEN: "Solo el planificador puede corregir el horómetro.",
      }),
    };
  }
  refresh();
  return {
    exito: datos.data.esCorreccion
      ? "Corrección registrada."
      : "Lectura registrada.",
  };
}

export type EstadoImportacion = {
  error?: string;
  exito?: string;
  resumen?: ResumenImportacion;
};

const MENSAJES_ARCHIVO: Record<string, string> = {
  ARCHIVO_GRANDE: "El archivo pesa más de 2 MB. Divídelo en varios.",
  NO_XLSX:
    "El archivo no es un Excel .xlsx. Guárdalo como «Libro de Excel (.xlsx)».",
  ZIP_SOSPECHOSO: "El archivo es demasiado grande por dentro o está dañado.",
  XLSX_DANADO:
    "No se pudo leer el archivo. Ábrelo en Excel y vuelve a guardarlo.",
};

export async function importarAction(
  _previo: EstadoImportacion,
  fd: FormData,
): Promise<EstadoImportacion> {
  const archivo = fd.get("archivo");
  if (!(archivo instanceof File) || archivo.size === 0) {
    return { error: "Elige un archivo .xlsx." };
  }
  // Se revisa el tamaño antes de leerlo en memoria.
  if (archivo.size > LIMITES_IMPORTACION.bytes) {
    return { error: MENSAJES_ARCHIVO.ARCHIVO_GRANDE };
  }
  const bytes = new Uint8Array(await archivo.arrayBuffer());
  const [equipos, catalogos] = await Promise.all([
    reposEquipos(),
    reposCatalogos(),
  ]);
  const r = await importarEquipos(await obtenerActor(), bytes, {
    ...equipos,
    ...catalogos,
  });
  if (!r.ok) {
    return {
      error:
        r.error.code === "VALIDATION"
          ? // Los errores de archivo de prepararImportacion ya vienen redactados para el usuario.
            (MENSAJES_ARCHIVO[r.error.message] ?? r.error.message)
          : mensajeError(r.error),
    };
  }
  // Sin refresh aquí: el resumen se ve en el modal y la lista se recarga al cerrarlo.
  return { exito: "Importación terminada.", resumen: r.value };
}

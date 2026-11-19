"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { obtenerActor } from "@/modules/acceso/infrastructure/sesion";
import { LIMITES_IMPORTACION } from "@/modules/equipos/domain/importacion";
import {
  backlogDesdeHallazgo,
  cerrarParada,
  iniciarParada,
  importarParadas,
  type ResumenImportacion,
} from "@/modules/paradas/application/casos-uso";
import {
  backlogHallazgoSchema,
  cerrarSchema,
  iniciarSchema,
} from "@/modules/paradas/application/esquemas";
import { MAX_FOTOS_PARADA } from "@/modules/paradas/domain/revision-parada";
import { reposParadas } from "@/modules/paradas/infrastructure";
import { MAX_BYTES_IMAGEN } from "@/modules/trabajos/domain/fotos";
import type { DomainError } from "@/shared/kernel/errors";
import type { Result } from "@/shared/kernel/result";
import { mensajeError } from "../mensajes";

export type EstadoParada = {
  error?: string;
  exito?: string;
  // La parada se cruza con otra: el formulario pide confirmarlo.
  cruce?: boolean;
  errores?: Record<string, string | undefined>;
  valores?: Record<string, string>;
};

const valoresDe = (fd: FormData, campos: string[]) =>
  Object.fromEntries(campos.map((c) => [c, String(fd.get(c) ?? "")]));

const primerError = (e: z.ZodError) =>
  Object.fromEntries(
    Object.entries(z.flattenError(e).fieldErrors).map(([k, v]) => [
      k,
      (v as string[] | undefined)?.[0],
    ]),
  );

// Mismo texto clave en la app y en la base.
const MENSAJES: Record<string, string> = {
  salida_antes: "La salida debe ser posterior a la hora de parada.",
  horometro_baja: "El horómetro de salida no puede ser menor que el de parada.",
  duplicado: "Ya hay una parada de este equipo con el mismo motivo y hora.",
  cruce:
    "Se cruza con otra parada del mismo equipo. Revisa las horas o marca «Confirmo el cruce».",
  fecha_futura: "La fecha y hora no pueden ser posteriores a ahora.",
  fotos_maximo: `Máximo ${MAX_FOTOS_PARADA} fotos por parada.`,
  foto_no_valida: "Solo fotos JPG, PNG o WEBP de hasta 2 MB.",
  subida_fallida: "No se pudo subir la foto. Inténtalo de nuevo.",
  equipo_no_valido: "El equipo ya no está disponible. Recarga la página.",
  motivo_no_valido: "El motivo ya no está activo. Elige otro.",
  responsable_no_valido: "Esa persona ya no está activa. Elige otra.",
  area_no_valida: "El área ya no está activa. Elige otra.",
  parada_no_valida: "Esta parada ya tiene backlog o no tiene hallazgo.",
};

function errorParada(e: DomainError): EstadoParada {
  const duplicado = e.code === "CONFLICT" && e.message.includes("duplicado");
  return {
    cruce: e.message === "cruce" || undefined,
    error: mensajeError(e, {
      VALIDATION: MENSAJES[e.message],
      FORBIDDEN: MENSAJES[e.message],
      CONFLICT: duplicado
        ? MENSAJES.duplicado
        : "Otra persona cambió esta parada mientras trabajabas. Cierra y recarga la página.",
    }),
  };
}

function terminar(
  r: Result<unknown>,
  valores: Record<string, string>,
  exito: string,
): EstadoParada {
  if (!r.ok) return { valores, ...errorParada(r.error) };
  refresh();
  return { exito };
}

async function fotosDe(
  fd: FormData,
): Promise<{ ok: true; bytes: Uint8Array[] } | { ok: false; error: string }> {
  const archivos = fd
    .getAll("fotos")
    .filter((f): f is File => f instanceof File && f.size > 0);
  if (archivos.length > MAX_FOTOS_PARADA) {
    return { ok: false, error: MENSAJES.fotos_maximo };
  }
  if (archivos.some((f) => f.size > MAX_BYTES_IMAGEN)) {
    return { ok: false, error: MENSAJES.foto_no_valida };
  }
  return {
    ok: true,
    bytes: await Promise.all(
      archivos.map(async (f) => new Uint8Array(await f.arrayBuffer())),
    ),
  };
}

export async function iniciarAction(
  _previo: EstadoParada,
  fd: FormData,
): Promise<EstadoParada> {
  const valores = valoresDe(fd, [
    "equipoId",
    "motivoId",
    "inicio",
    "horometroInicio",
    "responsableId",
    "responsableExterno",
    "confirmarCruce",
    "clave",
  ]);
  const datos = iniciarSchema.safeParse(valores);
  if (!datos.success) return { errores: primerError(datos.error), valores };
  const fotos = await fotosDe(fd);
  if (!fotos.ok) return { valores, error: fotos.error };
  const r = await iniciarParada(
    await obtenerActor(),
    datos.data,
    fotos.bytes,
    await reposParadas(),
  );
  if (!r.ok) return { valores, ...errorParada(r.error) };
  redirect(`/paradas/${r.value.id}`);
}

export async function cerrarAction(
  _previo: EstadoParada,
  fd: FormData,
): Promise<EstadoParada> {
  const valores = valoresDe(fd, [
    "paradaId",
    "fin",
    "horometroFin",
    "descripcion",
    "areaDemoraId",
    "areaParadaId",
    "hallazgo",
    "confirmarCruce",
    "clave",
  ]);
  const datos = cerrarSchema.safeParse(valores);
  if (!datos.success) return { errores: primerError(datos.error), valores };
  const fotos = await fotosDe(fd);
  if (!fotos.ok) return { valores, error: fotos.error };
  const r = await cerrarParada(
    await obtenerActor(),
    datos.data,
    fotos.bytes,
    await reposParadas(),
  );
  return terminar(r, valores, "Parada cerrada.");
}

export async function backlogHallazgoAction(
  _previo: EstadoParada,
  fd: FormData,
): Promise<EstadoParada> {
  const valores = valoresDe(fd, ["paradaId", "componente", "criticidad"]);
  const datos = backlogHallazgoSchema.safeParse(valores);
  if (!datos.success) return { errores: primerError(datos.error), valores };
  const r = await backlogDesdeHallazgo(
    await obtenerActor(),
    datos.data,
    await reposParadas(),
  );
  return terminar(r, valores, "Backlog creado en la bandeja de trabajos.");
}

export type EstadoImportacion = {
  error?: string;
  resumen?: ResumenImportacion;
};

const MENSAJES_ARCHIVO: Record<string, string> = {
  ARCHIVO_GRANDE: "El archivo pasa de 2 MB.",
  NO_XLSX: "El archivo no es un Excel .xlsx.",
  ZIP_SOSPECHOSO: "El archivo no es un Excel válido.",
  XLSX_DANADO: "No se pudo leer el Excel. Guárdalo de nuevo como .xlsx.",
  VACIO: "El archivo no tiene filas debajo del encabezado.",
  DEMASIADAS_FILAS: `Máximo ${LIMITES_IMPORTACION.filas} filas por archivo.`,
  COLUMNAS:
    "Faltan columnas. Se necesitan ID_IMPORTACION, EQUIPO, MOTIVO, INICIO, FIN, HOROMETRO_INICIO, HOROMETRO_FIN, DESCRIPCION y RESPONSABLE.",
};

export async function importarAction(
  _previo: EstadoImportacion,
  fd: FormData,
): Promise<EstadoImportacion> {
  const archivo = fd.get("archivo");
  if (!(archivo instanceof File) || archivo.size === 0) {
    return { error: "Elige un archivo .xlsx." };
  }
  // El tamaño se revisa antes de leerlo en memoria.
  if (archivo.size > LIMITES_IMPORTACION.bytes) {
    return { error: MENSAJES_ARCHIVO.ARCHIVO_GRANDE };
  }
  const r = await importarParadas(
    await obtenerActor(),
    new Uint8Array(await archivo.arrayBuffer()),
    await reposParadas(),
  );
  if (!r.ok) {
    return {
      error:
        (r.error.code === "VALIDATION" && MENSAJES_ARCHIVO[r.error.message]) ||
        mensajeError(r.error),
    };
  }
  // Sin refresh: el resumen se ve en el modal y la lista se recarga al cerrarlo.
  return { resumen: r.value };
}

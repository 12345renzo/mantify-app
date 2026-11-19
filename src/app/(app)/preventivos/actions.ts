"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { obtenerActor } from "@/modules/acceso/infrastructure/sesion";
import {
  ejecutarPreventivo,
  generarBacklogDesdeObservacion,
  importarPreventivos,
  programarPreventivo,
  reprogramarPreventivo,
  validarPreventivo,
  type ResumenImportacion,
} from "@/modules/preventivos/application/casos-uso";
import {
  backlogObservacionSchema,
  ejecutarSchema,
  programarSchema,
  reprogramarSchema,
  validarPreventivoSchema,
} from "@/modules/preventivos/application/esquemas";
import { LIMITES_CSV } from "@/modules/preventivos/domain/importacion-csv";
import { reposPreventivos } from "@/modules/preventivos/infrastructure";
import { MAX_BYTES_IMAGEN, MAX_FOTOS } from "@/modules/trabajos/domain/fotos";
import type { DomainError } from "@/shared/kernel/errors";
import type { Result } from "@/shared/kernel/result";
import { mensajeError } from "../mensajes";

export type EstadoPreventivo = {
  error?: string;
  exito?: string;
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
  sin_firma:
    "Primero registra tu firma: menú de tu perfil (arriba a la derecha) → «Mi firma».",
  no_responsable: "Solo el responsable asignado puede ejecutarlo.",
  propio_cierre: "No puedes validar un preventivo que ejecutaste tú.",
  actividades_incompletas: "Marca el resultado de todas las actividades.",
  observacion_obligatoria:
    "Cada actividad observada necesita su observación (mínimo 3 caracteres).",
  fotos_maximo: `Máximo ${MAX_FOTOS} fotos.`,
  foto_no_valida: "Solo fotos JPG, PNG o WEBP de hasta 2 MB.",
  subida_fallida: "No se pudo subir la foto. Inténtalo de nuevo.",
  fecha_futura: "La fecha no puede ser posterior a hoy.",
  fecha_pasada: "La nueva fecha no puede ser anterior a hoy.",
  fecha_no_valida: "La fecha es demasiado antigua.",
  duracion_no_valida: "La hora de fin no puede ser igual a la de inicio.",
  nota_obligatoria: "Escribe qué hay que completar (mínimo 5 caracteres).",
  equipo_no_valido: "El equipo ya no está disponible. Recarga la página.",
  plan_no_valido: "El plan ya no está activo. Elige otro.",
  responsable_no_valido: "Esa persona ya no está activa. Elige otra.",
  actividad_no_valida: "Esa actividad ya tiene backlog o no está observada.",
};

const errorPreventivo = (e: DomainError) => ({
  error: mensajeError(e, {
    VALIDATION: MENSAJES[e.message],
    FORBIDDEN: MENSAJES[e.message],
    CONFLICT: e.message.includes("unique")
      ? "Ya hay un preventivo de ese plan para ese equipo en esa fecha."
      : "Otra persona cambió este preventivo mientras trabajabas. Cierra y recarga la página.",
  }),
});

function terminar(
  r: Result<unknown>,
  valores: Record<string, string>,
  exito: string,
): EstadoPreventivo {
  if (!r.ok) return { valores, ...errorPreventivo(r.error) };
  refresh();
  return { exito };
}

const CAMPOS_PROGRAMAR = [
  "equipoId",
  "nombrePlanId",
  "tipo",
  "fechaProgramada",
  "horometroProgramado",
  "responsableId",
  "tercero",
  "cadaDias",
  "cadaHoras",
  "clave",
];

export async function programarAction(
  _previo: EstadoPreventivo,
  fd: FormData,
): Promise<EstadoPreventivo> {
  const valores = valoresDe(fd, CAMPOS_PROGRAMAR);
  const datos = programarSchema.safeParse(valores);
  if (!datos.success) return { errores: primerError(datos.error), valores };
  const r = await programarPreventivo(
    await obtenerActor(),
    datos.data,
    await reposPreventivos(),
  );
  if (!r.ok) return { valores, ...errorPreventivo(r.error) };
  redirect(`/preventivos/${r.value.id}`);
}

// JSON de un campo oculto del formulario; si no se puede leer, lista vacía (Zod valida lo demás).
function json(fd: FormData, campo: string): unknown {
  try {
    return JSON.parse(String(fd.get(campo) ?? "[]"));
  } catch {
    return null;
  }
}

export async function ejecutarAction(
  _previo: EstadoPreventivo,
  fd: FormData,
): Promise<EstadoPreventivo> {
  const valores = valoresDe(fd, [
    "preventivoId",
    "fechaEjecucion",
    "horaInicio",
    "horaFin",
    "turno",
    "horometroEjecucion",
    "notas",
    "repuestos",
    "clave",
  ]);
  // Una actividad por campo "resultado:<id>", con su "observacion:<id>".
  const actividades = [...fd.keys()]
    .filter((k) => k.startsWith("resultado:"))
    .map((k) => {
      const id = k.slice("resultado:".length);
      return {
        id,
        resultado: String(fd.get(k) ?? ""),
        observacion: String(fd.get(`observacion:${id}`) ?? ""),
      };
    });
  for (const a of actividades) {
    valores[`resultado:${a.id}`] = a.resultado;
    valores[`observacion:${a.id}`] = a.observacion;
  }
  const datos = ejecutarSchema.safeParse({
    ...valores,
    actividades,
    repuestos: json(fd, "repuestos"),
    personal: fd.getAll("personal").map(String),
  });
  if (!datos.success) {
    const errores = primerError(datos.error);
    return {
      errores,
      valores,
      error:
        errores.actividades || errores.repuestos || errores.personal
          ? "Revisa las actividades y los repuestos."
          : undefined,
    };
  }
  const archivos = fd
    .getAll("fotos")
    .filter((f): f is File => f instanceof File && f.size > 0);
  if (archivos.length > MAX_FOTOS) {
    return { valores, error: MENSAJES.fotos_maximo };
  }
  if (archivos.some((f) => f.size > MAX_BYTES_IMAGEN)) {
    return { valores, error: MENSAJES.foto_no_valida };
  }
  const fotos = await Promise.all(
    archivos.map(async (f) => new Uint8Array(await f.arrayBuffer())),
  );
  const r = await ejecutarPreventivo(
    await obtenerActor(),
    datos.data,
    fotos,
    await reposPreventivos(),
  );
  return terminar(r, valores, "Preventivo ejecutado. Queda por validar.");
}

export async function validarPreventivoAction(
  _previo: EstadoPreventivo,
  fd: FormData,
): Promise<EstadoPreventivo> {
  const valores = valoresDe(fd, ["preventivoId", "decision", "nota", "clave"]);
  const datos = validarPreventivoSchema.safeParse(valores);
  if (!datos.success) return { errores: primerError(datos.error), valores };
  const r = await validarPreventivo(
    await obtenerActor(),
    datos.data,
    await reposPreventivos(),
  );
  return terminar(
    r,
    valores,
    datos.data.decision === "APROBAR"
      ? "Preventivo validado."
      : "Preventivo devuelto.",
  );
}

export async function reprogramarAction(
  _previo: EstadoPreventivo,
  fd: FormData,
): Promise<EstadoPreventivo> {
  const valores = valoresDe(fd, ["preventivoId", "fecha", "clave"]);
  const datos = reprogramarSchema.safeParse(valores);
  if (!datos.success) return { errores: primerError(datos.error), valores };
  const r = await reprogramarPreventivo(
    await obtenerActor(),
    datos.data,
    await reposPreventivos(),
  );
  return terminar(r, valores, "Preventivo reprogramado.");
}

export async function backlogObservacionAction(
  _previo: EstadoPreventivo,
  fd: FormData,
): Promise<EstadoPreventivo> {
  const valores = valoresDe(fd, ["preventivoId", "actividadId", "criticidad"]);
  const datos = backlogObservacionSchema.safeParse(valores);
  if (!datos.success) return { errores: primerError(datos.error), valores };
  const r = await generarBacklogDesdeObservacion(
    await obtenerActor(),
    datos.data,
    await reposPreventivos(),
  );
  return terminar(r, valores, "Backlog creado en la bandeja de trabajos.");
}

export type EstadoImportacion = {
  error?: string;
  resumen?: ResumenImportacion;
};

const MENSAJES_ARCHIVO: Record<string, string> = {
  ARCHIVO_GRANDE: "El archivo pasa de 512 KB.",
  VACIO: "El archivo no tiene filas debajo del encabezado.",
  DEMASIADAS_FILAS: `Máximo ${LIMITES_CSV.filas} filas por archivo.`,
  COLUMNAS:
    "Faltan columnas. Se necesitan EQUIPO, PLAN, TIPO, FECHA y RESPONSABLE.",
  NO_TEXTO: "El archivo no es un CSV de texto (UTF-8).",
};

export async function importarAction(
  _previo: EstadoImportacion,
  fd: FormData,
): Promise<EstadoImportacion> {
  const archivo = fd.get("archivo");
  if (!(archivo instanceof File) || archivo.size === 0) {
    return { error: "Elige un archivo .csv." };
  }
  // El tamaño se revisa antes de leerlo en memoria.
  if (archivo.size > LIMITES_CSV.bytes) {
    return { error: MENSAJES_ARCHIVO.ARCHIVO_GRANDE };
  }
  let texto: string;
  try {
    texto = new TextDecoder("utf-8", { fatal: true }).decode(
      await archivo.arrayBuffer(),
    );
  } catch {
    return { error: MENSAJES_ARCHIVO.NO_TEXTO };
  }
  const r = await importarPreventivos(
    await obtenerActor(),
    texto,
    await reposPreventivos(),
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

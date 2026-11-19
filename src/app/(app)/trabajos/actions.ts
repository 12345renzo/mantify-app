"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { obtenerActor } from "@/modules/acceso/infrastructure/sesion";
import {
  abrirOrdenTrabajo,
  cambiarEstadoRequisicion,
  cerrarReporte,
  crearBacklog,
  crearRequisicion,
  editarBacklog,
  guardarMiFirma,
  reabrirTrabajo,
  validarTrabajo,
} from "@/modules/trabajos/application/casos-uso";
import {
  abrirOtSchema,
  cerrarReporteSchema,
  crearBacklogSchema,
  editarBacklogSchema,
  estadoRequisicionSchema,
  reabrirSchema,
  requisicionSchema,
  validarSchema,
} from "@/modules/trabajos/application/esquemas";
import { MAX_BYTES_IMAGEN, MAX_FOTOS } from "@/modules/trabajos/domain/fotos";
import { reposTrabajos } from "@/modules/trabajos/infrastructure";
import type { DomainError } from "@/shared/kernel/errors";
import type { Result } from "@/shared/kernel/result";
import { mensajeError } from "../mensajes";

export type EstadoTrabajo = {
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

// Mensajes de las reglas del dominio y de la base (mismo texto clave en las dos barreras).
const MENSAJES: Record<string, string> = {
  sin_firma:
    "Primero registra tu firma: menú de tu perfil (arriba a la derecha) → «Mi firma».",
  sin_ot: "El trabajo no tiene una OT abierta.",
  no_responsable: "Solo el responsable de la OT puede hacerlo.",
  propio_cierre: "No puedes validar un trabajo que cerraste tú.",
  fotos_maximo: `Máximo ${MAX_FOTOS} fotos.`,
  foto_no_valida: "Solo fotos JPG, PNG o WEBP de hasta 2 MB.",
  subida_fallida: "No se pudo subir la foto. Inténtalo de nuevo.",
  nota_obligatoria: "Escribe el motivo (mínimo 5 caracteres).",
  fecha_futura: "La fecha no puede ser posterior a hoy.",
  fecha_antes_observacion:
    "La fecha de cierre no puede ser antes de la observación.",
  equipo_no_valido: "El equipo ya no está disponible. Recarga la página.",
  sistema_no_valido: "El sistema ya no está activo. Elige otro.",
  responsable_no_valido: "Esa persona ya no está activa. Elige otra.",
};

const errorTrabajo = (e: DomainError) => ({
  error: mensajeError(e, {
    VALIDATION: MENSAJES[e.message],
    FORBIDDEN: MENSAJES[e.message],
    CONFLICT:
      "Otra persona cambió este trabajo mientras trabajabas. Cierra y recarga la página.",
  }),
});

// Fotos de un campo de archivo: cantidad y tamaño se revisan antes de leerlas en memoria.
async function fotosDe(
  fd: FormData,
): Promise<{ ok: true; bytes: Uint8Array[] } | { ok: false; error: string }> {
  const archivos = fd
    .getAll("fotos")
    .filter((f): f is File => f instanceof File && f.size > 0);
  if (archivos.length > MAX_FOTOS) {
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

function terminar(
  r: Result<unknown>,
  valores: Record<string, string>,
  exito: string,
): EstadoTrabajo {
  if (!r.ok) return { valores, ...errorTrabajo(r.error) };
  refresh();
  return { exito };
}

const CAMPOS_BACKLOG = [
  "sistemaId",
  "componente",
  "criticidad",
  "descripcion",
  "fechaObservacion",
  "fechaProgramada",
  "costoEstimado",
];

export async function crearBacklogAction(
  _previo: EstadoTrabajo,
  fd: FormData,
): Promise<EstadoTrabajo> {
  const valores = valoresDe(fd, [...CAMPOS_BACKLOG, "equipoId", "clave"]);
  const datos = crearBacklogSchema.safeParse(valores);
  if (!datos.success) return { errores: primerError(datos.error), valores };
  const fotos = await fotosDe(fd);
  if (!fotos.ok) return { valores, error: fotos.error };
  const r = await crearBacklog(
    await obtenerActor(),
    datos.data,
    fotos.bytes,
    await reposTrabajos(),
  );
  if (!r.ok) return { valores, ...errorTrabajo(r.error) };
  redirect(`/trabajos/${r.value.id}`);
}

export async function editarBacklogAction(
  _previo: EstadoTrabajo,
  fd: FormData,
): Promise<EstadoTrabajo> {
  const valores = valoresDe(fd, [...CAMPOS_BACKLOG, "id", "version", "motivo"]);
  const datos = editarBacklogSchema.safeParse(valores);
  if (!datos.success) return { errores: primerError(datos.error), valores };
  const r = await editarBacklog(
    await obtenerActor(),
    datos.data,
    await reposTrabajos(),
  );
  return terminar(r, valores, "Cambios guardados.");
}

export async function abrirOtAction(
  _previo: EstadoTrabajo,
  fd: FormData,
): Promise<EstadoTrabajo> {
  const valores = valoresDe(fd, ["backlogId", "responsableId", "clave"]);
  const datos = abrirOtSchema.safeParse(valores);
  if (!datos.success) return { errores: primerError(datos.error), valores };
  const r = await abrirOrdenTrabajo(
    await obtenerActor(),
    datos.data,
    await reposTrabajos(),
  );
  return terminar(r, valores, "OT abierta.");
}

export async function requisicionAction(
  _previo: EstadoTrabajo,
  fd: FormData,
): Promise<EstadoTrabajo> {
  const valores = valoresDe(fd, [
    "backlogId",
    "descripcion",
    "cantidad",
    "unidad",
    "clave",
  ]);
  const datos = requisicionSchema.safeParse(valores);
  if (!datos.success) return { errores: primerError(datos.error), valores };
  const r = await crearRequisicion(
    await obtenerActor(),
    datos.data,
    await reposTrabajos(),
  );
  return terminar(r, valores, "Requisición creada.");
}

export async function estadoRequisicionAction(
  _previo: EstadoTrabajo,
  fd: FormData,
): Promise<EstadoTrabajo> {
  const datos = estadoRequisicionSchema.safeParse(
    valoresDe(fd, ["id", "estado"]),
  );
  if (!datos.success) return { error: "Acción no válida." };
  const r = await cambiarEstadoRequisicion(
    await obtenerActor(),
    datos.data,
    await reposTrabajos(),
  );
  return terminar(r, {}, "Requisición actualizada.");
}

export async function cerrarReporteAction(
  _previo: EstadoTrabajo,
  fd: FormData,
): Promise<EstadoTrabajo> {
  const valores = valoresDe(fd, [
    "backlogId",
    "fecha",
    "horometro",
    "notas",
    "clave",
  ]);
  const datos = cerrarReporteSchema.safeParse(valores);
  if (!datos.success) return { errores: primerError(datos.error), valores };
  const fotos = await fotosDe(fd);
  if (!fotos.ok) return { valores, error: fotos.error };
  const r = await cerrarReporte(
    await obtenerActor(),
    datos.data,
    fotos.bytes,
    await reposTrabajos(),
  );
  return terminar(r, valores, "Trabajo cerrado. Queda por validar.");
}

export async function validarAction(
  _previo: EstadoTrabajo,
  fd: FormData,
): Promise<EstadoTrabajo> {
  const valores = valoresDe(fd, ["backlogId", "decision", "nota", "clave"]);
  const datos = validarSchema.safeParse(valores);
  if (!datos.success) return { errores: primerError(datos.error), valores };
  const r = await validarTrabajo(
    await obtenerActor(),
    datos.data,
    await reposTrabajos(),
  );
  return terminar(
    r,
    valores,
    datos.data.decision === "APROBAR"
      ? "Trabajo aprobado."
      : "Trabajo devuelto.",
  );
}

export async function reabrirAction(
  _previo: EstadoTrabajo,
  fd: FormData,
): Promise<EstadoTrabajo> {
  const valores = valoresDe(fd, ["backlogId", "nota", "clave"]);
  const datos = reabrirSchema.safeParse(valores);
  if (!datos.success) return { errores: primerError(datos.error), valores };
  const r = await reabrirTrabajo(
    await obtenerActor(),
    datos.data,
    await reposTrabajos(),
  );
  return terminar(r, valores, "Trabajo reabierto.");
}

export async function miFirmaAction(): Promise<string | null> {
  const actor = await obtenerActor();
  if (!actor?.habilitado || !actor.empresaId) return null;
  return (await reposTrabajos()).lector.miFirma();
}

export async function guardarFirmaAction(
  _previo: EstadoTrabajo,
  fd: FormData,
): Promise<EstadoTrabajo> {
  const firma = fd.get("firma");
  if (!(firma instanceof File) || firma.size === 0) {
    return { error: "Elige la imagen de tu firma." };
  }
  // El tipo real, que el archivo esté completo y sus medidas los revisa el caso de uso.
  const invalida =
    "La imagen no es válida: solo PNG o JPG, de hasta 2 MB y mínimo 100×30 px.";
  if (firma.size > MAX_BYTES_IMAGEN) return { error: invalida };
  const r = await guardarMiFirma(
    await obtenerActor(),
    new Uint8Array(await firma.arrayBuffer()),
    await reposTrabajos(),
  );
  if (!r.ok && r.error.message === "foto_no_valida") return { error: invalida };
  return terminar(r, {}, "Firma guardada.");
}

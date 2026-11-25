"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { obtenerActor } from "@/modules/acceso/infrastructure/sesion";
import {
  configurarAvisoEngrase,
  guardarPlanEngrase,
  registrarEngrase,
} from "@/modules/engrase/application/casos-uso";
import {
  avisoSchema,
  planSchema,
  registroSchema,
} from "@/modules/engrase/application/esquemas";
import { reposEngrase } from "@/modules/engrase/infrastructure";
import type { DomainError } from "@/shared/kernel/errors";
import type { Result } from "@/shared/kernel/result";
import { mensajeError } from "../mensajes";

export type EstadoEngraseForm = {
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
  observacion_obligatoria:
    "Quedan puntos sin engrasar: escribe la observación (mínimo 3 caracteres).",
  punto_no_valido: "Los puntos cambiaron. Cierra y recarga la página.",
  sin_puntos:
    "Este equipo no tiene puntos de engrase. Crea su plan o agrega plantillas en Catálogos → Puntos de engrase.",
  horometro_menor:
    "El horómetro no puede ser menor que el del último engrase de este equipo.",
  horometro_no_valido: "Horómetro fuera de rango.",
  fecha_futura: "La fecha no puede ser posterior a hoy.",
  fecha_anterior:
    "La fecha no puede ser anterior a la del último engrase de este equipo.",
  grasa_no_valida: "Ese tipo de grasa ya no está activo. Elige otro.",
  frecuencia_obligatoria:
    "Indica cada cuántas horas, cada cuántos días, o ambos.",
  puntos_obligatorios: "Agrega al menos un punto de engrase.",
  puntos_maximo: "Máximo 50 puntos.",
  punto_repetido: "Hay puntos repetidos.",
  datos_incompletos: "Completa la fecha y el horómetro.",
};

const errorEngrase = (e: DomainError) => ({
  error: mensajeError(e, {
    VALIDATION: MENSAJES[e.message],
    NOT_FOUND:
      "Ese equipo ya no se engrasa o no existe. Cierra y recarga la página.",
    CONFLICT: "Este registro ya se guardó. Cierra y recarga la página.",
  }),
});

function terminar(
  r: Result<unknown>,
  valores: Record<string, string>,
  exito: string,
): EstadoEngraseForm {
  if (!r.ok) return { valores, ...errorEngrase(r.error) };
  refresh();
  return { exito };
}

export async function guardarPlanAction(
  _previo: EstadoEngraseForm,
  fd: FormData,
): Promise<EstadoEngraseForm> {
  const valores = valoresDe(fd, [
    "equipoId",
    "cadaHoras",
    "cadaDias",
    "tipoGrasaId",
  ]);
  const datos = planSchema.safeParse({
    ...valores,
    puntos: fd.getAll("punto").map(String),
  });
  if (!datos.success) return { errores: primerError(datos.error), valores };
  const r = await guardarPlanEngrase(
    await obtenerActor(),
    datos.data,
    await reposEngrase(),
  );
  return terminar(r, valores, "Plan de engrase guardado.");
}

export async function registrarAction(
  _previo: EstadoEngraseForm,
  fd: FormData,
): Promise<EstadoEngraseForm> {
  const valores = valoresDe(fd, [
    "equipoId",
    "fecha",
    "horometro",
    "tipoGrasaId",
    "observacion",
    "clave",
  ]);
  const datos = registroSchema.safeParse({
    ...valores,
    engrasados: fd.getAll("engrasado").map(String),
  });
  if (!datos.success) return { errores: primerError(datos.error), valores };
  const r = await registrarEngrase(
    await obtenerActor(),
    datos.data,
    await reposEngrase(),
  );
  return terminar(r, valores, "Engrase registrado.");
}

export async function configurarAvisoAction(
  _previo: EstadoEngraseForm,
  fd: FormData,
): Promise<EstadoEngraseForm> {
  const valores = valoresDe(fd, ["tipo", "valor"]);
  const datos = avisoSchema.safeParse(valores);
  if (!datos.success) return { errores: primerError(datos.error), valores };
  const r = await configurarAvisoEngrase(
    await obtenerActor(),
    datos.data,
    await reposEngrase(),
  );
  return terminar(r, valores, "Aviso de engrase actualizado.");
}

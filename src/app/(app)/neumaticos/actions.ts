"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { obtenerActor } from "@/modules/acceso/infrastructure/sesion";
import {
  definirPosiciones,
  desmontarNeumatico,
  guardarNeumatico,
  guardarUmbrales,
  medirNeumaticos,
  montarNeumatico,
  recaparNeumatico,
  rotarNeumaticos,
} from "@/modules/neumaticos/application/casos-uso";
import {
  desmontarSchema,
  medirSchema,
  montarSchema,
  neumaticoSchema,
  posicionesSchema,
  recaparSchema,
  rotarSchema,
  umbralesSchema,
} from "@/modules/neumaticos/application/esquemas";
import { reposNeumaticos } from "@/modules/neumaticos/infrastructure";
import type { DomainError } from "@/shared/kernel/errors";
import type { Result } from "@/shared/kernel/result";
import { mensajeError } from "../mensajes";

export type EstadoNeumaticoForm = {
  error?: string;
  exito?: string;
  errores?: Record<string, string | undefined>;
  valores?: Record<string, string>;
};

const valoresDe = (fd: FormData) =>
  Object.fromEntries([...fd.entries()].map(([k, v]) => [k, String(v)]));

const primerError = (e: z.ZodError) =>
  Object.fromEntries(
    Object.entries(z.flattenError(e).fieldErrors).map(([k, v]) => [
      k,
      (v as string[] | undefined)?.[0],
    ]),
  );

// Mismo texto clave en la app y en la base.
const MENSAJES: Record<string, string> = {
  no_en_stock: "Esa cubierta ya no está en stock. Recarga la página.",
  posicion_ocupada: "Esa posición tiene una cubierta montada.",
  cocada_fuera_de_rango: "La cocada no puede superar la cocada nueva + 5 mm.",
  medicion_fuera_de_rango: "Cada punto va de 0 a la cocada nueva + 5 mm.",
  presion_fuera_de_rango: "Presión entre 0 y 200 psi.",
  neumatico_no_montado:
    "Una cubierta ya no está montada en este equipo. Recarga la página.",
  no_montado: "Esa cubierta ya no está montada. Recarga la página.",
  fecha_futura: "La fecha no puede ser posterior a hoy.",
  fecha_anterior: "La fecha no puede ser anterior al montaje.",
  horometro_menor: "El horómetro no puede ser menor que el del montaje.",
  destino_no_valido: "Elige el destino.",
  motivo_no_valido: "Ese motivo ya no está activo. Elige otro.",
  misma_posicion: "Elige otra posición.",
  otro_equipo: "Solo se rota entre posiciones del mismo equipo.",
  origen_vacio: "Esa posición ya no tiene cubierta. Recarga la página.",
  no_en_recapado: "Esa cubierta no está en recapado.",
  posiciones_no_validas:
    "Una línea por eje, posiciones separadas por | (letras, números o guion; máx. 10 caracteres), sin repetir.",
  sin_mediciones: "Completa los tres puntos de al menos una cubierta.",
  datos_incompletos: "Completa la fecha y el horómetro.",
};

const errorNeumatico = (e: DomainError) => ({
  error: mensajeError(e, {
    VALIDATION: MENSAJES[e.message],
    NOT_FOUND:
      "No encontramos la cubierta, la posición o el equipo. Recarga la página.",
    CONFLICT: e.message.includes("codigo")
      ? "Ya hay una cubierta con ese código."
      : "Otra persona cambió esta posición o cubierta. Cierra y recarga la página.",
  }),
});

async function ejecutar<T>(
  fd: FormData,
  esquema: z.ZodType<T>,
  datos: unknown,
  caso: (d: T) => Promise<Result<unknown>>,
  exito: string,
): Promise<EstadoNeumaticoForm> {
  const valores = valoresDe(fd);
  const r = esquema.safeParse(datos);
  if (!r.success) return { errores: primerError(r.error), valores };
  const x = await caso(r.data);
  if (!x.ok) return { valores, ...errorNeumatico(x.error) };
  refresh();
  return { exito };
}

const campos = (fd: FormData, nombres: string[]) =>
  Object.fromEntries(nombres.map((c) => [c, String(fd.get(c) ?? "")]));

export async function guardarNeumaticoAction(
  _p: EstadoNeumaticoForm,
  fd: FormData,
) {
  const d = campos(fd, [
    "id",
    "codigo",
    "marca",
    "modelo",
    "medida",
    "cocadaNueva",
    "costo",
    "clave",
  ]);
  return ejecutar(
    fd,
    neumaticoSchema,
    d,
    async (x) =>
      guardarNeumatico(await obtenerActor(), x, await reposNeumaticos()),
    d.id ? "Cubierta actualizada." : "Cubierta cargada.",
  );
}

export async function posicionesAction(_p: EstadoNeumaticoForm, fd: FormData) {
  return ejecutar(
    fd,
    posicionesSchema,
    campos(fd, ["equipoId", "layout"]),
    async (x) =>
      definirPosiciones(await obtenerActor(), x, await reposNeumaticos()),
    "Posiciones guardadas.",
  );
}

export async function umbralesAction(_p: EstadoNeumaticoForm, fd: FormData) {
  const [destino = "", destinoId = ""] = String(fd.get("destino") ?? "").split(
    ":",
  );
  return ejecutar(
    fd,
    umbralesSchema,
    {
      destino,
      destinoId,
      quitar: fd.get("quitar") === "on" ? "on" : "",
      ...campos(fd, [
        "cocadaMinima",
        "cocadaAlerta",
        "diasSinMedir",
        "diferenciaMaxima",
      ]),
    },
    async (x) =>
      guardarUmbrales(await obtenerActor(), x, await reposNeumaticos()),
    "Umbrales guardados.",
  );
}

export async function montarAction(_p: EstadoNeumaticoForm, fd: FormData) {
  return ejecutar(
    fd,
    montarSchema,
    campos(fd, [
      "neumaticoId",
      "posicionId",
      "fecha",
      "horometro",
      "cocada",
      "clave",
    ]),
    async (x) =>
      montarNeumatico(await obtenerActor(), x, await reposNeumaticos()),
    "Cubierta montada.",
  );
}

export async function desmontarAction(_p: EstadoNeumaticoForm, fd: FormData) {
  return ejecutar(
    fd,
    desmontarSchema,
    campos(fd, [
      "neumaticoId",
      "fecha",
      "horometro",
      "motivoId",
      "destino",
      "clave",
    ]),
    async (x) =>
      desmontarNeumatico(await obtenerActor(), x, await reposNeumaticos()),
    "Cubierta desmontada.",
  );
}

export async function rotarAction(_p: EstadoNeumaticoForm, fd: FormData) {
  return ejecutar(
    fd,
    rotarSchema,
    campos(fd, ["origenId", "destinoId", "fecha", "horometro", "clave"]),
    async (x) =>
      rotarNeumaticos(await obtenerActor(), x, await reposNeumaticos()),
    "Rotación registrada.",
  );
}

export async function recaparAction(_p: EstadoNeumaticoForm, fd: FormData) {
  return ejecutar(
    fd,
    recaparSchema,
    campos(fd, ["neumaticoId", "costo", "cocadaNueva", "clave"]),
    async (x) =>
      recaparNeumatico(await obtenerActor(), x, await reposNeumaticos()),
    "Recapado registrado: la cubierta vuelve a stock.",
  );
}

export async function medirAction(_p: EstadoNeumaticoForm, fd: FormData) {
  // Una fila por cubierta ("interno:<id>"...); se mandan las que tienen los tres puntos.
  const ids = [...fd.keys()]
    .filter((k) => k.startsWith("interno:"))
    .map((k) => k.slice(8));
  const mediciones = ids
    .map((id) => ({
      neumaticoId: id,
      interno: String(fd.get(`interno:${id}`) ?? ""),
      centro: String(fd.get(`centro:${id}`) ?? ""),
      externo: String(fd.get(`externo:${id}`) ?? ""),
      presion: String(fd.get(`presion:${id}`) ?? ""),
    }))
    .filter((m) => m.interno.trim() || m.centro.trim() || m.externo.trim());
  const r = await ejecutar(
    fd,
    medirSchema,
    { ...campos(fd, ["equipoId", "fecha", "horometro", "clave"]), mediciones },
    async (x) =>
      medirNeumaticos(await obtenerActor(), x, await reposNeumaticos()),
    "Medición registrada.",
  );
  return r.errores?.mediciones ||
    Object.keys(r.errores ?? {}).some((k) => k.startsWith("mediciones"))
    ? {
        ...r,
        error:
          "Revisa las medidas: tres puntos por cubierta, en mm con punto decimal.",
      }
    : r;
}

"use server";

import { refresh } from "next/cache";
import { obtenerActor } from "@/modules/acceso/infrastructure/sesion";
import { cambiarPrecioPlan } from "@/modules/plataforma/application/cambiar-precio-plan";
import { cambiarPrecioSchema } from "@/modules/plataforma/application/esquemas";
import { reposPlataforma } from "@/modules/plataforma/infrastructure";
import { mensajeError } from "../mensajes";

export type EstadoPrecio = { error?: string; exito?: string };

export async function cambiarPrecioAction(
  _previo: EstadoPrecio,
  fd: FormData,
): Promise<EstadoPrecio> {
  const datos = cambiarPrecioSchema.safeParse({
    planId: fd.get("planId"),
    precioMensual: fd.get("precioMensual"),
  });
  if (!datos.success) {
    return { error: datos.error.issues[0]?.message ?? "Revisa el precio." };
  }
  const repos = await reposPlataforma();
  const r = await cambiarPrecioPlan(await obtenerActor(), datos.data, repos);
  if (!r.ok) return { error: mensajeError(r.error) };
  refresh();
  return { exito: "Precio actualizado." };
}

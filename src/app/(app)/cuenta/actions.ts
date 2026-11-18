"use server";

import { z } from "zod";
import { obtenerActor } from "@/modules/acceso/infrastructure/sesion";
import { cambiarClave } from "@/modules/identidad/application/cambiar-clave";
import { cambiarClaveSchema } from "@/modules/identidad/application/esquemas";
import { reposIdentidad } from "@/modules/identidad/infrastructure";
import { mensajeError } from "../mensajes";

export type EstadoClave = {
  error?: string;
  exito?: string;
  errores?: Record<string, string | undefined>;
};

export async function cambiarClaveAction(
  _previo: EstadoClave,
  fd: FormData,
): Promise<EstadoClave> {
  const datos = cambiarClaveSchema.safeParse({
    actual: fd.get("actual") ?? "",
    nueva: fd.get("nueva") ?? "",
    repetir: fd.get("repetir") ?? "",
  });
  if (!datos.success) {
    return {
      errores: Object.fromEntries(
        Object.entries(z.flattenError(datos.error).fieldErrors).map(
          ([k, v]) => [k, (v as string[] | undefined)?.[0]],
        ),
      ),
    };
  }
  const r = await cambiarClave(
    await obtenerActor(),
    datos.data,
    await reposIdentidad(),
  );
  if (!r.ok) {
    return {
      error: mensajeError(r.error, {
        VALIDATION:
          r.error.message === "clave débil"
            ? "Esa contraseña es muy débil. Usa una más larga o menos común."
            : "La contraseña actual no es correcta.",
      }),
    };
  }
  return { exito: "Contraseña actualizada." };
}

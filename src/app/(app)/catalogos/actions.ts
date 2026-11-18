"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { obtenerActor } from "@/modules/acceso/infrastructure/sesion";
import {
  cambiarActivoElemento,
  guardarElemento,
} from "@/modules/catalogos/application/casos-uso";
import {
  cambiarActivoSchema,
  catalogoSchema,
  esquemaElemento,
} from "@/modules/catalogos/application/esquemas";
import {
  CATALOGOS,
  camposEditables,
} from "@/modules/catalogos/domain/catalogos";
import { reposCatalogos } from "@/modules/catalogos/infrastructure";
import { mensajeError } from "../mensajes";

export type EstadoCatalogo = {
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

export async function guardarElementoAction(
  _previo: EstadoCatalogo,
  fd: FormData,
): Promise<EstadoCatalogo> {
  const catalogo = catalogoSchema.safeParse(fd.get("catalogo"));
  if (!catalogo.success) return { error: "Catálogo no válido." };
  const def = CATALOGOS[catalogo.data];
  const valores = valoresDe(fd, [
    "id",
    ...camposEditables(def).map((c) => c.clave),
  ]);
  const datos = esquemaElemento(catalogo.data).safeParse(valores);
  if (!datos.success) return { errores: primerError(datos.error), valores };

  const r = await guardarElemento(
    await obtenerActor(),
    { catalogo: catalogo.data, ...datos.data },
    await reposCatalogos(),
  );
  if (!r.ok) {
    return {
      valores,
      error: mensajeError(r.error, {
        CONFLICT: def.unico
          ? `Ya existe ${def.unico} (sin contar mayúsculas ni tildes).`
          : undefined,
        VALIDATION: "Revisa los datos: alguno no es válido para la base.",
      }),
    };
  }
  refresh();
  return { exito: datos.data.id ? "Cambios guardados." : "Elemento creado." };
}

export async function cambiarActivoAction(
  _previo: EstadoCatalogo,
  fd: FormData,
): Promise<EstadoCatalogo> {
  const datos = cambiarActivoSchema.safeParse(
    valoresDe(fd, ["catalogo", "id", "activo"]),
  );
  if (!datos.success) return { error: "Elemento no válido." };
  const r = await cambiarActivoElemento(
    await obtenerActor(),
    datos.data,
    await reposCatalogos(),
  );
  if (!r.ok) {
    return {
      error: mensajeError(r.error, {
        CONFLICT: "Ya hay otro igual. Cámbialo antes de activarlo.",
        EN_USO:
          "No se puede desactivar: lo usan equipos activos. Cámbialos o desmovilízalos primero.",
      }),
    };
  }
  refresh();
  return { exito: datos.data.activo ? "Activado." : "Desactivado." };
}

"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { obtenerActor } from "@/modules/acceso/infrastructure/sesion";
import { darDeBajaEmpresa } from "@/modules/plataforma/application/dar-de-baja-empresa";
import { editarEmpresa } from "@/modules/plataforma/application/editar-empresa";
import { renovarEmpresa } from "@/modules/plataforma/application/renovar-empresa";
import { crearEmpresa } from "@/modules/plataforma/application/crear-empresa";
import {
  darDeBajaSchema,
  crearEmpresaSchema,
  editarEmpresaSchema,
  renovarEmpresaSchema,
} from "@/modules/plataforma/application/esquemas";
import { reposPlataforma } from "@/modules/plataforma/infrastructure";
import { formatoFecha } from "@/shared/ui/formato";
import { mensajeError } from "../mensajes";

export type EstadoFormulario = {
  error?: string;
  exito?: string;
  errores?: Record<string, string | undefined>;
  valores?: Record<string, string>;
};

const primerError = (e: z.ZodError) =>
  Object.fromEntries(
    Object.entries(z.flattenError(e).fieldErrors).map(([k, v]) => [
      k,
      (v as string[] | undefined)?.[0],
    ]),
  );

const valoresDe = (fd: FormData, campos: string[]) =>
  Object.fromEntries(campos.map((c) => [c, String(fd.get(c) ?? "")]));

const CAMPOS_EMPRESA = [
  "nombre",
  "razonSocial",
  "ruc",
  "correoContacto",
  "planId",
  "diasGracia",
];

export async function crearEmpresaAction(
  _previo: EstadoFormulario,
  fd: FormData,
): Promise<EstadoFormulario> {
  const valores = valoresDe(fd, CAMPOS_EMPRESA);
  const datos = crearEmpresaSchema.safeParse(valores);
  if (!datos.success) return { errores: primerError(datos.error), valores };

  const repos = await reposPlataforma();
  const r = await crearEmpresa(await obtenerActor(), datos.data, repos);
  if (!r.ok) {
    return {
      valores,
      error: mensajeError(r.error, {
        CONFLICT: "Ya existe una empresa con ese RUC.",
      }),
      errores:
        r.error.code === "CONFLICT"
          ? { ruc: "Este RUC ya está registrado." }
          : undefined,
    };
  }
  redirect(`/empresas/${r.value.id}`);
}

export async function darDeBajaAction(
  _previo: EstadoFormulario,
  fd: FormData,
): Promise<EstadoFormulario> {
  const datos = darDeBajaSchema.safeParse(valoresDe(fd, ["empresaId"]));
  if (!datos.success) return { error: "Acción no válida." };

  const r = await darDeBajaEmpresa(
    await obtenerActor(),
    datos.data,
    await reposPlataforma(),
  );
  if (!r.ok) {
    return {
      error: mensajeError(r.error, {
        CONFLICT: "La empresa ya está de baja. Recarga la página.",
      }),
    };
  }
  refresh();
  return { exito: "Empresa dada de baja." };
}

export async function editarEmpresaAction(
  _previo: EstadoFormulario,
  fd: FormData,
): Promise<EstadoFormulario> {
  const valores = valoresDe(fd, [
    "empresaId",
    ...CAMPOS_EMPRESA.filter((c) => c !== "planId"),
  ]);
  const datos = editarEmpresaSchema.safeParse(valores);
  if (!datos.success) return { errores: primerError(datos.error), valores };

  const r = await editarEmpresa(
    await obtenerActor(),
    datos.data,
    await reposPlataforma(),
  );
  if (!r.ok) {
    return {
      valores,
      error: mensajeError(r.error, {
        CONFLICT: "Ya existe una empresa con ese RUC.",
      }),
      errores:
        r.error.code === "CONFLICT"
          ? { ruc: "Este RUC ya está registrado." }
          : undefined,
    };
  }
  refresh();
  return { exito: "Datos guardados." };
}

export async function renovarEmpresaAction(
  _previo: EstadoFormulario,
  fd: FormData,
): Promise<EstadoFormulario> {
  const valores = valoresDe(fd, ["empresaId", "planId", "referencia"]);
  const datos = renovarEmpresaSchema.safeParse(valores);
  if (!datos.success) return { errores: primerError(datos.error), valores };

  const r = await renovarEmpresa(
    await obtenerActor(),
    datos.data,
    await reposPlataforma(),
  );
  if (!r.ok) {
    return {
      valores,
      error: mensajeError(r.error, {
        CONFLICT:
          "El plan todavía no está por vencer o ya hay una membresía para ese periodo. Recarga la página.",
        LIMIT: "La empresa tiene más cuentas de las que permite ese plan.",
      }),
    };
  }
  refresh();
  return {
    exito: `Empresa renovada. Cubre del ${formatoFecha(r.value.inicio)} al ${formatoFecha(r.value.fin)}.`,
  };
}

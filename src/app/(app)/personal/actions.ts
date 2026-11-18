"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { obtenerActor } from "@/modules/acceso/infrastructure/sesion";
import { cambiarRolCuenta } from "@/modules/identidad/application/cambiar-rol-cuenta";
import { crearPersona } from "@/modules/identidad/application/crear-persona";
import { crearUsuario } from "@/modules/identidad/application/crear-usuario";
import { editarPersona } from "@/modules/identidad/application/editar-persona";
import { darDeBajaPersona } from "@/modules/identidad/application/dar-de-baja-persona";
import {
  asignarPersonaSchema,
  cambiarRolSchema,
  crearCuentaSchema,
  darBajaSchema,
  personaSchema,
} from "@/modules/identidad/application/esquemas";
import { reactivarPersona } from "@/modules/identidad/application/reactivar-persona";
import { reemplazarPersona } from "@/modules/identidad/application/reemplazar-persona";
import { reposIdentidad } from "@/modules/identidad/infrastructure";
import { mensajeError } from "../mensajes";

export type EstadoIdentidad = {
  error?: string;
  exito?: string;
  errores?: Record<string, string | undefined>;
  valores?: Record<string, string>;
  // Se devuelve una sola vez, a quien creó o reasignó la cuenta, para que la entregue.
  credenciales?: { correo: string; clave: string };
};

const CAMPOS_PERSONA = [
  "nombres",
  "apellidos",
  "tipoDocumento",
  "numeroDocumento",
  "cargo",
  "telefono",
  "tipoVinculo",
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

const MENSAJES_CUENTA = {
  CONFLICT:
    "Ese correo ya tiene una cuenta, o la persona elegida ya tiene una.",
  LIMIT:
    "Llegaste al límite de cuentas de tu plan. Asigna una cuenta libre en lugar de crear otra.",
  FORBIDDEN: "No puedes crear ni cambiar cuentas con ese rol.",
} as const;

// Persona elegida (personaId) o persona nueva con los campos del formulario.
function leerPersona(fd: FormData, personaId: string | null) {
  if (personaId) return { ok: true as const, persona: null };
  const r = personaSchema.safeParse(valoresDe(fd, CAMPOS_PERSONA));
  return r.success
    ? { ok: true as const, persona: r.data }
    : { ok: false as const, errores: primerError(r.error) };
}

export async function crearPersonaAction(
  _previo: EstadoIdentidad,
  fd: FormData,
): Promise<EstadoIdentidad> {
  const valores = valoresDe(fd, CAMPOS_PERSONA);
  const datos = personaSchema.safeParse(valores);
  if (!datos.success) return { errores: primerError(datos.error), valores };

  const r = await crearPersona(
    await obtenerActor(),
    { empresaId: null, persona: datos.data },
    await reposIdentidad(),
  );
  if (!r.ok) {
    return {
      valores,
      error: mensajeError(r.error, {
        CONFLICT: "Ya hay una persona activa con ese documento.",
      }),
    };
  }
  refresh();
  return { exito: "Persona registrada." };
}

export async function crearCuentaAction(
  _previo: EstadoIdentidad,
  fd: FormData,
): Promise<EstadoIdentidad> {
  const valores = valoresDe(fd, [
    "empresaId",
    "rol",
    "correo",
    "personaId",
    ...CAMPOS_PERSONA,
  ]);
  const cuenta = crearCuentaSchema.safeParse(valores);
  const persona = leerPersona(
    fd,
    cuenta.success ? cuenta.data.personaId : null,
  );
  if (!cuenta.success || !persona.ok) {
    return {
      valores,
      errores: {
        ...(cuenta.success ? {} : primerError(cuenta.error)),
        ...(persona.ok ? {} : persona.errores),
      },
    };
  }

  const r = await crearUsuario(
    await obtenerActor(),
    { ...cuenta.data, personaNueva: persona.persona },
    await reposIdentidad(),
  );
  if (!r.ok) return { valores, error: mensajeError(r.error, MENSAJES_CUENTA) };
  refresh();
  return {
    exito: "Cuenta creada.",
    credenciales: { correo: r.value.correo, clave: r.value.clave },
  };
}

export async function asignarPersonaAction(
  _previo: EstadoIdentidad,
  fd: FormData,
): Promise<EstadoIdentidad> {
  const valores = valoresDe(fd, [
    "cuentaId",
    "correo",
    "personaId",
    ...CAMPOS_PERSONA,
  ]);
  const cuenta = asignarPersonaSchema.safeParse(valores);
  if (cuenta.success && !cuenta.data.personaId) {
    return { valores, error: "Elige a una persona del personal." };
  }
  const persona = leerPersona(
    fd,
    cuenta.success ? cuenta.data.personaId : null,
  );
  if (!cuenta.success || !persona.ok) {
    return {
      valores,
      errores: {
        ...(cuenta.success ? {} : primerError(cuenta.error)),
        ...(persona.ok ? {} : persona.errores),
      },
    };
  }

  const r = await reemplazarPersona(
    await obtenerActor(),
    { ...cuenta.data, personaNueva: persona.persona },
    await reposIdentidad(),
  );
  if (!r.ok) return { valores, error: mensajeError(r.error, MENSAJES_CUENTA) };
  // Sin refresh: la página pasaría a "cuenta ya asignada" y se perdería la clave antes de verla.
  return { exito: "Cuenta asignada.", credenciales: r.value };
}

export async function darBajaAction(
  _previo: EstadoIdentidad,
  fd: FormData,
): Promise<EstadoIdentidad> {
  const datos = darBajaSchema.safeParse({ personaId: fd.get("personaId") });
  if (!datos.success) return { error: "Persona no válida." };
  const r = await darDeBajaPersona(
    await obtenerActor(),
    datos.data,
    await reposIdentidad(),
  );
  if (!r.ok) {
    return {
      error: mensajeError(r.error, {
        FORBIDDEN: "No puedes dar de baja a esta persona.",
        CONFLICT: "Esta persona ya está de baja.",
      }),
    };
  }
  refresh();
  return { exito: "Persona dada de baja. Su cuenta quedó libre y sin acceso." };
}

export async function reactivarAction(
  _previo: EstadoIdentidad,
  fd: FormData,
): Promise<EstadoIdentidad> {
  const datos = darBajaSchema.safeParse({ personaId: fd.get("personaId") });
  if (!datos.success) return { error: "Persona no válida." };
  const r = await reactivarPersona(
    await obtenerActor(),
    datos.data,
    await reposIdentidad(),
  );
  if (!r.ok) {
    return {
      error: mensajeError(r.error, {
        FORBIDDEN: "No puedes reactivar a esta persona.",
        CONFLICT:
          "No se pudo: la persona ya está activa o su documento lo usa otra persona activa.",
      }),
    };
  }
  refresh();
  return { exito: "Persona de vuelta en la cuadrilla." };
}

export async function editarPersonaAction(
  _previo: EstadoIdentidad,
  fd: FormData,
): Promise<EstadoIdentidad> {
  const valores = valoresDe(fd, CAMPOS_PERSONA);
  const id = darBajaSchema.safeParse({ personaId: fd.get("personaId") });
  const datos = personaSchema.safeParse(valores);
  if (!id.success) return { valores, error: "Persona no válida." };
  if (!datos.success) return { errores: primerError(datos.error), valores };

  const r = await editarPersona(
    await obtenerActor(),
    { personaId: id.data.personaId, persona: datos.data },
    await reposIdentidad(),
  );
  if (!r.ok) {
    return {
      valores,
      error: mensajeError(r.error, {
        CONFLICT: "Ya hay una persona activa con ese documento.",
        FORBIDDEN: "No puedes editar a esta persona.",
      }),
    };
  }
  refresh();
  return { exito: "Datos guardados." };
}

export async function cambiarRolAction(
  _previo: EstadoIdentidad,
  fd: FormData,
): Promise<EstadoIdentidad> {
  const datos = cambiarRolSchema.safeParse({
    cuentaId: fd.get("cuentaId"),
    rol: fd.get("rol"),
  });
  if (!datos.success) return { error: "Elige un rol válido." };
  const r = await cambiarRolCuenta(
    await obtenerActor(),
    datos.data,
    await reposIdentidad(),
  );
  if (!r.ok) {
    return {
      error: mensajeError(r.error, {
        FORBIDDEN: "No puedes cambiar el rol de esta cuenta.",
        CONFLICT: "La cuenta ya tiene ese rol.",
      }),
    };
  }
  refresh();
  return { exito: "Rol actualizado." };
}

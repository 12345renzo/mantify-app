import { z } from "zod";
import { ROLES_EMPRESA } from "../domain/permisos";

const opcional = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v === "" ? null : v));

const enumOpcional = <T extends readonly [string, ...string[]]>(valores: T) =>
  z
    .union([z.literal(""), z.enum(valores)])
    .transform((v) => (v === "" ? null : v));

export const personaSchema = z
  .object({
    nombres: z.string().trim().min(1, "Escribe los nombres.").max(80),
    apellidos: z.string().trim().min(1, "Escribe los apellidos.").max(80),
    tipoDocumento: enumOpcional(["DNI", "CE", "PASAPORTE"] as const),
    numeroDocumento: z
      .string()
      .trim()
      .transform((v) => (v === "" ? null : v.toUpperCase()))
      .refine(
        (v) => v === null || /^[A-Z0-9]{6,15}$/.test(v),
        "Entre 6 y 15 letras o números.",
      ),
    cargo: opcional(80),
    telefono: z
      .string()
      .trim()
      .transform((v) => (v === "" ? null : v))
      .refine(
        (v) => v === null || /^[0-9+ ]{6,20}$/.test(v),
        "Solo números, espacios y +.",
      ),
    tipoVinculo: enumOpcional(["PROPIO", "CONTRATISTA"] as const),
  })
  .refine((p) => (p.tipoDocumento === null) === (p.numeroDocumento === null), {
    message: "Indica tipo y número de documento juntos.",
    path: ["numeroDocumento"],
  });
export type PersonaEntrada = z.output<typeof personaSchema>;

const correo = z
  .email("Correo no válido.")
  .max(160)
  .transform((v) => v.trim().toLowerCase());

export const crearCuentaSchema = z.object({
  empresaId: z.union([z.literal(""), z.uuid()]).transform((v) => v || null),
  rol: z.enum(ROLES_EMPRESA, "Elige un rol."),
  correo,
  // Persona existente sin cuenta, o vacío para crear una nueva con los datos de abajo.
  personaId: z.union([z.literal(""), z.uuid()]).transform((v) => v || null),
});

export const asignarPersonaSchema = z.object({
  cuentaId: z.uuid(),
  correo,
  personaId: z.union([z.literal(""), z.uuid()]).transform((v) => v || null),
});

export const cambiarRolSchema = z.object({
  cuentaId: z.uuid(),
  rol: z.enum(ROLES_EMPRESA, "Elige un rol."),
});

export const darBajaSchema = z.object({ personaId: z.uuid() });

export const cambiarClaveSchema = z
  .object({
    actual: z.string().min(1, "Escribe tu contraseña actual.").max(200),
    nueva: z.string().min(12, "Mínimo 12 caracteres.").max(200),
    repetir: z.string(),
  })
  .refine((d) => d.nueva === d.repetir, {
    message: "No coincide con la nueva contraseña.",
    path: ["repetir"],
  })
  .refine((d) => d.nueva !== d.actual, {
    message: "Debe ser distinta de la actual.",
    path: ["nueva"],
  });

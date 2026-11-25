import { z } from "zod";

// Texto opcional de formulario: "" llega como null.
const opcional = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v === "" ? null : v));

export const crearEmpresaSchema = z.object({
  nombre: z.string().trim().min(2, "Escribe el nombre comercial.").max(120),
  razonSocial: opcional(160),
  ruc: z
    .string()
    .trim()
    .regex(/^\d{11}$/, "El RUC debe tener 11 dígitos."),
  correoContacto: z
    .union([z.literal(""), z.email("Correo no válido.").max(160)])
    .transform((v) => (v === "" ? null : v)),
  planId: z.uuid("Elige un plan."),
  diasGracia: z.coerce
    .number()
    .int()
    .min(0, "Entre 0 y 30 días.")
    .max(30, "Entre 0 y 30 días."),
});
export type CrearEmpresaEntrada = z.output<typeof crearEmpresaSchema>;

export const editarEmpresaSchema = crearEmpresaSchema
  .omit({ planId: true })
  .extend({ empresaId: z.uuid() });
export type EditarEmpresaEntrada = z.output<typeof editarEmpresaSchema>;

export const renovarEmpresaSchema = z.object({
  empresaId: z.uuid(),
  planId: z.uuid("Elige un plan."),
  referencia: opcional(80),
});
export type RenovarEmpresaEntrada = z.output<typeof renovarEmpresaSchema>;

export const darDeBajaSchema = z.object({ empresaId: z.uuid() });
export type DarDeBajaEntrada = z.output<typeof darDeBajaSchema>;

export const cambiarPrecioSchema = z.object({
  planId: z.uuid(),
  precioMensual: z.coerce
    .number("Escribe un monto.")
    .positive("El precio debe ser mayor que 0.")
    .max(100_000)
    .multipleOf(0.01, "Máximo dos decimales."),
});
export type CambiarPrecioEntrada = z.output<typeof cambiarPrecioSchema>;

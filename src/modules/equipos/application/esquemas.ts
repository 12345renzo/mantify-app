import { z } from "zod";
import { esFechaISO } from "@/shared/kernel/fechas";
import {
  CODIGO_VALIDO,
  ESTADOS_OPERATIVOS,
  normalizarCodigo,
} from "../domain/equipo";
import { parsearHorometro } from "../domain/horometro";

const SIN_CONTROL = /^[^\p{Cc}]*$/u;

const textoOpcional = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Máximo ${max} caracteres.`)
    .regex(SIN_CONTROL, "Tiene caracteres no permitidos.")
    .transform((v) => v || null);

const idOpcional = z
  .union([z.literal(""), z.uuid()])
  .transform((v) => v || null);

const horometro = z
  .string()
  .transform((v) => parsearHorometro(v))
  .refine(
    (v) => v !== null,
    "Un número entre 0 y 1000000, con punto decimal (ej. 1500.5), sin comas.",
  )
  .transform((v) => v as number);

const campos = {
  codigo: z
    .string()
    .transform(normalizarCodigo)
    .refine((v) => v.length > 0, "Escribe el código.")
    .refine(
      (v) => CODIGO_VALIDO.test(v),
      "Hasta 30 letras, números o . _ / - (sin espacios).",
    ),
  categoriaId: z.uuid("Elige una categoría."),
  ubicacionId: idOpcional,
  marca: textoOpcional(80),
  modelo: textoOpcional(80),
  numeroSerie: textoOpcional(80),
  idExterno: textoOpcional(80),
  estadoOperativo: z.enum(
    Object.keys(ESTADOS_OPERATIVOS) as [keyof typeof ESTADOS_OPERATIVOS],
    "Elige un estado.",
  ),
  estadoMovilizacion: z.enum(["MOVILIZADO", "PENDIENTE"], "Elige un estado."),
  requiereEngrase: z
    .union([z.literal("on"), z.literal("")])
    .transform((v) => v === "on"),
};

export const crearEquipoSchema = z.object({
  ...campos,
  horometroInicial: horometro,
});
export type CrearEquipoEntrada = z.output<typeof crearEquipoSchema>;

// Al editar no se toca el horómetro: cambia solo con lecturas.
export const editarEquipoSchema = z.object({
  ...campos,
  id: z.uuid(),
  version: z.coerce.number().int().positive(),
});
export type EditarEquipoEntrada = z.output<typeof editarEquipoSchema>;
export type DatosEquipo = Omit<EditarEquipoEntrada, "id" | "version">;

export const lecturaSchema = z
  .object({
    equipoId: z.uuid(),
    valor: horometro,
    fecha: z.string().refine(esFechaISO, "Fecha no válida."),
    esCorreccion: z.enum(["true", "false"]).transform((v) => v === "true"),
    motivo: textoOpcional(300),
  })
  .refine((d) => !d.esCorreccion || (d.motivo?.length ?? 0) >= 5, {
    path: ["motivo"],
    message: "Explica el motivo (mínimo 5 caracteres).",
  });
export type LecturaEntrada = z.output<typeof lecturaSchema>;

export const movilizacionSchema = z.object({
  id: z.uuid(),
  estado: z.enum(["MOVILIZADO", "DESMOVILIZADO"]),
});
export type MovilizacionEntrada = z.output<typeof movilizacionSchema>;

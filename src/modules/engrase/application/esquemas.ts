import { z } from "zod";
import { parsearHorometro } from "@/modules/equipos/domain/horometro";
import {
  clave,
  fecha,
  texto,
  textoOpcional,
} from "@/modules/trabajos/application/esquemas";
import { RANGO_AVISO, TIPOS_AVISO } from "../domain/estado-engrase";

const vacioANulo = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : v));

const cadaHoras = vacioANulo
  .refine(
    (v) => v === null || /^\d{1,6}(\.\d{1,2})?$/.test(v),
    "Un número mayor que 0 y hasta 100000, con punto decimal.",
  )
  .transform((v) => (v === null ? null : Number(v)))
  .refine(
    (v) => v === null || (v > 0 && v <= 100_000),
    "Un número mayor que 0 y hasta 100000, con punto decimal.",
  );

const cadaDias = vacioANulo
  .refine((v) => v === null || /^\d{1,4}$/.test(v), "Días entre 1 y 3650.")
  .transform((v) => (v === null ? null : Number(v)))
  .refine((v) => v === null || (v >= 1 && v <= 3650), "Días entre 1 y 3650.");

export const MAX_PUNTOS = 50;

export const planSchema = z
  .object({
    equipoId: z.uuid("Recarga la página."),
    cadaHoras,
    cadaDias,
    tipoGrasaId: z.uuid("Elige el tipo de grasa."),
    puntos: z
      .array(texto(200, "Escribe el punto o quítalo."))
      .min(1, "Agrega al menos un punto de engrase.")
      .max(MAX_PUNTOS, `Máximo ${MAX_PUNTOS} puntos.`)
      .refine(
        (p) => new Set(p.map((x) => x.toLowerCase())).size === p.length,
        "Hay puntos repetidos.",
      ),
  })
  .strict()
  .refine((d) => d.cadaHoras !== null || d.cadaDias !== null, {
    path: ["cadaHoras"],
    message: "Indica cada cuántas horas, cada cuántos días, o ambos.",
  });
export type PlanEntrada = z.output<typeof planSchema>;

export const registroSchema = z
  .object({
    equipoId: z.uuid("Recarga la página."),
    fecha,
    horometro: z
      .string()
      .trim()
      .refine(
        (v) => parsearHorometro(v) !== null,
        "Un número entre 0 y 1000000, con punto decimal (ej. 1500.5), sin comas.",
      )
      .transform((v) => parsearHorometro(v) as number),
    tipoGrasaId: z.uuid("Elige el tipo de grasa."),
    // Ids de los puntos marcados (del plan o de las plantillas): la base recalcula el total.
    engrasados: z.array(z.uuid()).max(MAX_PUNTOS),
    observacion: textoOpcional(500, true),
    clave,
  })
  .strict();
export type RegistroEntrada = z.output<typeof registroSchema>;

export const avisoSchema = z
  .object({
    tipo: z.enum(TIPOS_AVISO, "Elige cómo se mide el aviso."),
    valor: z
      .string()
      .trim()
      .regex(/^\d{1,6}$/, "Un número entero.")
      .transform(Number),
  })
  .strict()
  .superRefine((d, ctx) => {
    const { min, max } = RANGO_AVISO[d.tipo];
    if (d.valor < min || d.valor > max) {
      ctx.addIssue({
        code: "custom",
        path: ["valor"],
        message: `Entre ${min} y ${max}.`,
      });
    }
  });
export type AvisoEntrada = z.output<typeof avisoSchema>;

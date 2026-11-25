import { z } from "zod";
import { parsearHorometro } from "@/modules/equipos/domain/horometro";
import {
  clave,
  fecha,
  texto,
  textoOpcional,
} from "@/modules/trabajos/application/esquemas";
import { COCADA_MAX, MARGEN_MEDICION, PRESION_MAX } from "../domain/salud";

const id = z.uuid("Recarga la página.");

// Punto decimal (como en Perú), hasta dos decimales; "1,5" se rechaza.
const decimal = (
  min: number,
  max: number,
  mensaje: string,
  minExclusivo = false,
) =>
  z
    .string()
    .trim()
    .refine((v) => /^\d{1,8}(\.\d{1,2})?$/.test(v), mensaje)
    .transform(Number)
    .refine((v) => (minExclusivo ? v > min : v >= min) && v <= max, mensaje);

const decimalOpcional = (max: number, mensaje: string) =>
  z
    .string()
    .trim()
    .refine((v) => v === "" || /^\d{1,8}(\.\d{1,2})?$/.test(v), mensaje)
    .transform((v) => (v === "" ? null : Number(v)))
    .refine((v) => v === null || v <= max, mensaje);

const horometro = z
  .string()
  .trim()
  .refine(
    (v) => parsearHorometro(v) !== null,
    "Un número entre 0 y 1000000, con punto decimal (ej. 1500.5), sin comas.",
  )
  .transform((v) => parsearHorometro(v) as number);

const MSG_COCADA = `Milímetros entre 0 y ${COCADA_MAX + MARGEN_MEDICION}, con punto decimal.`;
const medida = decimal(0, COCADA_MAX + MARGEN_MEDICION, MSG_COCADA);

export const neumaticoSchema = z
  .object({
    id: z.union([z.literal(""), z.uuid()]).transform((v) => v || null),
    codigo: z
      .string()
      .trim()
      .toUpperCase()
      .regex(
        /^[A-Z0-9][A-Z0-9._/-]{0,29}$/,
        "Letras, números, guion, punto o barra (máx. 30).",
      ),
    marca: texto(80, "Escribe la marca."),
    modelo: textoOpcional(80),
    medida: texto(40, "Escribe la medida (ej. 12R22.5)."),
    cocadaNueva: decimal(
      0,
      COCADA_MAX,
      `Milímetros mayor que 0 y hasta ${COCADA_MAX}.`,
      true,
    ),
    costo: decimalOpcional(
      10_000_000,
      "Un monto mayor o igual a 0, con punto decimal.",
    ),
    clave,
  })
  .strict();
export type NeumaticoEntrada = z.output<typeof neumaticoSchema>;

export const posicionesSchema = z
  .object({
    equipoId: id,
    layout: z.string().trim().min(1, "Escribe las posiciones.").max(500),
  })
  .strict();

export const umbralesSchema = z
  .object({
    destino: z.enum(["categoria", "equipo"]),
    destinoId: id,
    quitar: z.enum(["", "on"]).transform((v) => v === "on"),
    cocadaMinima: z.string().trim(),
    cocadaAlerta: z.string().trim(),
    diasSinMedir: z.string().trim(),
    diferenciaMaxima: z.string().trim(),
  })
  .strict()
  .transform((d, ctx) => {
    const destino = {
      categoriaId: d.destino === "categoria" ? d.destinoId : null,
      equipoId: d.destino === "equipo" ? d.destinoId : null,
    };
    if (d.quitar) return { destino, datos: null };
    const campos = {
      cocadaMinima: decimal(0, COCADA_MAX, "Milímetros entre 0 y 150."),
      cocadaAlerta: decimal(0, COCADA_MAX, "Milímetros entre 0 y 150."),
      diasSinMedir: z
        .string()
        .regex(/^\d{1,3}$/, "Días entre 1 y 365.")
        .transform(Number)
        .refine((v) => v >= 1 && v <= 365, "Días entre 1 y 365."),
      diferenciaMaxima: decimal(
        0,
        50,
        "Milímetros mayor que 0 y hasta 50.",
        true,
      ),
    };
    const datos: Record<string, number> = {};
    for (const [k, s] of Object.entries(campos)) {
      const r = s.safeParse(d[k as keyof typeof campos]);
      if (!r.success) {
        ctx.addIssue({
          code: "custom",
          path: [k],
          message: r.error.issues[0].message,
        });
      } else datos[k] = r.data;
    }
    if (
      datos.cocadaAlerta !== undefined &&
      datos.cocadaMinima !== undefined &&
      datos.cocadaAlerta <= datos.cocadaMinima
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["cocadaAlerta"],
        message: "Debe ser mayor que la cocada mínima.",
      });
    }
    if (ctx.issues.length) return z.NEVER;
    return {
      destino,
      datos: datos as {
        cocadaMinima: number;
        cocadaAlerta: number;
        diasSinMedir: number;
        diferenciaMaxima: number;
      },
    };
  });
export type UmbralesEntrada = z.output<typeof umbralesSchema>;

export const montarSchema = z
  .object({
    neumaticoId: id,
    posicionId: id,
    fecha,
    horometro,
    cocada: medida,
    clave,
  })
  .strict();
export type MontarEntrada = z.output<typeof montarSchema>;

export const DESTINOS = {
  STOCK: "Stock",
  RECAPADO: "Recapado",
  BAJA: "Baja",
} as const;

export const desmontarSchema = z
  .object({
    neumaticoId: id,
    fecha,
    horometro,
    motivoId: z.uuid("Elige el motivo."),
    destino: z.enum(["STOCK", "RECAPADO", "BAJA"], "Elige el destino."),
    clave,
  })
  .strict();
export type DesmontarEntrada = z.output<typeof desmontarSchema>;

export const rotarSchema = z
  .object({
    origenId: id,
    destinoId: z.uuid("Elige la posición de destino."),
    fecha,
    horometro,
    clave,
  })
  .strict()
  .refine((d) => d.origenId !== d.destinoId, {
    path: ["destinoId"],
    message: "Elige otra posición.",
  });
export type RotarEntrada = z.output<typeof rotarSchema>;

export const recaparSchema = z
  .object({
    neumaticoId: id,
    costo: decimalOpcional(
      10_000_000,
      "Un monto mayor o igual a 0, con punto decimal.",
    ),
    cocadaNueva: decimal(
      0,
      COCADA_MAX,
      `Milímetros mayor que 0 y hasta ${COCADA_MAX}.`,
      true,
    ),
    clave,
  })
  .strict();
export type RecaparEntrada = z.output<typeof recaparSchema>;

export const medirSchema = z
  .object({
    equipoId: id,
    fecha,
    horometro,
    mediciones: z
      .array(
        z
          .object({
            neumaticoId: id,
            interno: medida,
            centro: medida,
            externo: medida,
            presion: decimalOpcional(
              PRESION_MAX,
              `Presión entre 0 y ${PRESION_MAX} psi.`,
            ),
          })
          .strict(),
      )
      .min(1, "Mide al menos una cubierta.")
      .max(40),
    clave,
  })
  .strict();
export type MedirEntrada = z.output<typeof medirSchema>;

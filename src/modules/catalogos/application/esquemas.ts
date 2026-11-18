import { z } from "zod";
import {
  CATALOGOS,
  CODIGOS_CATALOGO,
  camposEditables,
  type Campo,
  type CodigoCatalogo,
  type Valores,
} from "../domain/catalogos";

export const catalogoSchema = z.enum(CODIGOS_CATALOGO);

const idOpcional = z
  .union([z.literal(""), z.uuid()])
  .transform((v) => v || null);

// Sin caracteres de control; en textos largos se permiten saltos de línea.
const SIN_CONTROL = /^[^\p{Cc}]*$/u;
const SIN_CONTROL_LARGO = /^[^\x00-\x09\x0B\x0C\x0E-\x1F\x7F]*$/;

function zodDe(c: Campo): z.ZodType<string | number | null> {
  switch (c.tipo) {
    case "texto":
      return z
        .string()
        .trim()
        .max(c.max, `Máximo ${c.max} caracteres.`)
        .regex(
          c.largo ? SIN_CONTROL_LARGO : SIN_CONTROL,
          "Tiene caracteres no permitidos.",
        )
        .refine((v) => !c.requerido || v !== "", "Es obligatorio.")
        .transform((v) => {
          const t = c.largo
            ? v.replace(/\r\n?/g, "\n").replace(/[ \t]+/g, " ")
            : v;
          return t === "" ? null : c.mayusculas ? t.toUpperCase() : t;
        });
    case "opciones":
      return z
        .string()
        .refine(
          (v) => (v === "" ? !c.requerido : v in c.opciones),
          c.requerido ? "Elige una opción." : "Opción no válida.",
        )
        .transform((v) => v || null);
    case "numero":
      return z
        .string()
        .trim()
        .transform((v) => (v === "" ? null : Number(v)))
        .refine(
          (v) =>
            v === null
              ? !c.requerido
              : Number.isFinite(v) &&
                v >= c.min &&
                v <= c.max &&
                Number.isInteger(v * 10 ** c.decimales),
          c.decimales === 0
            ? `Un número entero entre ${c.min} y ${c.max}.`
            : `Un número entre ${c.min} y ${c.max}, máximo ${c.decimales} decimales.`,
        );
    case "categoria":
      return idOpcional;
    case "derivado":
      throw new Error("un campo derivado no entra por formulario");
  }
}

// Solo las claves del catálogo pasan (Zod descarta el resto): no hay asignación masiva.
export function esquemaElemento(catalogo: CodigoCatalogo) {
  const def = CATALOGOS[catalogo];
  return z
    .object({
      id: idOpcional,
      ...Object.fromEntries(
        camposEditables(def).map((c) => [c.clave, zodDe(c)]),
      ),
    })
    .transform(({ id, ...valores }) => ({
      id: id as string | null,
      valores: valores as Valores,
    }))
    .superRefine((d, ctx) => {
      const problema = def.validar?.(d.valores);
      if (problema) {
        ctx.addIssue({
          code: "custom",
          path: [problema.campo],
          message: problema.mensaje,
        });
      }
    });
}

export type ElementoEntrada = {
  catalogo: CodigoCatalogo;
  id: string | null;
  valores: Valores;
};

export const cambiarActivoSchema = z.object({
  catalogo: catalogoSchema,
  id: z.uuid(),
  activo: z.enum(["true", "false"]).transform((v) => v === "true"),
});
export type CambiarActivoEntrada = z.output<typeof cambiarActivoSchema>;

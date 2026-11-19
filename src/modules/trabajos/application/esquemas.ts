import { z } from "zod";
import { esFechaISO } from "@/shared/kernel/fechas";
import { parsearHorometro } from "@/modules/equipos/domain/horometro";
import { CRITICIDADES, type Criticidad } from "../domain/backlog-estado";

const SIN_CONTROL = /^[^\p{Cc}]*$/u;
// En textos largos se permiten saltos de línea.
const SIN_CONTROL_LARGO = /^[^\x00-\x09\x0B\x0C\x0E-\x1F\x7F]*$/;

export const texto = (max: number, mensaje: string, largo = false) =>
  z
    .string()
    .trim()
    .min(1, mensaje)
    .max(max, `Máximo ${max} caracteres.`)
    .regex(
      largo ? SIN_CONTROL_LARGO : SIN_CONTROL,
      "Tiene caracteres no permitidos.",
    );

export const textoOpcional = (max: number, largo = false) =>
  z
    .string()
    .trim()
    .max(max, `Máximo ${max} caracteres.`)
    .regex(
      largo ? SIN_CONTROL_LARGO : SIN_CONTROL,
      "Tiene caracteres no permitidos.",
    )
    .transform((v) => v || null);

export const fecha = z.string().refine(esFechaISO, "Fecha no válida.");
const id = z.uuid();
// La pone el formulario al abrirse: un reintento con la misma clave no repite la acción.
export const clave = z.uuid("Recarga la página e inténtalo de nuevo.");

export const monto = (max: number, mensaje: string) =>
  z
    .string()
    .trim()
    .refine((v) => /^\d{1,10}(\.\d{1,2})?$/.test(v), mensaje)
    .transform(Number)
    .refine((v) => v <= max, mensaje);

const datosBacklog = {
  sistemaId: z.union([z.literal(""), z.uuid()]).transform((v) => v || null),
  componente: texto(120, "Escribe el componente."),
  criticidad: z.enum(
    Object.keys(CRITICIDADES) as [Criticidad, ...Criticidad[]],
    "Elige la criticidad.",
  ),
  descripcion: texto(1000, "Describe el problema.", true),
  fechaObservacion: fecha,
  fechaProgramada: fecha,
  costoEstimado: z
    .string()
    .trim()
    .transform((v) => v || "0")
    .pipe(monto(9_999_999_999, "Un monto con punto decimal, sin comas.")),
};

const fechasEnOrden = {
  path: ["fechaProgramada"],
  message: "No puede ser antes de la fecha de observación.",
};

export const crearBacklogSchema = z
  .object({ ...datosBacklog, equipoId: z.uuid("Elige un equipo."), clave })
  .refine((d) => d.fechaProgramada >= d.fechaObservacion, fechasEnOrden);
export type CrearBacklogEntrada = z.output<typeof crearBacklogSchema>;

export const editarBacklogSchema = z
  .object({
    ...datosBacklog,
    id,
    version: z.coerce.number().int().positive(),
    motivo: textoOpcional(500),
  })
  .refine((d) => d.fechaProgramada >= d.fechaObservacion, fechasEnOrden);
export type EditarBacklogEntrada = z.output<typeof editarBacklogSchema>;
export type DatosBacklog = Omit<
  EditarBacklogEntrada,
  "id" | "version" | "motivo"
>;

export const abrirOtSchema = z.object({
  backlogId: id,
  responsableId: z.uuid("Elige al responsable."),
  clave,
});
export type AbrirOtEntrada = z.output<typeof abrirOtSchema>;

export const requisicionSchema = z.object({
  backlogId: id,
  descripcion: texto(300, "Escribe qué repuesto o material."),
  cantidad: monto(
    1_000_000,
    "Una cantidad mayor que 0, con punto decimal.",
  ).refine((v) => v > 0, "Una cantidad mayor que 0, con punto decimal."),
  unidad: textoOpcional(20),
  clave,
});
export type RequisicionEntrada = z.output<typeof requisicionSchema>;

export const estadoRequisicionSchema = z.object({
  id,
  estado: z.enum(["ENTREGADA", "ANULADA"]),
});
export type EstadoRequisicionEntrada = z.output<typeof estadoRequisicionSchema>;

export const cerrarReporteSchema = z.object({
  backlogId: id,
  fecha,
  horometro: z
    .string()
    .transform((v) => parsearHorometro(v))
    .refine(
      (v) => v !== null,
      "Un número entre 0 y 1000000, con punto decimal (ej. 1500.5), sin comas.",
    )
    .transform((v) => v as number),
  notas: textoOpcional(1000, true),
  clave,
});
export type CerrarReporteEntrada = z.output<typeof cerrarReporteSchema>;

export const nota = (opcional: boolean) =>
  z
    .string()
    .trim()
    .max(500, "Máximo 500 caracteres.")
    .regex(SIN_CONTROL_LARGO, "Tiene caracteres no permitidos.")
    .refine(
      (v) => opcional || v.length >= 5,
      "Escribe la observación (mínimo 5 caracteres).",
    );

export const validarSchema = z
  .object({
    backlogId: id,
    decision: z.enum(["APROBAR", "DEVOLVER"]),
    nota: nota(true),
    clave,
  })
  .refine((d) => d.decision === "APROBAR" || d.nota.length >= 5, {
    path: ["nota"],
    message: "Escribe qué hay que corregir (mínimo 5 caracteres).",
  });
export type ValidarEntrada = z.output<typeof validarSchema>;

export const reabrirSchema = z.object({
  backlogId: id,
  nota: nota(false),
  clave,
});
export type ReabrirEntrada = z.output<typeof reabrirSchema>;

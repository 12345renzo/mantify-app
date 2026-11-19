import { z } from "zod";
import { parsearHorometro } from "@/modules/equipos/domain/horometro";
import {
  clave,
  textoOpcional,
  texto,
} from "@/modules/trabajos/application/esquemas";
import {
  CRITICIDADES,
  type Criticidad,
} from "@/modules/trabajos/domain/backlog-estado";
import { esFechaISO } from "@/shared/kernel/fechas";
import { esFechaHora } from "../domain/duracion";

const fechaHora = z.string().refine(esFechaHora, "Fecha y hora no válidas.");

const horometro = z
  .string()
  .transform((v) => parsearHorometro(v))
  .refine(
    (v) => v !== null,
    "Un número entre 0 y 1000000, con punto decimal (ej. 1500.5), sin comas.",
  )
  .transform((v) => v as number);

const opcionalId = z
  .union([z.literal(""), z.uuid()])
  .transform((v) => v || null);

// "on" de un checkbox marcado.
const marcado = z
  .string()
  .optional()
  .transform((v) => v === "on" || v === "true");

export const iniciarSchema = z
  .object({
    equipoId: z.uuid("Elige un equipo."),
    motivoId: z.uuid("Elige el motivo."),
    inicio: fechaHora,
    horometroInicio: horometro,
    responsableId: opcionalId,
    responsableExterno: textoOpcional(120),
    confirmarCruce: marcado,
    clave,
  })
  .refine(
    (d) => (d.responsableId === null) !== (d.responsableExterno === null),
    {
      path: ["responsableExterno"],
      message:
        "Elige a la persona responsable o escribe el nombre del externo.",
    },
  );
export type IniciarEntrada = z.output<typeof iniciarSchema>;
export type DatosInicio = Omit<IniciarEntrada, "clave" | "confirmarCruce">;

export const cerrarSchema = z.object({
  paradaId: z.uuid(),
  fin: fechaHora,
  horometroFin: horometro,
  descripcion: texto(1000, "Describe la tarea realizada.", true),
  areaDemoraId: opcionalId,
  areaParadaId: opcionalId,
  hallazgo: textoOpcional(1000, true),
  confirmarCruce: marcado,
  clave,
});
export type CerrarEntrada = z.output<typeof cerrarSchema>;
export type DatosCierre = Omit<
  CerrarEntrada,
  "paradaId" | "clave" | "confirmarCruce"
>;

export const backlogHallazgoSchema = z.object({
  paradaId: z.uuid(),
  componente: texto(120, "Escribe el componente."),
  criticidad: z.enum(
    Object.keys(CRITICIDADES) as [Criticidad, ...Criticidad[]],
    "Elige la criticidad.",
  ),
});
export type BacklogHallazgoEntrada = z.output<typeof backlogHallazgoSchema>;

// Filtros de la URL: lo inválido se ignora (la página usa el valor por defecto).
export const fechaUrl = z.string().refine(esFechaISO);
export const mesUrl = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/)
  .refine((m) => esFechaISO(`${m}-01`));

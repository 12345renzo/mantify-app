import { z } from "zod";
import { parsearHorometro } from "@/modules/equipos/domain/horometro";
import {
  clave,
  fecha,
  monto,
  nota,
  texto,
  textoOpcional,
} from "@/modules/trabajos/application/esquemas";
import {
  CRITICIDADES,
  type Criticidad,
} from "@/modules/trabajos/domain/backlog-estado";
import { RESULTADOS, type Resultado } from "../domain/actividad-observada";
import { HORA } from "../domain/duracion";
import { TIPOS_PM, TURNOS, type Turno } from "../domain/preventivo-estado";

const id = z.uuid();
const MENSAJE_HOROMETRO =
  "Un número entre 0 y 1000000, con punto decimal (ej. 1500.5), sin comas.";

const horometroOpcional = z
  .string()
  .trim()
  .refine((v) => v === "" || parsearHorometro(v) !== null, MENSAJE_HOROMETRO)
  .transform((v) => (v === "" ? null : parsearHorometro(v)));

const entero = (max: number, mensaje: string) =>
  z
    .string()
    .trim()
    .refine((v) => v === "" || /^\d{1,5}$/.test(v), mensaje)
    .transform((v) => (v === "" ? null : Number(v)))
    .refine((v) => v === null || (v >= 1 && v <= max), mensaje);

export const programarSchema = z
  .object({
    equipoId: z.uuid("Elige un equipo."),
    nombrePlanId: z.uuid("Elige el plan."),
    tipo: z.enum(TIPOS_PM, "Elige el tipo."),
    fechaProgramada: fecha,
    horometroProgramado: horometroOpcional,
    responsableId: z
      .union([z.literal(""), z.uuid()])
      .transform((v) => v || null),
    tercero: textoOpcional(120),
    cadaDias: entero(3650, "Días entre 1 y 3650."),
    cadaHoras: entero(100_000, "Horas entre 1 y 100000."),
    clave,
  })
  .refine((d) => (d.responsableId === null) !== (d.tercero === null), {
    path: ["tercero"],
    message: "Elige a la persona responsable o escribe el nombre del tercero.",
  });
export type ProgramarEntrada = z.output<typeof programarSchema>;
export type DatosProgramacion = Omit<ProgramarEntrada, "clave">;

export const ejecutarSchema = z
  .object({
    preventivoId: id,
    fechaEjecucion: fecha,
    horaInicio: z.string().regex(HORA, "Hora no válida."),
    horaFin: z.string().regex(HORA, "Hora no válida."),
    turno: z.enum(
      Object.keys(TURNOS) as [Turno, ...Turno[]],
      "Elige el turno.",
    ),
    horometroEjecucion: horometroOpcional,
    notas: textoOpcional(1000, true),
    actividades: z
      .array(
        z.object({
          id,
          resultado: z.enum(
            Object.keys(RESULTADOS) as [Resultado, ...Resultado[]],
          ),
          observacion: textoOpcional(500, true),
        }),
      )
      .max(200),
    repuestos: z
      .array(
        z.object({
          descripcion: texto(300, "Escribe el repuesto."),
          cantidad: monto(1_000_000, "Cantidad no válida.").refine(
            (v) => v > 0,
            "Cantidad no válida.",
          ),
          unidad: textoOpcional(20),
        }),
      )
      .max(30, "Máximo 30 repuestos."),
    personal: z.array(id).max(30),
    clave,
  })
  .refine((d) => d.horaInicio !== d.horaFin, {
    path: ["horaFin"],
    message: "La hora de fin no puede ser igual a la de inicio.",
  });
export type EjecutarEntrada = z.output<typeof ejecutarSchema>;
export type DatosEjecucion = Omit<EjecutarEntrada, "preventivoId" | "clave">;

export const validarPreventivoSchema = z
  .object({
    preventivoId: id,
    decision: z.enum(["APROBAR", "DEVOLVER"]),
    nota: nota(true),
    clave,
  })
  .refine((d) => d.decision === "APROBAR" || d.nota.length >= 5, {
    path: ["nota"],
    message: "Escribe qué hay que completar (mínimo 5 caracteres).",
  });
export type ValidarPreventivoEntrada = z.output<typeof validarPreventivoSchema>;

export const reprogramarSchema = z.object({
  preventivoId: id,
  fecha,
  clave,
});
export type ReprogramarEntrada = z.output<typeof reprogramarSchema>;

export const backlogObservacionSchema = z.object({
  preventivoId: id,
  actividadId: id,
  criticidad: z.enum(
    Object.keys(CRITICIDADES) as [Criticidad, ...Criticidad[]],
    "Elige la criticidad.",
  ),
});
export type BacklogObservacionEntrada = z.output<
  typeof backlogObservacionSchema
>;

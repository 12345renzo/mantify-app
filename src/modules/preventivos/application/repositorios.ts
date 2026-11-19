import type {
  LectorTrabajos,
  TrabajosRepositorio,
} from "@/modules/trabajos/application/repositorios";
import type { FechaISO } from "@/shared/kernel/fechas";
import type { Result } from "@/shared/kernel/result";
import type { Resultado } from "../domain/actividad-observada";
import type { FilaPreventivo } from "../domain/importacion-csv";
import type {
  EstadoPreventivo,
  TipoPM,
  Turno,
} from "../domain/preventivo-estado";
import type { DatosEjecucion, DatosProgramacion } from "./esquemas";

export type PreventivoFila = {
  id: string;
  codigo: string;
  equipoId: string;
  equipo: string;
  plan: string;
  tipo: TipoPM;
  estado: EstadoPreventivo;
  fechaProgramada: FechaISO;
  horometroProgramado: number | null;
  horometroActual: number | null;
  // Nombre de la persona o del tercero.
  responsable: string;
};

export type PreventivoDetalle = PreventivoFila & {
  nombrePlanId: string;
  cadaDias: number | null;
  cadaHoras: number | null;
  responsableId: string | null;
  esTercero: boolean;
  version: number;
  fechaEjecucion: FechaISO | null;
  horaInicio: string | null;
  horaFin: string | null;
  duracionHoras: number | null;
  turno: Turno | null;
  horometroEjecucion: number | null;
  notas: string | null;
  ejecutadoPorId: string | null;
  ejecutadoPor: string | null;
  validadoPor: string | null;
  notaDevolucion: string | null;
  actividades: {
    id: string;
    descripcion: string;
    resultado: Resultado | null;
    observacion: string | null;
    backlog: { id: string; codigo: string } | null;
  }[];
  repuestos: { descripcion: string; cantidad: number; unidad: string | null }[];
  personal: { id: string; nombre: string }[];
  firmas: {
    id: string;
    tipo: "EJECUCION" | "VALIDACION";
    nombre: string;
    vigente: boolean;
    url: string | null;
    creadoEn: string;
  }[];
  fotos: { id: string; url: string | null }[];
  historial: {
    id: string;
    evento: string;
    nota: string | null;
    usuario: string | null;
    creadoEn: string;
  }[];
};

export type OpcionesPreventivo = {
  equipos: { id: string; codigo: string; movilizado: boolean }[];
  planes: { id: string; nombre: string }[];
  personas: { id: string; nombre: string }[];
  // Horas de parada estándar de cada PM (catálogo de motivos de parada).
  duraciones: Partial<Record<TipoPM, number>>;
};

export type ResultadoImportacion =
  | { fila: number; accion: "CREADO" | "OMITIDO" }
  | { fila: number; error: "EQUIPO" | "PLAN" | "DATOS" };

export interface LectorPreventivos {
  // Todos los vigentes de la empresa; la página filtra por vista.
  listar(empresaId: string): Promise<PreventivoFila[]>;
  // null si no existe o es de otra empresa (RLS).
  obtener(id: string): Promise<PreventivoDetalle | null>;
  opciones(empresaId: string): Promise<OpcionesPreventivo>;
  // Personas activas de la empresa (para marcar al personal de la ejecución).
  personas(): Promise<{ id: string; nombre: string }[]>;
}

export interface PreventivosRepositorio {
  programar(
    datos: DatosProgramacion,
    clave: string,
  ): Promise<Result<{ id: string }>>;
  importar(filas: FilaPreventivo[]): Promise<Result<ResultadoImportacion[]>>;
  ejecutar(
    id: string,
    datos: DatosEjecucion,
    fotos: string[],
    clave: string,
  ): Promise<Result<void>>;
  validar(
    id: string,
    aprobar: boolean,
    nota: string | null,
    clave: string,
  ): Promise<Result<void>>;
  reprogramar(
    id: string,
    fecha: FechaISO,
    clave: string,
  ): Promise<Result<void>>;
}

// Los preventivos usan la empresa, la firma, las fotos y la creación de backlogs del módulo de trabajos.
export type ReposPreventivos = {
  lector: LectorPreventivos;
  preventivos: PreventivosRepositorio;
  trabajos: { lector: LectorTrabajos; trabajos: TrabajosRepositorio };
};

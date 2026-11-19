import type { FechaISO } from "@/shared/kernel/fechas";
import type { Result } from "@/shared/kernel/result";
import type { Criticidad, EstadoBacklog } from "../domain/backlog-estado";
import type { TipoImagen } from "../domain/fotos";
import type { DatosBacklog } from "./esquemas";

export type VistaBandeja = "abiertos" | "validacion" | "completados";

export type BacklogFila = {
  id: string;
  codigo: string;
  equipo: string;
  componente: string;
  criticidad: Criticidad;
  estado: EstadoBacklog;
  fechaProgramada: FechaISO;
  devuelto: boolean;
};

export type EstadoRequisicion = "SOLICITADA" | "ENTREGADA" | "ANULADA";

export type BacklogDetalle = BacklogFila & {
  equipoId: string;
  sistemaId: string | null;
  sistema: string | null;
  descripcion: string;
  fechaObservacion: FechaISO;
  costoEstimado: number;
  version: number;
  creadoPorId: string | null;
  creadoPor: string | null;
  creadoEn: string;
  cerradoPorId: string | null;
  notaDevolucion: string | null;
  ot: {
    id: string;
    codigo: string;
    abierta: boolean;
    responsableId: string;
    responsable: string;
  } | null;
  rm: {
    codigo: string;
    fecha: FechaISO;
    horometro: number;
    notas: string | null;
    cerrado: boolean;
    cerradoPor: string | null;
  } | null;
  requisiciones: {
    id: string;
    codigo: string;
    descripcion: string;
    cantidad: number;
    unidad: string | null;
    estado: EstadoRequisicion;
    solicitadoPor: string | null;
    creadoEn: string;
  }[];
  historial: {
    id: string;
    evento: string;
    estadoNuevo: EstadoBacklog;
    nota: string | null;
    usuario: string | null;
    creadoEn: string;
  }[];
  firmas: {
    id: string;
    tipo: "CIERRE" | "VALIDACION";
    nombre: string;
    vigente: boolean;
    url: string | null;
    creadoEn: string;
  }[];
  fotos: { id: string; rol: "ANTES" | "DESPUES"; url: string | null }[];
};

export type OpcionesTrabajo = {
  equipos: { id: string; codigo: string; movilizado: boolean }[];
  sistemas: { id: string; nombre: string; activo: boolean }[];
};

export interface LectorTrabajos {
  listar(
    empresaId: string,
    filtro: { vista: VistaBandeja; buscar: string | null },
  ): Promise<BacklogFila[]>;
  // null si no existe o es de otra empresa (RLS).
  obtener(id: string): Promise<BacklogDetalle | null>;
  opciones(empresaId: string): Promise<OpcionesTrabajo>;
  // Personas activas a las que se puede asignar una OT.
  responsables(empresaId: string): Promise<{ id: string; nombre: string }[]>;
  empresa(empresaId: string): Promise<{
    planificadorPuedeValidar: boolean;
    zonaHoraria: string;
  }>;
  // URL firmada de la firma precargada del usuario, o null si aún no tiene.
  miFirma(): Promise<string | null>;
}

export interface TrabajosRepositorio {
  // Sube al bucket privado con nombre aleatorio; devuelve la ruta.
  subirImagen(
    empresaId: string,
    carpeta: "backlogs" | "firmas" | "preventivos" | "paradas",
    bytes: Uint8Array,
    tipo: TipoImagen,
  ): Promise<Result<string>>;
  crear(
    // Origen: una actividad OBSERVADO de un preventivo o el hallazgo de una parada.
    datos: DatosBacklog & {
      equipoId: string;
      actividadId?: string;
      paradaId?: string;
    },
    fotos: string[],
    clave: string,
  ): Promise<Result<{ id: string }>>;
  editar(
    id: string,
    version: number,
    datos: DatosBacklog,
    motivo: string | null,
  ): Promise<Result<void>>;
  abrirOt(
    backlogId: string,
    responsableId: string,
    clave: string,
  ): Promise<Result<void>>;
  crearRequisicion(
    otId: string,
    datos: { descripcion: string; cantidad: number; unidad: string | null },
    clave: string,
  ): Promise<Result<void>>;
  cambiarRequisicion(
    id: string,
    estado: "ENTREGADA" | "ANULADA",
  ): Promise<Result<void>>;
  cerrar(
    backlogId: string,
    datos: { fecha: FechaISO; horometro: number; notas: string | null },
    fotos: string[],
    clave: string,
  ): Promise<Result<void>>;
  validar(
    backlogId: string,
    aprobar: boolean,
    nota: string | null,
    clave: string,
  ): Promise<Result<void>>;
  reabrir(
    backlogId: string,
    nota: string,
    clave: string,
  ): Promise<Result<void>>;
  guardarFirma(ruta: string): Promise<Result<void>>;
}

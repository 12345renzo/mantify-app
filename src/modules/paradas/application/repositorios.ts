import type { LectorExcel } from "@/modules/equipos/application/repositorios";
import type {
  LectorTrabajos,
  TrabajosRepositorio,
} from "@/modules/trabajos/application/repositorios";
import type { FechaISO } from "@/shared/kernel/fechas";
import type { Result } from "@/shared/kernel/result";
import type { FechaHora } from "../domain/duracion";
import type { FilaParada } from "../domain/importacion";
import type { DatosCierre, DatosInicio } from "./esquemas";

export type EstadoParada = "ABIERTA" | "CERRADA";

// Lo que devuelve la función paradas_reporte (horas ya en la zona de la empresa).
export type Parada = {
  id: string;
  codigo: string;
  equipoId: string;
  equipo: string;
  motivoCodigo: string;
  motivo: string;
  esPlanificado: boolean;
  inicio: FechaHora;
  fin: FechaHora | null;
  duracionHoras: number | null;
  horometroInicio: number;
  horometroFin: number | null;
  responsableId: string | null;
  responsable: string;
  descripcion: string | null;
  hallazgo: string | null;
  areaDemora: string | null;
  areaParada: string | null;
  estado: EstadoParada;
  cruceConfirmado: boolean;
  backlog: { id: string; codigo: string } | null;
};

export type ParadaDetalle = Parada & {
  fotos: { id: string; url: string | null }[];
};

export type OpcionesParada = {
  equipos: {
    id: string;
    codigo: string;
    movilizado: boolean;
    horometro: number;
  }[];
  motivos: {
    id: string;
    codigo: string;
    nombre: string;
    esPlanificado: boolean;
  }[];
  areas: { id: string; nombre: string; tipo: "DEMORA" | "PARADA" }[];
  personas: { id: string; nombre: string }[];
};

export type FiltroReporte = {
  desde: FechaISO;
  hasta: FechaISO;
  abiertas?: boolean;
  equipoId?: string;
};

export type ResultadoImportacion =
  | { fila: number; accion: "CREADO"; cruce: boolean; backlog: boolean }
  | { fila: number; accion: "OMITIDO" }
  | {
      fila: number;
      error: "EQUIPO" | "MOTIVO" | "AREA" | "DUPLICADO" | "DATOS";
    };

export interface LectorParadas {
  // La empresa sale de la sesión dentro de la base; el rango lo limita la base (366 días).
  reporte(filtro: FiltroReporte): Promise<Parada[]>;
  obtener(id: string): Promise<ParadaDetalle | null>;
  opciones(empresaId: string): Promise<OpcionesParada>;
  nombreEmpresa(empresaId: string): Promise<string>;
}

export interface ParadasRepositorio {
  iniciar(
    datos: DatosInicio,
    fotos: string[],
    confirmarCruce: boolean,
    clave: string,
  ): Promise<Result<{ id: string }>>;
  cerrar(
    id: string,
    datos: DatosCierre,
    fotos: string[],
    confirmarCruce: boolean,
    clave: string,
  ): Promise<Result<void>>;
  importar(filas: FilaParada[]): Promise<Result<ResultadoImportacion[]>>;
}

export type ReposParadas = {
  lector: LectorParadas;
  paradas: ParadasRepositorio;
  // Empresa, subida de fotos y creación de backlogs del módulo de trabajos.
  trabajos: { lector: LectorTrabajos; trabajos: TrabajosRepositorio };
  excel: LectorExcel;
};

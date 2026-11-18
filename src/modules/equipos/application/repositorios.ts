import type { FechaISO } from "@/shared/kernel/fechas";
import type { Result } from "@/shared/kernel/result";
import type {
  EstadoMovilizacion,
  EstadoOperativo,
  OrigenLectura,
} from "../domain/equipo";
import type { FilaImportada } from "../domain/importacion";
import type { DatosEquipo } from "./esquemas";

export type EquipoFila = {
  id: string;
  codigo: string;
  marca: string | null;
  modelo: string | null;
  categoria: string;
  tipoMedidor: "HORAS" | "KILOMETROS";
  ubicacion: string | null;
  estadoOperativo: EstadoOperativo;
  estadoMovilizacion: EstadoMovilizacion;
  horometroActual: number;
  horometroActualEn: string | null;
};

export type EquipoDetalle = EquipoFila & {
  categoriaId: string;
  ubicacionId: string | null;
  numeroSerie: string | null;
  idExterno: string | null;
  requiereEngrase: boolean;
  version: number;
  creadoEn: string;
};

export type Lectura = {
  id: string;
  valor: number;
  fecha: FechaISO;
  origen: OrigenLectura;
  esCorreccion: boolean;
  motivo: string | null;
  creadoEn: string;
  // Quién la registró. Nulo si fue el sistema (sin sesión) o si la cuenta ya no existe.
  autor: string | null;
};

export type EquipoParaLectura = {
  id: string;
  empresaId: string;
  horometroActual: number;
  estadoMovilizacion: EstadoMovilizacion;
  zonaHoraria: string;
};

export interface LectorEquipos {
  // inactivos = DESMOVILIZADO. La búsqueda ya llega saneada.
  listar(
    empresaId: string,
    filtro: { inactivos: boolean; buscar: string | null },
  ): Promise<EquipoFila[]>;
  obtener(id: string): Promise<EquipoDetalle | null>;
  lecturas(equipoId: string): Promise<Lectura[]>;
}

export type ResultadoFilaImportada =
  | { fila: number; accion: "CREADO" | "ACTUALIZADO" }
  | {
      fila: number;
      error: "HOROMETRO_MENOR" | "DUPLICADO" | "CATALOGO" | "DATOS";
    };

// Lee la primera hoja de un .xlsx como filas de celdas. Rechaza zips sospechosos.
export interface LectorExcel {
  leer(bytes: Uint8Array): Promise<Result<unknown[][]>>;
}

export interface EquiposRepositorio {
  crear(
    empresaId: string,
    datos: DatosEquipo & { horometroInicial: number },
  ): Promise<Result<{ id: string }>>;
  // Con version: si otro lo cambió antes, cero filas → CONFLICT.
  actualizar(
    id: string,
    version: number,
    datos: DatosEquipo,
  ): Promise<Result<void>>;
  cambiarMovilizacion(
    id: string,
    estado: "MOVILIZADO" | "DESMOVILIZADO",
  ): Promise<Result<void>>;
  paraLectura(id: string): Promise<Result<EquipoParaLectura>>;
  // La base bloquea el equipo y vuelve a aplicar "solo sube".
  insertarLectura(datos: {
    empresaId: string;
    equipoId: string;
    valor: number;
    fecha: FechaISO;
    esCorreccion: boolean;
    motivo: string | null;
  }): Promise<Result<void>>;
  // Una sola llamada a la base; cada fila se guarda o falla por separado.
  importar(
    filas: { fila: number; equipo: FilaImportada }[],
  ): Promise<Result<ResultadoFilaImportada[]>>;
}

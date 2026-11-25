import type { FechaISO } from "@/shared/kernel/fechas";
import type { Result } from "@/shared/kernel/result";
import type { Puntos, Salud, Umbrales } from "../domain/salud";
import type {
  DesmontarEntrada,
  MedirEntrada,
  MontarEntrada,
  NeumaticoEntrada,
  RecaparEntrada,
  RotarEntrada,
} from "./esquemas";

export type Medidor = "HORAS" | "KILOMETROS";
export type EstadoNeumatico = "STOCK" | "MONTADO" | "RECAPADO" | "BAJA";

export type Montaje = {
  equipoId: string;
  equipoCodigo: string;
  equipoHorometro: number;
  categoriaId: string;
  medidor: Medidor;
  posicionId: string;
  posicionCodigo: string;
  montadoEn: FechaISO;
  horometroMontaje: number;
  cocadaMontaje: number;
};

export type Neumatico = {
  id: string;
  codigo: string;
  marca: string;
  modelo: string | null;
  medida: string;
  cocadaNueva: number;
  // null para quien no ve costos (la base no los envía).
  costo: number | null;
  costoRecapados: number | null;
  estado: EstadoNeumatico;
  recapados: number;
  horasAcumuladas: number;
  montaje: Montaje | null;
  // Última del ciclo actual (desde el último recapado).
  ultimaMedicion: {
    fecha: FechaISO;
    puntos: Puntos;
    presion: number | null;
  } | null;
};

export type FilaNeumatico = Neumatico & {
  cocadaActual: number;
  diferencia: number | null;
  // Solo las montadas tienen salud.
  salud: Salud | null;
  irregular: boolean;
  diasSinMedir: number | null;
  umbrales: Umbrales | null;
  costoPorHora: number | null;
};

export type UmbralGuardado = Umbrales & {
  categoriaId: string | null;
  equipoId: string | null;
};

export type EquipoNeumaticos = {
  id: string;
  codigo: string;
  categoriaId: string;
  medidor: Medidor;
  horometro: number;
};

export type Posicion = {
  id: string;
  codigo: string;
  eje: number;
  orden: number;
};

export type EventoNeumatico = {
  id: string;
  tipo: string;
  equipo: string | null;
  posicion: string | null;
  horometro: number | null;
  detalle: string | null;
  registradoPor: string;
  creadoEn: string;
};

export type MedicionHistorial = {
  fecha: FechaISO;
  horometro: number;
  equipo: string;
  posicion: string;
  recapado: number;
  puntos: Puntos;
  presion: number | null;
};

type Opcion = { id: string; nombre: string };

export interface LectorNeumaticos {
  neumaticos(id?: string): Promise<Neumatico[]>;
  equipos(): Promise<EquipoNeumaticos[]>;
  posiciones(equipoId: string): Promise<Posicion[]>;
  // Activos de la empresa.
  umbrales(): Promise<UmbralGuardado[]>;
  motivos(): Promise<Opcion[]>;
  plantillas(): Promise<(Opcion & { layout: string })[]>;
  categorias(): Promise<Opcion[]>;
  empresa(empresaId: string): Promise<{ zonaHoraria: string; esPro: boolean }>;
  eventos(neumaticoId: string): Promise<EventoNeumatico[]>;
  mediciones(neumaticoId: string): Promise<MedicionHistorial[]>;
}

export interface NeumaticosRepositorio {
  guardar(datos: NeumaticoEntrada): Promise<Result<string>>;
  definirPosiciones(
    equipoId: string,
    posiciones: { codigo: string; eje: number }[],
  ): Promise<Result<void>>;
  guardarUmbrales(
    destino: { categoriaId: string | null; equipoId: string | null },
    datos: Umbrales | null,
  ): Promise<Result<void>>;
  montar(datos: MontarEntrada): Promise<Result<void>>;
  desmontar(datos: DesmontarEntrada): Promise<Result<void>>;
  rotar(datos: RotarEntrada): Promise<Result<void>>;
  recapar(datos: RecaparEntrada): Promise<Result<void>>;
  medir(datos: MedirEntrada): Promise<Result<void>>;
}

export type ReposNeumaticos = {
  lector: LectorNeumaticos;
  neumaticos: NeumaticosRepositorio;
};

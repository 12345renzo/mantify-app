import type { FechaISO } from "@/shared/kernel/fechas";
import type { Result } from "@/shared/kernel/result";
import type { AvisoEntrada, PlanEntrada, RegistroEntrada } from "./esquemas";
import type {
  Frecuencia,
  Plantilla,
  Punto,
  Situacion,
  UltimoCompleto,
  Umbral,
} from "../domain/estado-engrase";

export type Medidor = "HORAS" | "KILOMETROS";

// Un equipo que se engrasa, con su plan y sus últimos registros.
export type EquipoEngrase = {
  id: string;
  codigo: string;
  categoriaId: string;
  medidor: Medidor;
  horometro: number;
  plan: (Frecuencia & { tipoGrasaId: string }) | null;
  // El último que reinicia el vencimiento.
  ultimoCompleto: UltimoCompleto | null;
  // El último de cualquier tipo: fija la fecha y el horómetro mínimos del siguiente.
  ultimoRegistro: UltimoCompleto | null;
};

export type FilaEngrase = EquipoEngrase &
  Situacion & {
    // Los que se marcan al registrar: los del plan o, si no tiene, las plantillas.
    puntos: Punto[];
    puntosPropios: boolean;
  };

export type RegistroEngrase = {
  id: string;
  fecha: FechaISO;
  horometro: number;
  grasa: string;
  completo: boolean;
  observacion: string | null;
  registradoPor: string;
  creadoEn: string;
  puntos: { descripcion: string; engrasado: boolean }[];
};

export type EmpresaEngrase = { zonaHoraria: string; aviso: Umbral };

export interface LectorEngrase {
  // Solo equipos activos con requiere_engrase de la empresa de la sesión.
  equipos(equipoId?: string): Promise<EquipoEngrase[]>;
  empresa(empresaId: string): Promise<EmpresaEngrase>;
  // Activos de la empresa.
  grasas(): Promise<{ id: string; nombre: string }[]>;
  plantillas(): Promise<Plantilla[]>;
  // Puntos propios activos (de un equipo o de todos).
  puntos(equipoId?: string): Promise<(Punto & { equipoId: string })[]>;
  // Más reciente primero.
  registros(equipoId: string): Promise<RegistroEngrase[]>;
}

export interface EngraseRepositorio {
  guardarPlan(datos: PlanEntrada): Promise<Result<void>>;
  registrar(datos: RegistroEntrada): Promise<Result<void>>;
  configurarAviso(datos: AvisoEntrada): Promise<Result<void>>;
}

export type ReposEngrase = {
  lector: LectorEngrase;
  engrase: EngraseRepositorio;
};

export type ListadoEngrase = {
  filas: FilaEngrase[];
  grasas: { id: string; nombre: string }[];
  aviso: Umbral;
  hoy: FechaISO;
};

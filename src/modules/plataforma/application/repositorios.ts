import type { FechaISO } from "@/shared/kernel/fechas";
import type { Result } from "@/shared/kernel/result";

export type NuevaEmpresa = {
  nombre: string;
  razonSocial: string | null;
  ruc: string;
  slug: string;
  correoContacto: string | null;
  planId: string;
  diasGracia: number;
};

export type EmpresaParaMembresia = {
  id: string;
  estado: "ACTIVA" | "INACTIVA";
  diasGracia: number;
  zonaHoraria: string;
  // Fin de la membresía VIGENTE más lejana, o nulo si nunca pagó.
  finVigente: FechaISO | null;
};

export type MotivoBaja = "VENCIMIENTO" | "MANUAL";

export type DatosEmpresa = Omit<NuevaEmpresa, "slug" | "planId">;

export interface EmpresasRepositorio {
  crear(datos: NuevaEmpresa): Promise<Result<{ id: string }>>;
  // El slug no cambia: ya puede estar en uso.
  actualizar(id: string, datos: DatosEmpresa): Promise<Result<void>>;
  // Una transacción en la base: plan nuevo, precio vigente del plan, empresa activa y membresía + pago de 30 días.
  renovar(datos: {
    empresaId: string;
    planId: string;
    inicio: FechaISO;
    fin: FechaISO;
    referencia: string | null;
  }): Promise<Result<void>>;
  obtenerParaMembresia(id: string): Promise<Result<EmpresaParaMembresia>>;
  // Una transacción: empresa inactiva, periodo actual cortado hoy y futuros anulados.
  darDeBaja(id: string, motivo: MotivoBaja): Promise<Result<void>>;
}

export interface PlanesRepositorio {
  existeActivo(id: string): Promise<boolean>;
  cambiarPrecio(id: string, precioMensual: number): Promise<Result<void>>;
}

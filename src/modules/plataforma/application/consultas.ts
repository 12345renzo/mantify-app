import { exigirSuperadmin, type Actor } from "@/shared/kernel/actor";
import type { FechaISO } from "@/shared/kernel/fechas";
import { ok, type Result } from "@/shared/kernel/result";
import type { EstadoMembresia } from "../domain/estado-membresia";

export type Plan = {
  id: string;
  codigo: string;
  nombre: string;
  maxAccesos: number | null;
  precioMensual: number;
  moneda: string;
};

export type EmpresaResumen = {
  id: string;
  nombre: string;
  ruc: string;
  razonSocial: string | null;
  correoContacto: string | null;
  planId: string;
  estado: EstadoMembresia;
  fechaInicio: FechaISO | null;
  fechaFin: FechaISO | null;
  diasGracia: number;
  motivoInactivacion: string | null;
  cuentas: number;
};

export type PagoRegistrado = {
  id: string;
  monto: number;
  moneda: string;
  referencia: string | null;
  registradoEn: string;
  periodo: { inicio: FechaISO; fin: FechaISO } | null;
};

export type DetalleEmpresa = EmpresaResumen & {
  // Estado guardado por el superadmin (ACTIVA/INACTIVA), distinto del estado calculado de la membresía.
  activa: boolean;
  razonSocial: string | null;
  correoContacto: string | null;
  zonaHoraria: string;
  // Plan ya pagado que aún no empieza.
  proximoPlan: { planId: string; desde: FechaISO } | null;
  pagos: PagoRegistrado[];
};

export interface LectorPlataforma {
  listarPlanes(): Promise<Plan[]>;
  listarEmpresas(): Promise<EmpresaResumen[]>;
  obtenerEmpresa(id: string): Promise<DetalleEmpresa | null>;
}

export async function listarEmpresas(
  actor: Actor | null,
  lector: LectorPlataforma,
): Promise<Result<EmpresaResumen[]>> {
  const permiso = exigirSuperadmin(actor);
  if (!permiso.ok) return permiso;
  return ok(await lector.listarEmpresas());
}

export async function obtenerEmpresa(
  actor: Actor | null,
  id: string,
  lector: LectorPlataforma,
): Promise<Result<DetalleEmpresa | null>> {
  const permiso = exigirSuperadmin(actor);
  if (!permiso.ok) return permiso;
  return ok(await lector.obtenerEmpresa(id));
}

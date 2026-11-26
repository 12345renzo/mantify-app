import type { Actor } from "@/shared/kernel/actor";
import { ok, type Result } from "@/shared/kernel/result";
import type { Cupo } from "../domain/reglas-persona-cuenta";
import { empresaDeTrabajo, exigirPermiso } from "./acceso";

export type PersonaFila = {
  id: string;
  nombres: string;
  apellidos: string;
  documento: string | null;
  tipoDocumento: string | null;
  numeroDocumento: string | null;
  cargo: string | null;
  telefono: string | null;
  tipoVinculo: string | null;
  activa: boolean;
  cuentaId: string | null;
};

export type CuentaFila = {
  id: string;
  correo: string;
  rol: string;
  persona: { id: string; nombre: string } | null;
  activa: boolean;
  debeCambiarClave: boolean;
  ultimoAcceso: string | null;
};

export type Personal = {
  empresa: { id: string; nombre: string };
  cupo: Cupo;
  personas: PersonaFila[];
  cuentas: CuentaFila[];
};

export type MiPerfil = {
  nombre: string | null;
  cargo: string | null;
  empresa: string | null;
};

export interface LectorIdentidad {
  personal(empresaId: string): Promise<Personal | null>;
  miPerfil(actor: Actor): Promise<MiPerfil>;
}

// Gerente: solo lectura. Las cuentas solo las ven planificador, gerente y superadmin.
export async function verPersonal(
  actor: Actor | null,
  empresaIdPedida: string | null,
  lector: LectorIdentidad,
): Promise<Result<Personal | null>> {
  const permiso = exigirPermiso(actor, "leer", "cuentas");
  if (!permiso.ok) return permiso;
  const empresa = empresaDeTrabajo(permiso.value, empresaIdPedida);
  if (!empresa.ok) return empresa;
  return ok(await lector.personal(empresa.value));
}

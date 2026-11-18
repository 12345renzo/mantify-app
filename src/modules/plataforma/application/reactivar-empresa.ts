import { DomainError } from "@/shared/kernel/errors";
import { exigirSuperadmin, type Actor } from "@/shared/kernel/actor";
import { hoyEn, type FechaISO } from "@/shared/kernel/fechas";
import { err, ok, type Result } from "@/shared/kernel/result";
import { calcularEstadoMembresia } from "../domain/estado-membresia";
import {
  calcularFinMembresia,
  calcularInicioNuevaMembresia,
} from "../domain/regla-nueva-membresia";
import type { ReactivarEmpresaEntrada } from "./esquemas";
import type { EmpresasRepositorio, PlanesRepositorio } from "./repositorios";

// Solo cuando el plan ya venció (pasó la gracia). Cobra 30 días al precio vigente del plan elegido.
export async function reactivarEmpresa(
  actor: Actor | null,
  entrada: ReactivarEmpresaEntrada,
  repos: { empresas: EmpresasRepositorio; planes: PlanesRepositorio },
  ahora: Date = new Date(),
): Promise<Result<{ inicio: FechaISO; fin: FechaISO }>> {
  const permiso = exigirSuperadmin(actor);
  if (!permiso.ok) return permiso;

  const empresa = await repos.empresas.obtenerParaMembresia(entrada.empresaId);
  if (!empresa.ok) return empresa;
  const e = empresa.value;

  const hoy = hoyEn(e.zonaHoraria, ahora);
  const estado = calcularEstadoMembresia(
    { fin: e.finVigente, empresaInactiva: false },
    e.diasGracia,
    hoy,
  );
  // Sin membresía nunca (fin nulo) tampoco aplica: ese caso es el primer pago.
  if (estado !== "VENCIDA") {
    return err(new DomainError("CONFLICT", "el plan todavía no venció"));
  }
  if (!(await repos.planes.existeActivo(entrada.planId))) {
    return err(new DomainError("VALIDATION", "plan no existe o inactivo"));
  }

  const inicio = calcularInicioNuevaMembresia(e.finVigente, hoy, e.diasGracia);
  const fin = calcularFinMembresia(inicio);
  const r = await repos.empresas.reactivar({
    empresaId: entrada.empresaId,
    planId: entrada.planId,
    inicio,
    fin,
    referencia: entrada.referencia,
  });
  if (!r.ok) return r;
  return ok({ inicio, fin });
}

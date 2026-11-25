import { DomainError } from "@/shared/kernel/errors";
import { exigirSuperadmin, type Actor } from "@/shared/kernel/actor";
import { hoyEn, type FechaISO } from "@/shared/kernel/fechas";
import { err, ok, type Result } from "@/shared/kernel/result";
import {
  calcularEstadoMembresia,
  puedeRenovar,
} from "../domain/estado-membresia";
import {
  calcularFinMembresia,
  calcularInicioNuevaMembresia,
} from "../domain/regla-nueva-membresia";
import type { RenovarEmpresaEntrada } from "./esquemas";
import type { EmpresasRepositorio, PlanesRepositorio } from "./repositorios";

// Cobra 30 días al precio vigente del plan elegido. La base rechaza (LIMIT) un plan que no cubra las cuentas.
export async function renovarEmpresa(
  actor: Actor | null,
  entrada: RenovarEmpresaEntrada,
  repos: { empresas: EmpresasRepositorio; planes: PlanesRepositorio },
  ahora: Date = new Date(),
): Promise<Result<{ inicio: FechaISO; fin: FechaISO }>> {
  const permiso = exigirSuperadmin(actor);
  if (!permiso.ok) return permiso;

  const empresa = await repos.empresas.obtenerParaMembresia(entrada.empresaId);
  if (!empresa.ok) return empresa;
  const e = empresa.value;

  const hoy = hoyEn(e.zonaHoraria, ahora);
  const deBaja = e.estado === "INACTIVA";
  const estado = calcularEstadoMembresia(
    { fin: e.finVigente, empresaInactiva: deBaja },
    e.diasGracia,
    hoy,
  );
  if (!puedeRenovar(estado)) {
    return err(
      new DomainError("CONFLICT", "el plan todavía no está por vencer"),
    );
  }
  if (!(await repos.planes.existeActivo(entrada.planId))) {
    return err(new DomainError("VALIDATION", "plan no existe o inactivo"));
  }

  const inicio = calcularInicioNuevaMembresia(
    e.finVigente,
    hoy,
    e.diasGracia,
    deBaja,
  );
  const fin = calcularFinMembresia(inicio);
  const r = await repos.empresas.renovar({
    empresaId: entrada.empresaId,
    planId: entrada.planId,
    inicio,
    fin,
    referencia: entrada.referencia,
  });
  if (!r.ok) return r;
  return ok({ inicio, fin });
}

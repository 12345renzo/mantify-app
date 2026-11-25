import { DomainError } from "@/shared/kernel/errors";
import { exigirSuperadmin, type Actor } from "@/shared/kernel/actor";
import { hoyEn } from "@/shared/kernel/fechas";
import { err, type Result } from "@/shared/kernel/result";
import { calcularEstadoMembresia } from "../domain/estado-membresia";
import type { DarDeBajaEntrada } from "./esquemas";
import type { EmpresasRepositorio } from "./repositorios";

export async function darDeBajaEmpresa(
  actor: Actor | null,
  entrada: DarDeBajaEntrada,
  repos: { empresas: EmpresasRepositorio },
  ahora: Date = new Date(),
): Promise<Result<void>> {
  const permiso = exigirSuperadmin(actor);
  if (!permiso.ok) return permiso;

  const empresa = await repos.empresas.obtenerParaMembresia(entrada.empresaId);
  if (!empresa.ok) return empresa;
  const e = empresa.value;
  if (e.estado === "INACTIVA") {
    return err(new DomainError("CONFLICT", "la empresa ya está de baja"));
  }

  // Vencida por falta de pago → VENCIMIENTO. Cualquier otro caso es una baja manual.
  const estado = calcularEstadoMembresia(
    { fin: e.finVigente, empresaInactiva: false },
    e.diasGracia,
    hoyEn(e.zonaHoraria, ahora),
  );
  return repos.empresas.darDeBaja(
    entrada.empresaId,
    estado === "VENCIDA" ? "VENCIMIENTO" : "MANUAL",
  );
}

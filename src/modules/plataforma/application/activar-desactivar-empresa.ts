import { hoyEn } from "@/shared/kernel/fechas";
import type { Result } from "@/shared/kernel/result";
import { calcularEstadoMembresia } from "../domain/estado-membresia";
import { exigirSuperadmin, type Actor } from "@/shared/kernel/actor";
import type { CambiarEstadoEntrada } from "./esquemas";
import type { EmpresasRepositorio } from "./repositorios";

export async function activarDesactivarEmpresa(
  actor: Actor | null,
  entrada: CambiarEstadoEntrada,
  repos: { empresas: EmpresasRepositorio },
  ahora: Date = new Date(),
): Promise<Result<void>> {
  const permiso = exigirSuperadmin(actor);
  if (!permiso.ok) return permiso;

  if (entrada.accion === "ACTIVAR") {
    return repos.empresas.cambiarEstado(entrada.empresaId, {
      estado: "ACTIVA",
    });
  }

  const empresa = await repos.empresas.obtenerParaMembresia(entrada.empresaId);
  if (!empresa.ok) return empresa;

  // Vencida por falta de pago → VENCIMIENTO. Cualquier otro caso es una baja manual.
  const estado = calcularEstadoMembresia(
    { fin: empresa.value.finVigente, empresaInactiva: false },
    empresa.value.diasGracia,
    hoyEn(empresa.value.zonaHoraria, ahora),
  );
  return repos.empresas.cambiarEstado(entrada.empresaId, {
    estado: "INACTIVA",
    motivo: estado === "VENCIDA" ? "VENCIMIENTO" : "MANUAL",
  });
}

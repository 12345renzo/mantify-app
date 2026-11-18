import { hoyEn, type FechaISO } from "@/shared/kernel/fechas";
import { ok, type Result } from "@/shared/kernel/result";
import {
  calcularFinMembresia,
  calcularInicioNuevaMembresia,
} from "../domain/regla-nueva-membresia";
import { exigirSuperadmin, type Actor } from "@/shared/kernel/actor";
import type { RegistrarPagoEntrada } from "./esquemas";
import type {
  EmpresasRepositorio,
  MembresiasRepositorio,
} from "./repositorios";

export async function registrarPagoManual(
  actor: Actor | null,
  entrada: RegistrarPagoEntrada,
  repos: { empresas: EmpresasRepositorio; membresias: MembresiasRepositorio },
  ahora: Date = new Date(),
): Promise<Result<{ membresiaId: string; inicio: FechaISO; fin: FechaISO }>> {
  const permiso = exigirSuperadmin(actor);
  if (!permiso.ok) return permiso;

  const empresa = await repos.empresas.obtenerParaMembresia(entrada.empresaId);
  if (!empresa.ok) return empresa;

  const hoy = hoyEn(empresa.value.zonaHoraria, ahora);
  const inicio = calcularInicioNuevaMembresia(
    empresa.value.finVigente,
    hoy,
    empresa.value.diasGracia,
  );
  const fin = calcularFinMembresia(inicio);

  // Si otro pago entró a la vez, la restricción de exclusión de la base lo rechaza (CONFLICT).
  const creado = await repos.membresias.registrarPagoManual({
    empresaId: entrada.empresaId,
    inicio,
    fin,
    referencia: entrada.referencia,
  });
  if (!creado.ok) return creado;
  return ok({ membresiaId: creado.value.membresiaId, inicio, fin });
}

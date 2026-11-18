import { exigirSuperadmin, type Actor } from "@/shared/kernel/actor";
import type { Result } from "@/shared/kernel/result";
import { validarRuc } from "../domain/ruc";
import type { EditarEmpresaEntrada } from "./esquemas";
import type { EmpresasRepositorio } from "./repositorios";

export async function editarEmpresa(
  actor: Actor | null,
  entrada: EditarEmpresaEntrada,
  repos: { empresas: EmpresasRepositorio },
): Promise<Result<void>> {
  const permiso = exigirSuperadmin(actor);
  if (!permiso.ok) return permiso;

  const ruc = validarRuc(entrada.ruc);
  if (!ruc.ok) return ruc;

  const { empresaId, ...datos } = entrada;
  return repos.empresas.actualizar(empresaId, { ...datos, ruc: ruc.value });
}

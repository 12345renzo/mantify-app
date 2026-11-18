import { DomainError } from "@/shared/kernel/errors";
import { err, type Result } from "@/shared/kernel/result";
import { validarRuc } from "../domain/ruc";
import { crearSlugEmpresa } from "../domain/slug";
import { exigirSuperadmin, type Actor } from "@/shared/kernel/actor";
import type { CrearEmpresaEntrada } from "./esquemas";
import type { EmpresasRepositorio, PlanesRepositorio } from "./repositorios";

export async function crearEmpresa(
  actor: Actor | null,
  entrada: CrearEmpresaEntrada,
  repos: { empresas: EmpresasRepositorio; planes: PlanesRepositorio },
): Promise<Result<{ id: string }>> {
  const permiso = exigirSuperadmin(actor);
  if (!permiso.ok) return permiso;

  const ruc = validarRuc(entrada.ruc);
  if (!ruc.ok) return ruc;

  if (!(await repos.planes.existeActivo(entrada.planId))) {
    return err(new DomainError("VALIDATION", "plan no existe o inactivo"));
  }

  return repos.empresas.crear({
    nombre: entrada.nombre,
    razonSocial: entrada.razonSocial,
    ruc: ruc.value,
    slug: crearSlugEmpresa(entrada.nombre, ruc.value),
    correoContacto: entrada.correoContacto,
    planId: entrada.planId,
    diasGracia: entrada.diasGracia,
  });
}

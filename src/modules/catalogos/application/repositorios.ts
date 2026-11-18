import type { Result } from "@/shared/kernel/result";
import type { CodigoCatalogo, Valores } from "../domain/catalogos";

export type Elemento = {
  id: string;
  activo: boolean;
  // Solo los campos que declara el catálogo.
  valores: Valores;
};

export interface CatalogosRepositorio {
  listar(catalogo: CodigoCatalogo, empresaId: string): Promise<Elemento[]>;
  crear(
    catalogo: CodigoCatalogo,
    empresaId: string,
    valores: Valores,
  ): Promise<Result<void>>;
  // RLS solo deja tocar filas de la propia empresa: otra empresa = NOT_FOUND.
  actualizar(
    catalogo: CodigoCatalogo,
    id: string,
    valores: Valores,
  ): Promise<Result<void>>;
  cambiarActivo(
    catalogo: CodigoCatalogo,
    id: string,
    activo: boolean,
  ): Promise<Result<void>>;
}

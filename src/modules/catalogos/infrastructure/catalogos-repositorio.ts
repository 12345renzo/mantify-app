import "server-only";
import { DomainError } from "@/shared/kernel/errors";
import { err, ok, type Result } from "@/shared/kernel/result";
import { aDomainError } from "@/shared/supabase/errores";
import type { SupabaseServidor } from "@/shared/supabase/server";
import {
  CATALOGOS,
  camposEditables,
  type CodigoCatalogo,
  type Valores,
} from "../domain/catalogos";
import type { CatalogosRepositorio } from "../application/repositorios";

// Una sola implementación para las 11 tablas. El nombre de tabla sale de la lista cerrada CODIGOS_CATALOGO
// y las columnas, de la definición del catálogo; el cast solo calla al cliente tipado, que no acepta uniones.
const tabla = (db: SupabaseServidor, c: CodigoCatalogo) =>
  db.from(c as "ubicaciones");

// Solo columnas editables del catálogo, aunque lleguen más claves.
function columnas(c: CodigoCatalogo, v: Valores) {
  return Object.fromEntries(
    camposEditables(CATALOGOS[c]).map((campo) => [
      campo.clave,
      v[campo.clave] ?? null,
    ]),
  );
}

const unaFila = (n: number): Result<void> =>
  n === 0
    ? err(new DomainError("NOT_FOUND", "elemento no existe"))
    : ok(undefined);

export function crearCatalogosRepositorio(
  db: SupabaseServidor,
): CatalogosRepositorio {
  return {
    async listar(c, empresaId) {
      const def = CATALOGOS[c];
      let q = tabla(db, c).select("*").eq("empresa_id", empresaId);
      for (const col of def.ordenarPor) {
        q = q.order(col as "nombre", { nullsFirst: false });
      }
      const { data, error } = await q.limit(1000);
      if (error) throw aDomainError(error);
      return (data as unknown as Record<string, unknown>[]).map((f) => ({
        id: String(f.id),
        activo: Boolean(f.activo),
        valores: Object.fromEntries(
          def.campos.map((campo) => {
            const v = f[campo.clave];
            // numeric llega como texto desde PostgREST.
            return [
              campo.clave,
              campo.tipo === "numero" && v !== null
                ? Number(v)
                : (v as Valores[string]),
            ];
          }),
        ),
      }));
    },

    async crear(c, empresaId, v) {
      const { error } = await tabla(db, c).insert({
        empresa_id: empresaId,
        ...columnas(c, v),
      } as never);
      if (error) return err(aDomainError(error));
      return ok(undefined);
    },

    async actualizar(c, id, v) {
      const { data, error } = await tabla(db, c)
        .update(columnas(c, v) as never)
        .eq("id", id)
        .select("id");
      if (error) return err(aDomainError(error));
      return unaFila(data.length);
    },

    async cambiarActivo(c, id, activo) {
      const { data, error } = await tabla(db, c)
        .update({ activo })
        .eq("id", id)
        .select("id");
      if (error) return err(aDomainError(error));
      return unaFila(data.length);
    },
  };
}

import "server-only";
import { DomainError } from "@/shared/kernel/errors";
import { err, ok } from "@/shared/kernel/result";
import { aDomainError } from "@/shared/supabase/errores";
import type { SupabaseServidor } from "@/shared/supabase/server";
import type { PlanesRepositorio } from "../application/repositorios";

export function crearPlanesRepositorio(
  db: SupabaseServidor,
): PlanesRepositorio {
  return {
    async existeActivo(id) {
      const { data, error } = await db
        .from("planes")
        .select("id")
        .eq("id", id)
        .eq("activo", true)
        .maybeSingle();
      if (error) throw aDomainError(error);
      return data !== null;
    },

    async cambiarPrecio(id, precioMensual) {
      const { data, error } = await db
        .from("planes")
        .update({
          precio_mensual: precioMensual,
          actualizado_en: new Date().toISOString(),
        })
        .eq("id", id)
        .select("id");
      if (error) return err(aDomainError(error));
      if (data.length === 0)
        return err(new DomainError("NOT_FOUND", "plan no existe"));
      return ok(undefined);
    },
  };
}

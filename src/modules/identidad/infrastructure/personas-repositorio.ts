import "server-only";
import { DomainError } from "@/shared/kernel/errors";
import { err, ok } from "@/shared/kernel/result";
import { aDomainError } from "@/shared/supabase/errores";
import type { SupabaseServidor } from "@/shared/supabase/server";
import type { PersonasRepositorio } from "../application/repositorios";

export function crearPersonasRepositorio(
  db: SupabaseServidor,
): PersonasRepositorio {
  return {
    async crear(empresaId, d, creadoPor) {
      const { data, error } = await db
        .from("personas")
        .insert({
          empresa_id: empresaId,
          nombres: d.nombres,
          apellidos: d.apellidos,
          tipo_documento: d.tipoDocumento,
          numero_documento: d.numeroDocumento,
          cargo: d.cargo,
          telefono: d.telefono,
          tipo_vinculo: d.tipoVinculo,
          creado_por: creadoPor,
        })
        .select("id")
        .single();
      if (error) return err(aDomainError(error));
      return ok({ id: data.id });
    },

    async obtener(id) {
      const [persona, cuenta] = await Promise.all([
        db
          .from("personas")
          .select("id, empresa_id, estado")
          .eq("id", id)
          .maybeSingle(),
        db
          .from("usuarios")
          .select("id, rol")
          .eq("persona_id", id)
          .maybeSingle(),
      ]);
      if (persona.error) return err(aDomainError(persona.error));
      if (cuenta.error) return err(aDomainError(cuenta.error));
      if (!persona.data)
        return err(new DomainError("NOT_FOUND", "persona no existe"));
      return ok({
        id: persona.data.id,
        empresaId: persona.data.empresa_id,
        activa: persona.data.estado === "ACTIVA",
        cuenta: cuenta.data
          ? { id: cuenta.data.id, rol: cuenta.data.rol }
          : null,
      });
    },

    async actualizar(id, d) {
      const { data, error } = await db
        .from("personas")
        .update({
          nombres: d.nombres,
          apellidos: d.apellidos,
          tipo_documento: d.tipoDocumento,
          numero_documento: d.numeroDocumento,
          cargo: d.cargo,
          telefono: d.telefono,
          tipo_vinculo: d.tipoVinculo,
          actualizado_en: new Date().toISOString(),
        })
        .eq("id", id)
        .select("id");
      if (error) return err(aDomainError(error));
      if (data.length === 0) {
        return err(new DomainError("NOT_FOUND", "persona no existe"));
      }
      return ok(undefined);
    },

    async darDeBaja(id) {
      const { error } = await db.rpc("dar_baja_persona", { p_persona_id: id });
      if (error) return err(aDomainError(error));
      return ok(undefined);
    },

    async reactivar(id) {
      const { data, error } = await db
        .from("personas")
        .update({
          estado: "ACTIVA",
          dado_de_baja_en: null,
          actualizado_en: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("estado", "BAJA")
        .select("id");
      if (error) return err(aDomainError(error));
      if (data.length === 0) {
        return err(new DomainError("CONFLICT", "no está de baja"));
      }
      return ok(undefined);
    },
  };
}

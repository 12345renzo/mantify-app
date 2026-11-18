import "server-only";
import { DomainError } from "@/shared/kernel/errors";
import { err, ok } from "@/shared/kernel/result";
import { aDomainError } from "@/shared/supabase/errores";
import type { SupabaseServidor } from "@/shared/supabase/server";
import type { CuentasRepositorio } from "../application/repositorios";

export function crearCuentasRepositorio(
  db: SupabaseServidor,
): CuentasRepositorio {
  return {
    async cupo(empresaId) {
      const [usados, empresa] = await Promise.all([
        db
          .from("usuarios")
          .select("id", { count: "exact", head: true })
          .eq("empresa_id", empresaId),
        db
          .from("empresas")
          .select("planes(max_accesos)")
          .eq("id", empresaId)
          .maybeSingle(),
      ]);
      if (usados.error) throw aDomainError(usados.error);
      if (empresa.error) throw aDomainError(empresa.error);
      const plan = empresa.data?.planes as
        { max_accesos: number | null } | null | undefined;
      return { usados: usados.count ?? 0, maximo: plan?.max_accesos ?? null };
    },

    async insertar(d) {
      const { error } = await db.from("usuarios").insert({
        id: d.id,
        empresa_id: d.empresaId,
        persona_id: d.personaId,
        rol: d.rol,
        correo: d.correo,
        creado_por: d.creadoPor,
      });
      if (error) return err(aDomainError(error));
      return ok(undefined);
    },

    async obtener(id) {
      const { data, error } = await db
        .from("usuarios")
        .select("id, empresa_id, rol, persona_id, correo")
        .eq("id", id)
        .maybeSingle();
      if (error) return err(aDomainError(error));
      if (!data) return err(new DomainError("NOT_FOUND", "cuenta no existe"));
      return ok({
        id: data.id,
        empresaId: data.empresa_id,
        rol: data.rol,
        personaId: data.persona_id,
        correo: data.correo,
      });
    },

    async asignarPersona(id, personaId, correo) {
      const { error } = await db.rpc("asignar_persona", {
        p_usuario_id: id,
        p_persona_id: personaId,
        p_correo: correo,
      });
      if (error) return err(aDomainError(error));
      return ok(undefined);
    },

    async cambiarRol(id, rol) {
      const { data, error } = await db
        .from("usuarios")
        .update({ rol, actualizado_en: new Date().toISOString() })
        .eq("id", id)
        .select("id");
      if (error) return err(aDomainError(error));
      // RLS no da error al filtrar: cero filas es "no existe o no puedes cambiarla".
      if (data.length === 0) {
        return err(
          new DomainError("FORBIDDEN", "no puede cambiar esta cuenta"),
        );
      }
      return ok(undefined);
    },

    async marcarClaveCambiada() {
      const { error } = await db.rpc("marcar_clave_cambiada");
      if (error) return err(aDomainError(error));
      return ok(undefined);
    },
  };
}

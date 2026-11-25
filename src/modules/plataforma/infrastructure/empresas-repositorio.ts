import "server-only";
import { DomainError } from "@/shared/kernel/errors";
import { err, ok, type Result } from "@/shared/kernel/result";
import { aDomainError } from "@/shared/supabase/errores";
import type { SupabaseServidor } from "@/shared/supabase/server";
import type {
  EmpresaParaMembresia,
  EmpresasRepositorio,
  NuevaEmpresa,
} from "../application/repositorios";

export function crearEmpresasRepositorio(
  db: SupabaseServidor,
): EmpresasRepositorio {
  return {
    async crear(d: NuevaEmpresa): Promise<Result<{ id: string }>> {
      const { data, error } = await db
        .from("empresas")
        .insert({
          nombre: d.nombre,
          razon_social: d.razonSocial,
          ruc: d.ruc,
          slug: d.slug,
          correo_contacto: d.correoContacto,
          plan_id: d.planId,
          dias_gracia: d.diasGracia,
        })
        .select("id")
        .single();
      if (error) return err(aDomainError(error));
      return ok({ id: data.id });
    },

    async actualizar(id, d) {
      const { data, error } = await db
        .from("empresas")
        .update({
          nombre: d.nombre,
          razon_social: d.razonSocial,
          ruc: d.ruc,
          correo_contacto: d.correoContacto,
          dias_gracia: d.diasGracia,
          actualizado_en: new Date().toISOString(),
        })
        .eq("id", id)
        .select("id");
      if (error) return err(aDomainError(error));
      if (data.length === 0) {
        return err(new DomainError("NOT_FOUND", "empresa no existe"));
      }
      return ok(undefined);
    },

    async renovar(d) {
      const { error } = await db.rpc("reactivar_empresa", {
        p_empresa_id: d.empresaId,
        p_plan_id: d.planId,
        p_fecha_inicio: d.inicio,
        p_fecha_fin: d.fin,
        p_referencia: d.referencia ?? "",
      });
      if (error) return err(aDomainError(error));
      return ok(undefined);
    },

    async obtenerParaMembresia(
      id: string,
    ): Promise<Result<EmpresaParaMembresia>> {
      const { data, error } = await db
        .from("empresas")
        .select("id, estado, dias_gracia, zona_horaria")
        .eq("id", id)
        .maybeSingle();
      if (error) return err(aDomainError(error));
      if (!data) return err(new DomainError("NOT_FOUND", "empresa no existe"));

      const vigente = await db
        .from("membresias")
        .select("fecha_fin")
        .eq("empresa_id", id)
        .eq("estado", "VIGENTE")
        .order("fecha_fin", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (vigente.error) return err(aDomainError(vigente.error));

      return ok({
        id: data.id,
        estado: data.estado === "INACTIVA" ? "INACTIVA" : "ACTIVA",
        diasGracia: data.dias_gracia,
        zonaHoraria: data.zona_horaria,
        finVigente: vigente.data?.fecha_fin ?? null,
      });
    },

    async darDeBaja(id, motivo): Promise<Result<void>> {
      const { error } = await db.rpc("dar_de_baja_empresa", {
        p_empresa_id: id,
        p_motivo: motivo,
      });
      if (error) return err(aDomainError(error));
      return ok(undefined);
    },
  };
}

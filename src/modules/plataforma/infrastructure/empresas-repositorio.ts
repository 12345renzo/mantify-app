import "server-only";
import { DomainError } from "@/shared/kernel/errors";
import { err, ok, type Result } from "@/shared/kernel/result";
import { aDomainError } from "@/shared/supabase/errores";
import type { SupabaseServidor } from "@/shared/supabase/server";
import type {
  CambioEstadoEmpresa,
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

    async reactivar(d) {
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

    async cambiarEstado(
      id: string,
      cambio: CambioEstadoEmpresa,
    ): Promise<Result<void>> {
      const ahora = new Date().toISOString();
      const valores =
        cambio.estado === "ACTIVA"
          ? { estado: "ACTIVA", motivo_inactivacion: null, inactivada_en: null }
          : {
              estado: "INACTIVA",
              motivo_inactivacion: cambio.motivo,
              inactivada_en: ahora,
            };
      const { data, error } = await db
        .from("empresas")
        .update({ ...valores, actualizado_en: ahora })
        .eq("id", id)
        .select("id");
      if (error) return err(aDomainError(error));
      // RLS no da error al filtrar: cero filas es "no existe o no puedes verla".
      if (data.length === 0) {
        return err(new DomainError("NOT_FOUND", "empresa no existe"));
      }
      return ok(undefined);
    },
  };
}

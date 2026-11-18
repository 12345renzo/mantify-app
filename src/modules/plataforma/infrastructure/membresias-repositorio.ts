import "server-only";
import { err, ok } from "@/shared/kernel/result";
import { aDomainError } from "@/shared/supabase/errores";
import type { SupabaseServidor } from "@/shared/supabase/server";
import type { MembresiasRepositorio } from "../application/repositorios";

export function crearMembresiasRepositorio(
  db: SupabaseServidor,
): MembresiasRepositorio {
  return {
    async registrarPagoManual(d) {
      // Función de la base: bloquea la empresa, toma el monto del plan y crea membresía + pago en una transacción.
      const { data, error } = await db.rpc("registrar_pago_manual", {
        p_empresa_id: d.empresaId,
        p_fecha_inicio: d.inicio,
        p_fecha_fin: d.fin,
        p_referencia: d.referencia ?? "",
      });
      if (error) return err(aDomainError(error));
      return ok({ membresiaId: data });
    },
  };
}

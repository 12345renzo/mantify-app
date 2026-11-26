import "server-only";
import { listarEngrase } from "@/modules/engrase/application/casos-uso";
import { reposEngrase } from "@/modules/engrase/infrastructure";
import { listarNeumaticos } from "@/modules/neumaticos/application/casos-uso";
import { reposNeumaticos } from "@/modules/neumaticos/infrastructure";
import { listarEquipos } from "@/modules/equipos/application/casos-uso";
import { reposEquipos } from "@/modules/equipos/infrastructure";
import { rankingParadas } from "@/modules/paradas/application/casos-uso";
import { reposParadas } from "@/modules/paradas/infrastructure";
import { listarPreventivos } from "@/modules/preventivos/application/casos-uso";
import { reposPreventivos } from "@/modules/preventivos/infrastructure";
import {
  listarTrabajos,
  verTrabajo,
} from "@/modules/trabajos/application/casos-uso";
import { reposTrabajos } from "@/modules/trabajos/infrastructure";
import type { Actor } from "@/shared/kernel/actor";
import type { Result } from "@/shared/kernel/result";
import { aDomainError } from "@/shared/supabase/errores";
import { createSupabaseServerClient } from "@/shared/supabase/server";
import type {
  DatosDashboard,
  FuentesDashboard,
  LectorDashboard,
} from "../application/obtener-dashboard";
import type { FuentesExcel } from "../application/exportar";

const valor = <T>(r: Result<T>): T => {
  if (!r.ok) throw r.error;
  return r.value;
};

// Con la sesión del usuario: dashboard_datos filtra por su empresa y, al técnico, por su persona.
export async function reposReportes(actor: Actor): Promise<{
  lector: LectorDashboard;
  fuentes: FuentesDashboard;
}> {
  const db = await createSupabaseServerClient();
  return {
    lector: {
      async zonaHoraria(empresaId) {
        const { data, error } = await db
          .from("empresas")
          .select("zona_horaria")
          .eq("id", empresaId)
          .maybeSingle();
        if (error) throw aDomainError(error);
        return data?.zona_horaria ?? "America/Lima";
      },
      async datos(periodo) {
        const { data, error } = await db.rpc("dashboard_datos", {
          p_desde: periodo.desde,
          p_hasta: periodo.hasta,
        });
        if (error) throw aDomainError(error);
        return data as unknown as DatosDashboard;
      },
    },
    fuentes: {
      async engrase() {
        return valor(await listarEngrase(actor, await reposEngrase())).filas;
      },
      async neumaticos() {
        return valor(await listarNeumaticos(actor, await reposNeumaticos()))
          .filas;
      },
      async ranking(periodo) {
        return valor(
          await rankingParadas(actor, periodo, await reposParadas()),
        );
      },
    },
  };
}

// Cada Excel lee con el caso de uso de su módulo: mismas filas y mismos permisos que la pantalla.
export function fuentesExcel(actor: Actor): FuentesExcel {
  return {
    async trabajos() {
      const repos = await reposTrabajos();
      const vistas = await Promise.all(
        (["abiertos", "validacion", "completados"] as const).map(
          async (vista) =>
            valor(await listarTrabajos(actor, { vista, buscar: null }, repos)),
        ),
      );
      return vistas.flat();
    },
    async preventivos() {
      return valor(await listarPreventivos(actor, await reposPreventivos()));
    },
    async equipos() {
      const repos = await reposEquipos();
      const [activos, inactivos] = await Promise.all(
        [false, true].map(async (inactivos) =>
          valor(await listarEquipos(actor, { inactivos, buscar: null }, repos)),
        ),
      );
      return [...activos, ...inactivos];
    },
    async engrase() {
      return valor(await listarEngrase(actor, await reposEngrase())).filas;
    },
    async neumaticos() {
      return valor(await listarNeumaticos(actor, await reposNeumaticos()))
        .filas;
    },
  };
}

export function fuenteOrden(actor: Actor) {
  return {
    async backlog(id: string) {
      return (
        valor(await verTrabajo(actor, id, await reposTrabajos()))?.backlog ??
        null
      );
    },
    async empresa() {
      const { lector } = await reposParadas();
      return lector.nombreEmpresa(actor.empresaId ?? "");
    },
  };
}

// exportar_empresa revisa en la base que sea su empresa (planificador) o el superadmin.
export async function fuenteRespaldo() {
  const db = await createSupabaseServerClient();
  return {
    async empresa(empresaId: string, completo = false) {
      const { data, error } = await db.rpc("exportar_empresa", {
        p_empresa: empresaId,
        p_completo: completo,
      });
      if (error) throw aDomainError(error);
      return data;
    },
  };
}

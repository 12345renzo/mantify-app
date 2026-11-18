import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { exigirPermiso } from "@/modules/identidad/application/acceso";
import type { Accion, Recurso } from "@/modules/identidad/domain/permisos";
import { exigirSuperadmin, type Actor } from "@/shared/kernel/actor";
import { createSupabaseServerClient } from "@/shared/supabase/server";

// getClaims verifica la firma del JWT; mi_acceso() lee rol, empresa y estado desde la base,
// así una baja o una empresa vencida cortan el acceso en la siguiente petición.
export const obtenerActor = cache(async (): Promise<Actor | null> => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (error || !claims) return null;

  const acceso = await supabase.rpc("mi_acceso").maybeSingle();
  if (acceso.error) throw new Error("No se pudo leer el acceso del usuario");
  const a = acceso.data;
  return {
    id: claims.sub,
    email: claims.email ?? "",
    rol: a?.rol ?? null,
    empresaId: a?.empresa_id ?? null,
    personaId: a?.persona_id ?? null,
    habilitado: a?.habilitado ?? false,
    // Sin fila en usuarios: la cuenta existe en Auth pero no en Mantify.
    motivo: a ? a.motivo : "SIN_CUENTA",
    debeCambiarClave: a?.debe_cambiar_clave ?? false,
  };
});

export function inicioDe(actor: Actor): string {
  return actor.rol === "SUPERADMIN" ? "/panel" : "/inicio";
}

function salidaSinAcceso(actor: Actor | null): never {
  if (!actor) redirect("/login");
  redirect(
    `/login?error=${encodeURIComponent((actor.motivo ?? "sin-acceso").toLowerCase())}`,
  );
}

export async function exigirSuperadminEnPagina(): Promise<Actor> {
  const actor = await obtenerActor();
  const permiso = exigirSuperadmin(actor);
  if (permiso.ok) return permiso.value;
  if (actor?.habilitado) redirect(inicioDe(actor));
  salidaSinAcceso(actor);
}

// Cualquier usuario con acceso habilitado; con permiso, además, ese permiso.
export async function exigirAccesoEnPagina(permiso?: {
  accion: Accion;
  recurso: Recurso;
}): Promise<Actor> {
  const actor = await obtenerActor();
  if (!actor?.habilitado) salidaSinAcceso(actor);
  if (!permiso) return actor;
  const r = exigirPermiso(actor, permiso.accion, permiso.recurso);
  if (!r.ok) redirect(inicioDe(actor));
  return r.value;
}

"use server";

import { redirect } from "next/navigation";
import { loginSchema } from "@/modules/acceso/application/esquemas";
import {
  esMotivoSinAcceso,
  MENSAJE_SIN_ACCESO,
} from "@/modules/identidad/domain/reglas-persona-cuenta";
import { createSupabaseServerClient } from "@/shared/supabase/server";

export type ResultadoLogin = { error: string } | undefined;

// Un solo mensaje para correo o clave incorrectos: no revela si la cuenta existe.
const CREDENCIALES_INVALIDAS = "Correo o contraseña incorrectos.";

export async function iniciarSesion(
  formData: FormData,
): Promise<ResultadoLogin> {
  const datos = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!datos.success) return { error: CREDENCIALES_INVALIDAS };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword(datos.data);
  if (error || !data.user) {
    if (error?.status === 429) {
      return {
        error: "Demasiados intentos. Espera unos minutos y vuelve a probar.",
      };
    }
    return { error: CREDENCIALES_INVALIDAS };
  }

  // La clave es correcta; ahora, ¿la cuenta puede entrar? (persona asignada y empresa al día)
  const acceso = await supabase.rpc("mi_acceso").maybeSingle();
  const a = acceso.data;
  if (acceso.error || !a || !a.habilitado) {
    await supabase.auth.signOut();
    if (acceso.error)
      return { error: "No se pudo comprobar tu acceso. Vuelve a intentar." };
    if (!a) return { error: "Esta cuenta no tiene acceso a Mantify." };
    return {
      error: esMotivoSinAcceso(a.motivo)
        ? MENSAJE_SIN_ACCESO[a.motivo]
        : "Tu cuenta no tiene acceso en este momento.",
    };
  }

  await supabase.rpc("registrar_ingreso");
  redirect(a.rol === "SUPERADMIN" ? "/panel" : "/inicio");
}

export async function cerrarSesion() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}

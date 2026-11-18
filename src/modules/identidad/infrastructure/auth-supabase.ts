import "server-only";
import { randomInt } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { getPublicEnv } from "@/shared/env/env";
import { DomainError } from "@/shared/kernel/errors";
import { err, ok, type Result } from "@/shared/kernel/result";
import { createSupabaseAdminClient } from "@/shared/supabase/admin";
import type { SupabaseServidor } from "@/shared/supabase/server";
import type { ServicioAuth } from "../application/repositorios";

// Sin caracteres que se confunden al dictar o copiar a mano (0/O, 1/l/I).
const ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
const LARGO_CLAVE = 14; // ~82 bits de azar

export function generarClave(): string {
  let clave = "";
  for (let i = 0; i < LARGO_CLAVE; i++)
    clave += ALFABETO[randomInt(ALFABETO.length)];
  return clave;
}

function errorAuth(e: { code?: string; status?: number }): DomainError {
  if (e.code === "email_exists" || e.code === "user_already_exists") {
    return new DomainError("CONFLICT", "correo ya registrado");
  }
  if (e.code === "weak_password")
    return new DomainError("VALIDATION", "clave débil");
  if (e.status === 429)
    return new DomainError("RATE_LIMITED", "demasiados intentos");
  console.error("[auth] error inesperado", { code: e.code, status: e.status });
  throw new Error("Error inesperado de autenticación");
}

// `sesion` es el cliente con la sesión del usuario (para cambiar su propia clave).
export function crearServicioAuth(sesion: SupabaseServidor): ServicioAuth {
  return {
    async crearCuenta(correo) {
      const clave = generarClave();
      const { data, error } =
        await createSupabaseAdminClient().auth.admin.createUser({
          email: correo,
          password: clave,
          email_confirm: true,
        });
      if (error || !data.user) return err(errorAuth(error ?? {}));
      return ok({ id: data.user.id, clave });
    },

    async eliminarCuenta(id) {
      const { error } =
        await createSupabaseAdminClient().auth.admin.deleteUser(id);
      if (error)
        console.error("[auth] no se pudo borrar la cuenta huérfana", { id });
    },

    async cambiarCorreoYClave(id, correo): Promise<Result<{ clave: string }>> {
      const clave = generarClave();
      const { error } =
        await createSupabaseAdminClient().auth.admin.updateUserById(id, {
          email: correo,
          password: clave,
          email_confirm: true,
        });
      if (error) return err(errorAuth(error));
      return ok({ clave });
    },

    // Cliente aparte, sin cookies: comprobar la clave no toca la sesión del navegador.
    async verificarClave(correo, clave) {
      const env = getPublicEnv();
      const temporal = createClient(
        env.NEXT_PUBLIC_SUPABASE_URL,
        env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
          auth: { persistSession: false, autoRefreshToken: false },
        },
      );
      const { data, error } = await temporal.auth.signInWithPassword({
        email: correo,
        password: clave,
      });
      if (error || !data.session) return false;
      await temporal.auth.signOut({ scope: "local" });
      return true;
    },

    async cambiarMiClave(nueva) {
      const { error } = await sesion.auth.updateUser({ password: nueva });
      if (error) return err(errorAuth(error));
      return ok(undefined);
    },
  };
}

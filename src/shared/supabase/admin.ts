import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getServerEnv } from "@/shared/env/env";

// Clave de servicio: salta RLS. Solo para la API admin de Auth (crear cuentas, cambiar credenciales).
// Nunca para leer o escribir tablas de negocio: eso va con la sesión del usuario para que RLS lo revise.
export function createSupabaseAdminClient() {
  const env = getServerEnv();
  return createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
}

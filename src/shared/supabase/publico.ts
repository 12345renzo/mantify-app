import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getPublicEnv } from "@/shared/env/env";
import type { Database } from "./database.types";

// Cliente sin sesión para datos públicos (planes). RLS solo deja ver lo marcado como público.
export function createSupabasePublicClient() {
  const env = getPublicEnv();
  return createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

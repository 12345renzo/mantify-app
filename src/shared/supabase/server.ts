import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { getPublicEnv } from "@/shared/env/env";
import type { Database } from "./database.types";

export const OPCIONES_COOKIE = {
  httpOnly: true,
  secure: true,
  sameSite: "lax",
} as const;

export async function createSupabaseServerClient() {
  const env = getPublicEnv();
  // El cliente lee la sesión con Date.now() al crearse: debe correr solo con la petición, nunca en el prerender.
  await connection();
  const store = await cookies();
  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => store.getAll(),
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              store.set(name, value, { ...options, ...OPCIONES_COOKIE });
            }
          } catch {
            // En Server Components no se pueden escribir cookies; el refresco de sesión lo hace el proxy.
          }
        },
      },
    },
  );
}

export type SupabaseServidor = Awaited<
  ReturnType<typeof createSupabaseServerClient>
>;

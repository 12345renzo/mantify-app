import { z } from "zod";

const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

const serverSchema = publicSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
});

// Solo nombres de variables en el error: nunca valores.
function check<T extends z.ZodType>(
  schema: T,
  source: Record<string, unknown>,
): z.output<T> {
  const result = schema.safeParse(source);
  if (!result.success) {
    const names = [
      ...new Set(result.error.issues.map((issue) => String(issue.path[0]))),
    ];
    throw new Error(
      `Variables de entorno faltantes o inválidas: ${names.join(", ")}`,
    );
  }
  return result.data;
}

// Los accesos literales a process.env son obligatorios: Next solo incrusta las NEXT_PUBLIC_ en el navegador.
export function getPublicEnv() {
  return check(publicSchema, {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
}

// Solo para código de servidor. La clave de servicio nunca debe llegar al navegador.
export function getServerEnv() {
  return check(serverSchema, {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  });
}

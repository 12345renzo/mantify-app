import "server-only";
import type { Archivo } from "@/modules/paradas/application/casos-uso";
import type { Result } from "@/shared/kernel/result";

const ESTADO: Record<string, number> = {
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  VALIDATION: 400,
  NOT_FOUND: 404,
  RATE_LIMITED: 429,
};

// Respuesta de descarga: sin caché (datos de la empresa) y sin que el navegador adivine el tipo.
export function descargar(r: Result<Archivo>): Response {
  if (!r.ok) {
    return new Response(null, { status: ESTADO[r.error.code] ?? 500 });
  }
  return new Response(new Blob([r.value.bytes as BlobPart]), {
    headers: {
      "Content-Type": r.value.tipo,
      "Content-Disposition": `attachment; filename="${r.value.nombre}"`,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

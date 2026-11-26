import type { NextRequest } from "next/server";
import { z } from "zod";
import { obtenerActor } from "@/modules/acceso/infrastructure/sesion";
import { reposIdentidad } from "@/modules/identidad/infrastructure";
import { exportarRespaldo } from "@/modules/reportes/application/exportar";
import { fuenteRespaldo } from "@/modules/reportes/infrastructure";
import { hoyEn } from "@/shared/kernel/fechas";
import { descargar } from "../../paradas/descargar";

const entrada = z.object({
  empresaId: z.uuid(),
  clave: z.string().min(1).max(200),
});

// Respaldo completo de una empresa: solo el superadmin, con su contraseña. POST para que la clave
// no quede en la URL; y solo desde la propia app (una ruta de API no trae la protección de las acciones).
export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin) {
    return new Response(null, { status: 403 });
  }
  const form = await request.formData();
  const datos = entrada.safeParse({
    empresaId: form.get("empresaId"),
    clave: form.get("clave"),
  });
  if (!datos.success) return new Response(null, { status: 400 });
  const { auth } = await reposIdentidad();
  return descargar(
    await exportarRespaldo(
      await obtenerActor(),
      datos.data,
      { auth, fuente: await fuenteRespaldo() },
      hoyEn("America/Lima"),
    ),
  );
}

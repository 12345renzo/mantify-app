import type { NextRequest } from "next/server";
import { obtenerActor } from "@/modules/acceso/infrastructure/sesion";
import { exportarDiario } from "@/modules/paradas/application/casos-uso";
import { fechaUrl } from "@/modules/paradas/application/esquemas";
import { reposParadas } from "@/modules/paradas/infrastructure";
import { descargar } from "../descargar";

// PDF del reporte diario. La empresa sale de la sesión (y de la base), nunca de la URL.
export async function GET(request: NextRequest) {
  const fecha = fechaUrl.safeParse(request.nextUrl.searchParams.get("fecha"));
  if (!fecha.success) return new Response(null, { status: 400 });
  return descargar(
    await exportarDiario(
      await obtenerActor(),
      fecha.data,
      await reposParadas(),
    ),
  );
}

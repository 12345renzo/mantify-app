import type { NextRequest } from "next/server";
import { obtenerActor } from "@/modules/acceso/infrastructure/sesion";
import { exportarMensual } from "@/modules/paradas/application/casos-uso";
import { mesUrl } from "@/modules/paradas/application/esquemas";
import { reposParadas } from "@/modules/paradas/infrastructure";
import { descargar } from "../descargar";

// Excel del mes (resumen por equipo + detalle). La empresa sale de la sesión, nunca de la URL.
export async function GET(request: NextRequest) {
  const mes = mesUrl.safeParse(request.nextUrl.searchParams.get("mes"));
  if (!mes.success) return new Response(null, { status: 400 });
  return descargar(
    await exportarMensual(await obtenerActor(), mes.data, await reposParadas()),
  );
}

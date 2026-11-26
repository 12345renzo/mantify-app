import type { NextRequest } from "next/server";
import { z } from "zod";
import { obtenerActor } from "@/modules/acceso/infrastructure/sesion";
import { exportarOrdenPdf } from "@/modules/reportes/application/exportar";
import { fuenteOrden } from "@/modules/reportes/infrastructure";
import { descargar } from "../../paradas/descargar";

// PDF de la OT de un backlog. RLS y verTrabajo vuelven a revisar empresa y rol.
export async function GET(request: NextRequest) {
  const id = z.uuid().safeParse(request.nextUrl.searchParams.get("id"));
  if (!id.success) return new Response(null, { status: 400 });
  const actor = await obtenerActor();
  if (!actor) return new Response(null, { status: 401 });
  return descargar(await exportarOrdenPdf(actor, id.data, fuenteOrden(actor)));
}

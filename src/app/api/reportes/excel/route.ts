import type { NextRequest } from "next/server";
import { obtenerActor } from "@/modules/acceso/infrastructure/sesion";
import {
  esModuloExcel,
  exportarExcelModulo,
} from "@/modules/reportes/application/exportar";
import { fuentesExcel } from "@/modules/reportes/infrastructure";
import { hoyEn } from "@/shared/kernel/fechas";
import { descargar } from "../../paradas/descargar";

// Excel de un módulo. La empresa sale de la sesión, nunca de la URL.
export async function GET(request: NextRequest) {
  const modulo = request.nextUrl.searchParams.get("modulo");
  if (!esModuloExcel(modulo)) return new Response(null, { status: 400 });
  const actor = await obtenerActor();
  if (!actor) return new Response(null, { status: 401 });
  return descargar(
    await exportarExcelModulo(
      actor,
      modulo,
      fuentesExcel(actor),
      hoyEn("America/Lima"),
    ),
  );
}

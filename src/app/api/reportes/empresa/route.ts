import { obtenerActor } from "@/modules/acceso/infrastructure/sesion";
import { exportarJsonEmpresa } from "@/modules/reportes/application/exportar";
import { fuenteRespaldo } from "@/modules/reportes/infrastructure";
import { hoyEn } from "@/shared/kernel/fechas";
import { descargar } from "../../paradas/descargar";

// JSON de la empresa del planificador. La empresa sale de la sesión, nunca de la URL.
export async function GET() {
  return descargar(
    await exportarJsonEmpresa(
      await obtenerActor(),
      await fuenteRespaldo(),
      hoyEn("America/Lima"),
    ),
  );
}

import type { Metadata } from "next";
import { Suspense } from "react";
import { exigirAccesoEnPagina } from "@/modules/acceso/infrastructure/sesion";
import { puede } from "@/modules/identidad/domain/permisos";
import {
  MAX_FILAS,
  MODULOS_EXCEL,
  type ModuloExcel,
} from "@/modules/reportes/application/exportar";
import { hoyEn } from "@/shared/kernel/fechas";
import { boton, cabeceraSeccion, campo, tarjeta } from "@/shared/ui/estilos";
import { IconoReporte } from "@/shared/ui/iconos";
import { Encabezado, Esqueleto } from "../encabezado";

export const metadata: Metadata = { title: "Reportes" };

const NOMBRE: Record<ModuloExcel, string> = {
  trabajos: "Backlogs y OT",
  preventivos: "Preventivos",
  equipos: "Equipos",
  engrase: "Engrase",
  neumaticos: "Neumáticos",
};

export default function ReportesPage() {
  return (
    <Suspense fallback={<Esqueleto alto="h-72" />}>
      <Contenido />
    </Suspense>
  );
}

async function Contenido() {
  const actor = await exigirAccesoEnPagina({
    accion: "leer",
    recurso: "reportes",
  });
  const hoy = hoyEn("America/Lima");
  const respaldo = puede(actor.rol, "leer", "respaldo_empresa");

  return (
    <>
      <Encabezado
        icono={IconoReporte}
        color="var(--mod-reportes)"
        titulo="Reportes"
        descripcion="Descarga los datos de tu empresa en Excel y PDF. El PDF de cada OT está en su detalle."
      />

      <div className="flex flex-col gap-6">
        <section className={`${tarjeta} overflow-hidden`}>
          <div className={cabeceraSeccion}>
            <div>
              <h2 className="text-base font-semibold tracking-tight">
                Excel por módulo
              </h2>
              <p className="mt-0.5 text-sm text-muted">
                Las mismas filas que ves en cada módulo, hasta {MAX_FILAS}.
                Máximo 3 descargas por minuto.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 p-5 sm:px-6">
            {MODULOS_EXCEL.map((m) => (
              <a
                key={m}
                href={`/api/reportes/excel?modulo=${m}`}
                className={boton.secundario}
                download
              >
                {NOMBRE[m]}
              </a>
            ))}
          </div>
        </section>

        <section className={`${tarjeta} overflow-hidden`}>
          <div className={cabeceraSeccion}>
            <h2 className="text-base font-semibold tracking-tight">Paradas</h2>
          </div>
          <div className="flex flex-wrap items-end gap-6 p-5 sm:px-6">
            <form action="/api/paradas/diario" className="flex items-end gap-2">
              <label className="text-xs text-muted">
                Reporte diario (PDF)
                <input
                  name="fecha"
                  type="date"
                  max={hoy}
                  defaultValue={hoy}
                  className={`${campo} mt-1 w-44`}
                />
              </label>
              <button type="submit" className={boton.secundario}>
                Descargar
              </button>
            </form>
            <form
              action="/api/paradas/mensual"
              className="flex items-end gap-2"
            >
              <label className="text-xs text-muted">
                Reporte mensual (Excel)
                <input
                  name="mes"
                  type="month"
                  max={hoy.slice(0, 7)}
                  defaultValue={hoy.slice(0, 7)}
                  className={`${campo} mt-1 w-44`}
                />
              </label>
              <button type="submit" className={boton.secundario}>
                Descargar
              </button>
            </form>
          </div>
        </section>

        {respaldo && (
          <section className={`${tarjeta} overflow-hidden`}>
            <div className={cabeceraSeccion}>
              <div>
                <h2 className="text-base font-semibold tracking-tight">
                  Respaldo de la empresa
                </h2>
                <p className="mt-0.5 text-sm text-muted">
                  Todos los datos de tu empresa en un archivo JSON. Sin fotos ni
                  firmas (solo sus nombres de archivo) y sin contraseñas.
                </p>
              </div>
            </div>
            <div className="p-5 sm:px-6">
              <a
                href="/api/reportes/empresa"
                className={boton.primario}
                download
              >
                Descargar respaldo (JSON)
              </a>
            </div>
          </section>
        )}
      </div>
    </>
  );
}

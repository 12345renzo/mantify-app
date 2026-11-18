import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { exigirSuperadminEnPagina } from "@/modules/acceso/infrastructure/sesion";
import { listarEmpresas } from "@/modules/plataforma/application/consultas";
import { reposPlataforma } from "@/modules/plataforma/infrastructure";
import { EstadoPill } from "@/modules/plataforma/ui/estado-pill";
import { calcularEstadoMembresia } from "@/modules/plataforma/domain/estado-membresia";
import { hoyEn } from "@/shared/kernel/fechas";
import { tarjeta } from "@/shared/ui/estilos";
import { formatoFecha } from "@/shared/ui/formato";
import { IconoEmpresa } from "@/shared/ui/iconos";
import { Paginacion, paginar, type ParamsUrl } from "@/shared/ui/paginacion";
import { Encabezado, Esqueleto } from "../encabezado";
import { AccionesFila } from "./acciones-fila";
import {
  BotonNuevaEmpresa,
  BotonNuevaEmpresaCargando,
} from "./boton-nueva-empresa";

export const metadata: Metadata = { title: "Empresas" };

export default function EmpresasPage({ searchParams }: PageProps<"/empresas">) {
  return (
    <>
      <Encabezado
        icono={IconoEmpresa}
        color="var(--mod-plataforma)"
        titulo="Empresas"
        descripcion="Cada empresa con su RUC, plan y estado de membresía."
        acciones={
          <Suspense fallback={<BotonNuevaEmpresaCargando />}>
            <BotonNuevaEmpresa />
          </Suspense>
        }
      />
      <Suspense fallback={<Esqueleto alto="h-80" />}>
        <TablaEmpresas searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function TablaEmpresas({
  searchParams,
}: {
  searchParams: Promise<ParamsUrl>;
}) {
  const params = await searchParams;
  const actor = await exigirSuperadminEnPagina();
  const { lector } = await reposPlataforma();
  const [r, planes] = await Promise.all([
    listarEmpresas(actor, lector),
    lector.listarPlanes(),
  ]);
  if (!r.ok) throw r.error;
  const pag = paginar(r.value, params.pagina);
  const hoy = hoyEn("America/Lima");
  const nombrePlan = new Map(planes.map((p) => [p.id, p.nombre]));

  if (r.value.length === 0) {
    return (
      <div className={`${tarjeta} px-5 py-16 text-center`}>
        <span className="mx-auto grid size-12 place-items-center rounded-xl bg-primary-soft text-primary">
          <IconoEmpresa />
        </span>
        <p className="mt-4 font-semibold">Todavía no hay empresas</p>
        <p className="mt-1 text-sm text-muted">
          Crea la primera para empezar a registrar pagos.
        </p>
      </div>
    );
  }

  return (
    <div className={`${tarjeta} overflow-hidden`}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-4 sm:px-6">
        <div>
          <h2 className="text-base font-semibold tracking-[-0.02em]">
            Cartera de empresas
          </h2>
          <p className="mt-0.5 text-sm text-muted">
            {r.value.length}{" "}
            {r.value.length === 1
              ? "empresa registrada"
              : "empresas registradas"}
          </p>
        </div>
        <span className="font-mono text-[10px] tracking-[0.14em] text-muted uppercase">
          RUC · Plan · Membresía
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[52rem] text-sm">
          <thead className="bg-surface-2/70 text-left">
            <tr>
              {["Empresa", "Plan", "Estado", "Vence", "Gracia", "Acciones"].map(
                (th, i) => (
                  <th
                    key={th}
                    className={`px-5 py-3 text-[10px] font-semibold tracking-[0.13em] text-muted uppercase ${
                      i >= 4 ? "text-right" : ""
                    }`}
                  >
                    {th}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {pag.items.map((e) => (
              <tr
                key={e.id}
                className="transition-colors hover:bg-surface-2/60"
              >
                <td className="px-5 py-3.5">
                  <Link
                    href={`/empresas/${e.id}`}
                    className="font-medium tracking-tight hover:text-primary"
                  >
                    {e.nombre}
                  </Link>
                  <p className="mt-0.5 font-mono text-[10.5px] text-muted">
                    RUC {e.ruc}
                  </p>
                </td>
                <td className="px-5 py-3.5">
                  <span className="rounded-md border border-border bg-surface-2/60 px-2 py-0.5 text-xs font-medium">
                    {nombrePlan.get(e.planId) ?? "—"}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <EstadoPill estado={e.estado} />
                </td>
                <td className="px-5 py-3.5 text-xs text-muted tabular-nums sm:text-sm">
                  {formatoFecha(e.fechaFin)}
                </td>
                <td className="px-5 py-3.5 text-right text-muted tabular-nums">
                  {e.diasGracia} d
                </td>
                <td className="px-5 py-3.5">
                  <AccionesFila
                    empresa={e}
                    planes={planes}
                    puedeReactivar={
                      calcularEstadoMembresia(
                        { fin: e.fechaFin, empresaInactiva: false },
                        e.diasGracia,
                        hoy,
                      ) === "VENCIDA"
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Paginacion
        param="pagina"
        params={params}
        pagina={pag.pagina}
        paginas={pag.paginas}
        total={pag.total}
      />
    </div>
  );
}

import type { Metadata } from "next";
import { Suspense } from "react";
import { exigirSuperadminEnPagina } from "@/modules/acceso/infrastructure/sesion";
import { reposPlataforma } from "@/modules/plataforma/infrastructure";
import { tarjeta } from "@/shared/ui/estilos";
import { formatoMoneda } from "@/shared/ui/formato";
import { IconoPlanes } from "@/shared/ui/iconos";
import { Encabezado, Esqueleto } from "../encabezado";
import { PrecioForm } from "./precio-form";

export const metadata: Metadata = { title: "Planes y precios" };

export default function TarifasPage() {
  return (
    <>
      <Encabezado
        icono={IconoPlanes}
        color="var(--mod-plataforma)"
        titulo="Planes y precios"
        descripcion="El precio nuevo aplica a los pagos que registres desde ahora. Los pagos anteriores no cambian."
      />
      <Suspense
        fallback={
          <div className="grid gap-6 md:grid-cols-2">
            <Esqueleto alto="h-56" />
            <Esqueleto alto="h-56" />
          </div>
        }
      >
        <Planes />
      </Suspense>
    </>
  );
}

async function Planes() {
  await exigirSuperadminEnPagina();
  const { lector } = await reposPlataforma();
  const planes = await lector.listarPlanes();

  return (
    <div className="grid gap-5 md:grid-cols-2 lg:gap-6">
      {planes.map((plan) => (
        <section
          key={plan.id}
          className={`${tarjeta} relative overflow-hidden p-6`}
        >
          <span
            className="absolute inset-x-0 top-0 h-[3px] bg-primary"
            aria-hidden="true"
          />
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold tracking-[-0.03em]">
                {plan.nombre}
              </h2>
              <p className="mt-0.5 text-sm text-muted">
                {plan.maxAccesos
                  ? `${plan.maxAccesos} accesos incluidos`
                  : "Accesos sin límite"}
              </p>
            </div>
            <span className="rounded-md border border-border bg-surface-2/60 px-2 py-1 font-mono text-[10px] tracking-[0.1em] text-muted uppercase">
              {plan.codigo}
            </span>
          </div>
          <p className="cifra mt-6 text-3xl leading-none font-semibold">
            {formatoMoneda(plan.precioMensual, plan.moneda)}
            <span className="ml-1.5 font-sans text-xs font-normal tracking-normal text-muted">
              / mes
            </span>
          </p>
          <PrecioForm
            planId={plan.id}
            precio={plan.precioMensual}
            moneda={plan.moneda}
          />
        </section>
      ))}
    </div>
  );
}

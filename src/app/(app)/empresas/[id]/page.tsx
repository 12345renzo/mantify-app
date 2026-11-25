import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";
import { exigirSuperadminEnPagina } from "@/modules/acceso/infrastructure/sesion";
import { obtenerEmpresa } from "@/modules/plataforma/application/consultas";
import { DIAS_MEMBRESIA } from "@/modules/plataforma/domain/regla-nueva-membresia";
import { reposPlataforma } from "@/modules/plataforma/infrastructure";
import { EstadoPill } from "@/modules/plataforma/ui/estado-pill";
import { diasEntre, hoyEn } from "@/shared/kernel/fechas";
import { tarjeta } from "@/shared/ui/estilos";
import {
  formatoFecha,
  formatoFechaHora,
  formatoMoneda,
} from "@/shared/ui/formato";
import { IconoAtras, IconoEmpresa } from "@/shared/ui/iconos";
import { Encabezado, Esqueleto } from "../../encabezado";
import { AccionesFila } from "../acciones-fila";
import { CuentasEmpresa } from "./cuentas-empresa";

export const metadata: Metadata = { title: "Empresa" };

export default function EmpresaPage({ params }: PageProps<"/empresas/[id]">) {
  return (
    <>
      <Link
        href="/empresas"
        className="mb-4 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-muted transition-colors hover:bg-surface-2 hover:text-fg"
      >
        <IconoAtras width={16} height={16} />
        Volver a empresas
      </Link>
      <Suspense
        fallback={
          <div className="flex flex-col gap-6">
            <Esqueleto alto="h-16" />
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <Esqueleto alto="h-72" />
              </div>
              <Esqueleto alto="h-72" />
            </div>
          </div>
        }
      >
        <Detalle params={params} />
      </Suspense>
    </>
  );
}

async function Detalle({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();

  const actor = await exigirSuperadminEnPagina();
  const { lector } = await reposPlataforma();
  const [r, planes] = await Promise.all([
    obtenerEmpresa(actor, id, lector),
    lector.listarPlanes(),
  ]);
  if (!r.ok) throw r.error;
  const empresa = r.value;
  if (!empresa) notFound();

  const plan = planes.find((p) => p.id === empresa.planId);
  const hoy = hoyEn(empresa.zonaHoraria);
  const dias = empresa.fechaFin ? diasEntre(hoy, empresa.fechaFin) : null;
  const usados = empresa.fechaInicio
    ? Math.min(
        Math.max(diasEntre(empresa.fechaInicio, hoy) + 1, 0),
        DIAS_MEMBRESIA,
      )
    : 0;

  return (
    <>
      <Encabezado
        icono={IconoEmpresa}
        color="var(--mod-plataforma)"
        titulo={
          <span className="flex flex-wrap items-center gap-3">
            {empresa.nombre}
            <EstadoPill estado={empresa.estado} />
          </span>
        }
        descripcion={
          <span className="tabular-nums">
            RUC {empresa.ruc} · Plan {plan?.nombre ?? "—"}
          </span>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex min-w-0 flex-col gap-6 lg:col-span-2">
          <section className={`${tarjeta} p-5 sm:p-6`}>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold tracking-[-0.02em]">
                Membresía
              </h2>
              <span className="font-mono text-[10px] tracking-[0.14em] text-muted uppercase">
                Ciclo actual
              </span>
            </div>
            {empresa.fechaFin && empresa.fechaInicio ? (
              <>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <Dato
                    etiqueta="Desde"
                    valor={formatoFecha(empresa.fechaInicio)}
                  />
                  <Dato
                    etiqueta="Hasta"
                    valor={formatoFecha(empresa.fechaFin)}
                  />
                  <Dato
                    etiqueta={
                      dias !== null && dias < 0 ? "Vencida hace" : "Quedan"
                    }
                    valor={
                      dias === null
                        ? "—"
                        : `${Math.abs(dias)} ${Math.abs(dias) === 1 ? "día" : "días"}`
                    }
                  />
                </div>
                <div className="mt-5">
                  <div
                    className="h-2 overflow-hidden rounded-full bg-surface-2"
                    aria-hidden="true"
                  >
                    <div
                      className="h-full rounded-full bg-primary transition-[width] duration-500"
                      style={{ width: `${(usados / DIAS_MEMBRESIA) * 100}%` }}
                    />
                  </div>
                  <p className="mt-2 font-mono text-[10.5px] text-muted">
                    Día {usados} de {DIAS_MEMBRESIA} · {empresa.diasGracia} días
                    de gracia después del vencimiento
                  </p>
                </div>
              </>
            ) : (
              <p className="mt-3 text-sm text-muted">
                Sin membresía todavía. Registra el primer pago para que la
                empresa quede al día.
              </p>
            )}
            {empresa.proximoPlan && (
              <p className="mt-4 text-sm font-medium">
                Pasa a{" "}
                {planes.find((p) => p.id === empresa.proximoPlan?.planId)
                  ?.nombre ?? "otro plan"}{" "}
                el {formatoFecha(empresa.proximoPlan.desde)}.
              </p>
            )}
            {!empresa.activa && (
              <p className="mt-4 rounded-lg border border-border bg-surface-2/70 px-3.5 py-2.5 text-sm text-muted">
                <span className="font-semibold text-fg">
                  Empresa dada de baja
                </span>
                {empresa.motivoInactivacion === "VENCIMIENTO"
                  ? " por falta de pago"
                  : " manualmente"}
                . Sus usuarios no pueden entrar hasta que renueve.
              </p>
            )}
          </section>

          <section className={tarjeta}>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-4 sm:px-6">
              <h2 className="text-base font-semibold tracking-[-0.02em]">
                Historial de pagos
              </h2>
              <span className="font-mono text-[10px] tracking-[0.14em] text-muted uppercase">
                {empresa.pagos.length}{" "}
                {empresa.pagos.length === 1 ? "registro" : "registros"}
              </span>
            </div>
            {empresa.pagos.length === 0 ? (
              <p className="px-5 py-12 text-center text-sm text-muted">
                Sin pagos registrados.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[36rem] text-sm">
                  <thead className="bg-surface-2/70 text-left">
                    <tr>
                      {["Registrado", "Periodo", "Referencia", "Monto"].map(
                        (th, i) => (
                          <th
                            key={th}
                            className={`px-5 py-3 text-[10px] font-semibold tracking-[0.13em] text-muted uppercase ${
                              i === 3 ? "text-right" : ""
                            }`}
                          >
                            {th}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {empresa.pagos.map((p) => (
                      <tr
                        key={p.id}
                        className="transition-colors hover:bg-surface-2/50"
                      >
                        <td className="px-5 py-3 text-xs tabular-nums sm:text-sm">
                          {formatoFechaHora(
                            p.registradoEn,
                            empresa.zonaHoraria,
                          )}
                        </td>
                        <td className="px-5 py-3 text-xs tabular-nums sm:text-sm">
                          {p.periodo
                            ? `${formatoFecha(p.periodo.inicio)} – ${formatoFecha(p.periodo.fin)}`
                            : "—"}
                        </td>
                        <td className="px-5 py-3 font-mono text-[11px] text-muted">
                          {p.referencia ?? "—"}
                        </td>
                        <td className="px-5 py-3 text-right font-semibold tabular-nums">
                          {formatoMoneda(p.monto, p.moneda)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <Suspense fallback={<Esqueleto alto="h-48" />}>
            <CuentasEmpresa empresaId={empresa.id} />
          </Suspense>
        </div>

        <div className="flex min-w-0 flex-col gap-6 lg:sticky lg:top-24 lg:self-start">
          <section className={`${tarjeta} p-5 sm:p-6`}>
            <h2 className="mb-3 text-base font-semibold tracking-[-0.02em]">
              Acciones
            </h2>
            <AccionesFila empresa={empresa} planes={planes} hoy={hoy} />
          </section>

          <section className={`${tarjeta} p-5 sm:p-6`}>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold tracking-[-0.02em]">
                Datos
              </h2>
              <span className="font-mono text-[10px] tracking-[0.14em] text-muted uppercase">
                Ficha
              </span>
            </div>
            <dl className="mt-3 flex flex-col gap-2.5 text-sm">
              <Dato
                etiqueta="Razón social"
                valor={empresa.razonSocial ?? "—"}
              />
              <Dato
                etiqueta="Correo de contacto"
                valor={empresa.correoContacto ?? "—"}
              />
              <Dato etiqueta="Días de gracia" valor={`${empresa.diasGracia}`} />
              <Dato etiqueta="Zona horaria" valor={empresa.zonaHoraria} />
            </dl>
          </section>
        </div>
      </div>
    </>
  );
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="min-w-0 rounded-lg border border-border bg-surface-2/40 px-3 py-2.5">
      <dt className="text-[10px] font-semibold tracking-[0.1em] text-muted uppercase">
        {etiqueta}
      </dt>
      <dd className="mt-0.5 truncate text-sm font-medium tabular-nums">
        {valor}
      </dd>
    </div>
  );
}

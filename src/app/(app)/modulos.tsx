import Link from "next/link";
import { tarjeta } from "@/shared/ui/estilos";
import { IconoSalirArriba } from "@/shared/ui/iconos";
import { NAVEGACION, veItem } from "./navegacion";

// Módulos que ve el rol: activos (enlace) y los que llegan en cortes siguientes.
export function Modulos({ rol }: { rol: string | null }) {
  const items = NAVEGACION.flatMap((g) => g.items).filter(
    (item) =>
      item.enMenu !== false &&
      item.href !== "/panel" &&
      item.href !== "/inicio" &&
      veItem(item, rol),
  );
  const activos = items.filter((i) => i.href).length;

  return (
    <section className="mt-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-[9.5px] font-semibold tracking-[0.16em] text-muted uppercase">
            <span
              className="size-1.5 rounded-full bg-[var(--lime)] shadow-[0_0_8px_var(--lime)]"
              aria-hidden="true"
            />
            Mapa de módulos
          </p>
          <h2 className="mt-1.5 text-lg font-semibold tracking-[-0.035em]">
            Módulos de Mantify
          </h2>
        </div>
        <p className="max-w-md text-sm text-muted">
          {activos} {activos === 1 ? "módulo activo" : "módulos activos"} · el
          resto llega con cada corte.
        </p>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => {
          const Icono = item.icono;
          const contenido = (
            <>
              <span
                className="relative grid size-11 shrink-0 place-items-center rounded-2xl ring-1 ring-inset ring-black/[0.05] dark:ring-white/[0.06]"
                style={{
                  color: item.color,
                  backgroundColor: `color-mix(in srgb, ${item.color} 11%, transparent)`,
                }}
              >
                <span
                  className="absolute inset-1 rounded-xl opacity-30 blur-md"
                  style={{
                    backgroundColor: `color-mix(in srgb, ${item.color} 30%, transparent)`,
                  }}
                  aria-hidden="true"
                />
                <Icono className="relative" width={19} height={19} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold tracking-[-0.015em]">
                    {item.etiqueta}
                  </span>
                  {item.href ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-ok/20 bg-ok-soft px-2 py-0.5 font-mono text-[9px] font-semibold tracking-wide text-ok uppercase">
                      <span
                        className="size-1 rounded-full bg-ok"
                        aria-hidden="true"
                      />
                      Activo
                    </span>
                  ) : (
                    <span className="rounded-full border border-border bg-surface-2 px-2 py-0.5 font-mono text-[9px] font-semibold tracking-wide text-muted uppercase">
                      Corte {item.corte}
                    </span>
                  )}
                </span>
                <span className="mt-1 block text-sm leading-snug text-muted">
                  {item.descripcion}
                </span>
              </span>
              {item.href && (
                <span className="grid size-7 shrink-0 place-items-center self-center rounded-full border border-border bg-surface text-muted/60 transition-colors group-hover:border-primary/25 group-hover:bg-primary-soft group-hover:text-primary">
                  <IconoSalirArriba width={14} height={14} />
                </span>
              )}
            </>
          );
          return item.href ? (
            <Link
              key={item.etiqueta}
              href={item.href}
              className={`${tarjeta} group relative flex gap-3.5 overflow-hidden p-4 transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-[var(--shadow-pop)]`}
            >
              <span
                className="absolute inset-x-0 top-0 h-px opacity-0 transition-opacity group-hover:opacity-100"
                style={{
                  background: `linear-gradient(90deg, transparent, ${item.color}, transparent)`,
                }}
                aria-hidden="true"
              />
              {contenido}
            </Link>
          ) : (
            <div
              key={item.etiqueta}
              className={`${tarjeta} relative flex gap-3.5 p-4 opacity-[0.82]`}
            >
              {contenido}
            </div>
          );
        })}
      </div>
    </section>
  );
}

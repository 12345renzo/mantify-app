import Link from "next/link";
import { CRITICIDADES } from "@/modules/trabajos/domain/backlog-estado";
import { cabeceraSeccion, micro, tarjeta } from "@/shared/ui/estilos";
import type { Dashboard } from "../application/obtener-dashboard";
import type { ItemBandejaVista } from "../domain/bandeja";
import type { TipoBandeja } from "../domain/orden-bandeja";

type Tono = "bien" | "aviso" | "mal" | null;
type Cifra = {
  etiqueta: string;
  valor: number | string;
  href?: string;
  tono?: Tono;
};

const TONO: Record<Exclude<Tono, null>, string> = {
  bien: "text-ok",
  aviso: "text-warn",
  mal: "text-bad",
};
const nf = new Intl.NumberFormat("es-PE", { maximumFractionDigits: 2 });
// Clases fijas (Tailwind no ve clases armadas al vuelo): tantas columnas como cifras.
const COLUMNAS: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-2 sm:grid-cols-4",
};

// Un bloque del dashboard: título y cifras; cada cifra lleva a su módulo con el filtro puesto.
export function Bloque({
  titulo,
  color,
  cifras,
  children,
}: {
  titulo: string;
  color: string;
  cifras?: Cifra[];
  children?: React.ReactNode;
}) {
  return (
    <section
      className={`${tarjeta} overflow-hidden`}
      aria-label={titulo}
      data-bloque={titulo}
    >
      <div className={cabeceraSeccion}>
        <h2 className="flex items-center gap-2 text-sm font-semibold tracking-tight">
          <span
            className="size-2 rounded-full"
            style={{ backgroundColor: color }}
            aria-hidden="true"
          />
          {titulo}
        </h2>
      </div>
      {cifras && (
        <dl
          className={`grid gap-px bg-border ${COLUMNAS[Math.min(cifras.length, 4)]}`}
        >
          {cifras.map((c) => {
            const cuerpo = (
              <>
                <dt className={micro}>{c.etiqueta}</dt>
                <dd
                  className={`cifra mt-1 text-2xl font-semibold tabular-nums ${
                    c.tono && Number(c.valor) > 0 ? TONO[c.tono] : ""
                  }`}
                  data-cifra={c.etiqueta}
                >
                  {typeof c.valor === "number" ? nf.format(c.valor) : c.valor}
                </dd>
              </>
            );
            return c.href ? (
              <Link
                key={c.etiqueta}
                href={c.href}
                className="bg-surface px-5 py-4 transition-colors hover:bg-surface-2"
              >
                {cuerpo}
              </Link>
            ) : (
              <div key={c.etiqueta} className="bg-surface px-5 py-4">
                {cuerpo}
              </div>
            );
          })}
        </dl>
      )}
      {children}
    </section>
  );
}

const TIPO: Record<TipoBandeja, string> = {
  PARADA: "Parada",
  VALIDACION: "Validación",
  BACKLOG: "Backlog",
  PREVENTIVO: "Preventivo",
  ENGRASE: "Engrase",
  NEUMATICO: "Neumático",
};

export function Bandeja({ items }: { items: ItemBandejaVista[] }) {
  return (
    <section className={`${tarjeta} overflow-hidden`} aria-label="Pendientes">
      <div className={cabeceraSeccion}>
        <div>
          <h2 className="text-base font-semibold tracking-tight">Pendientes</h2>
          <p className="mt-0.5 text-sm text-muted">
            Lo devuelto primero, luego lo más crítico y lo más atrasado.
          </p>
        </div>
        <span className="rounded-full border border-border bg-surface-2/60 px-2.5 py-1 font-mono text-[10px] text-muted tabular-nums">
          {items.length}
        </span>
      </div>
      {items.length === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-muted">
          Nada pendiente. Todo al día.
        </p>
      ) : (
        <ol className="divide-y divide-border" data-bandeja>
          {items.slice(0, 50).map((i) => (
            <li key={`${i.tipo}-${i.codigo}`}>
              <Link
                href={i.href}
                className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3 text-sm transition-colors hover:bg-surface-2/60 sm:px-6"
                data-item={`${i.tipo}:${i.codigo}`}
              >
                <span className="w-24 shrink-0 text-xs font-semibold text-muted">
                  {TIPO[i.tipo]}
                </span>
                <span className="font-mono text-[13px] font-semibold">
                  {i.codigo}
                </span>
                <span className="min-w-0 flex-1 truncate text-muted">
                  {i.detalle}
                </span>
                {i.devuelto && (
                  <span className="rounded-full bg-bad-soft px-2 py-0.5 text-xs font-semibold text-bad">
                    Devuelto
                  </span>
                )}
                {i.criticidad && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      i.criticidad === "ALTA"
                        ? "bg-bad-soft text-bad"
                        : i.criticidad === "MEDIA"
                          ? "bg-warn-soft text-warn"
                          : "bg-surface-2 text-muted"
                    }`}
                  >
                    {CRITICIDADES[i.criticidad]}
                  </span>
                )}
                <span className="w-20 text-right font-mono text-[11px] text-muted tabular-nums">
                  {i.atrasoDias > 0
                    ? `${i.atrasoDias} ${i.atrasoDias === 1 ? "día" : "días"}`
                    : "—"}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}
      {items.length > 50 && (
        <p className="border-t border-border px-5 py-3 text-xs text-muted">
          Se muestran los 50 más urgentes de {items.length}.
        </p>
      )}
    </section>
  );
}

// Planificador y supervisor: los 9 bloques, en el orden del corte 10.
export function DashboardGestion({
  d,
}: {
  d: Extract<Dashboard, { tipo: "GESTION" }>;
}) {
  return (
    <div className="flex flex-col gap-6">
      {d.validaciones && (
        <Bloque
          titulo="Por validar"
          color="var(--mod-mantenimiento)"
          cifras={[
            {
              etiqueta: "Trabajos",
              valor: d.validaciones.trabajos,
              href: "/trabajos?vista=validacion",
              tono: "aviso",
            },
            {
              etiqueta: "Preventivos",
              valor: d.validaciones.preventivos,
              href: "/preventivos?vista=validacion",
              tono: "aviso",
            },
          ]}
        />
      )}
      <Bandeja items={d.bandeja} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Bloque
          titulo="Preventivos"
          color="var(--mod-preventivos)"
          cifras={[
            {
              etiqueta: "Vencidos",
              valor: d.preventivos.vencidos,
              href: "/preventivos",
              tono: "mal",
            },
            {
              etiqueta: "Por vencer",
              valor: d.preventivos.porVencer,
              href: "/preventivos",
              tono: "aviso",
            },
            {
              etiqueta: "Ejecutados (mes)",
              valor: d.preventivos.ejecutados,
              href: "/preventivos?vista=validados",
            },
            {
              etiqueta: "Reprogramados (mes)",
              valor: d.preventivos.reprogramados,
            },
          ]}
        />
        <Bloque
          titulo="Equipos con más fallas (mes)"
          color="var(--mod-paradas)"
        >
          {d.fallas.length === 0 ? (
            <p className="px-5 py-6 text-sm text-muted">
              Sin paradas no planificadas este mes.
            </p>
          ) : (
            <ol className="divide-y divide-border text-sm">
              {d.fallas.map((f, i) => (
                <li
                  key={f.equipoId}
                  className="flex items-center gap-3 px-5 py-2.5"
                >
                  <span className="w-5 font-mono text-xs text-muted">
                    {i + 1}
                  </span>
                  <span className="flex-1 font-semibold">{f.equipo}</span>
                  <span className="tabular-nums">
                    {f.fallas} {f.fallas === 1 ? "falla" : "fallas"}
                  </span>
                  <span className="w-16 text-right font-mono text-xs text-muted tabular-nums">
                    {nf.format(f.horas)} h
                  </span>
                </li>
              ))}
            </ol>
          )}
          <Link
            href="/paradas?vista=ranking"
            className="block border-t border-border px-5 py-2.5 text-xs font-semibold text-primary hover:bg-surface-2"
          >
            Ver ranking completo
          </Link>
        </Bloque>
        <Bloque
          titulo="Backlogs pendientes"
          color="var(--mod-mantenimiento)"
          cifras={[
            {
              etiqueta: "Alta",
              valor: d.backlogs.ALTA,
              href: "/trabajos",
              tono: "mal",
            },
            {
              etiqueta: "Media",
              valor: d.backlogs.MEDIA,
              href: "/trabajos",
              tono: "aviso",
            },
            { etiqueta: "Baja", valor: d.backlogs.BAJA, href: "/trabajos" },
            { etiqueta: "Total", valor: d.backlogs.total, href: "/trabajos" },
          ]}
        />
        <BloqueFlota flota={d.flota} />
        <Bloque
          titulo="Órdenes de trabajo"
          color="var(--mod-mantenimiento)"
          cifras={[
            {
              etiqueta: "Pendientes",
              valor: d.ot.pendientes,
              href: "/trabajos",
            },
            {
              etiqueta: "Vencidas",
              valor: d.ot.vencidas,
              href: "/trabajos",
              tono: "mal",
            },
            {
              etiqueta: "Cerradas (mes)",
              valor: d.ot.cerradas,
              href: "/trabajos?vista=completados",
            },
          ]}
        />
        <Bloque titulo="Trabajos por técnico" color="var(--mod-personas)">
          {d.tecnicos.length === 0 ? (
            <p className="px-5 py-6 text-sm text-muted">
              Nadie tiene OT abiertas.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-surface-2/70 text-left">
                <tr>
                  {["Técnico", "En proceso", "Devueltos", "Por validar"].map(
                    (t) => (
                      <th key={t} className={`px-5 py-2 ${micro}`}>
                        {t}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-border tabular-nums">
                {d.tecnicos.map((t) => (
                  <tr key={t.tecnico}>
                    <td className="px-5 py-2 font-medium">{t.tecnico}</td>
                    <td className="px-5 py-2">{t.enProceso}</td>
                    <td
                      className={`px-5 py-2 ${t.devueltos ? "text-bad" : ""}`}
                    >
                      {t.devueltos}
                    </td>
                    <td className="px-5 py-2">{t.porValidar}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Bloque>
        <Bloque
          titulo="Engrase"
          color="var(--mod-engrase)"
          cifras={[
            {
              etiqueta: "Al día",
              valor: d.engrase.alDia,
              href: "/engrase?estado=AL_DIA",
              tono: "bien",
            },
            {
              etiqueta: "Por vencer",
              valor: d.engrase.porVencer,
              href: "/engrase?estado=POR_VENCER",
              tono: "aviso",
            },
            {
              etiqueta: "Vencidos",
              valor: d.engrase.vencidos,
              href: "/engrase?estado=VENCIDO",
              tono: "mal",
            },
            {
              etiqueta: "Sin registro",
              valor: d.engrase.sinRegistro,
              href: "/engrase?estado=SIN_REGISTRO",
            },
          ]}
        />
        <Bloque
          titulo="Neumáticos"
          color="var(--mod-neumaticos)"
          cifras={[
            {
              etiqueta: "Cambiar",
              valor: d.neumaticos.CAMBIAR,
              href: "/neumaticos?salud=CAMBIAR",
              tono: "mal",
            },
            {
              etiqueta: "Alerta",
              valor: d.neumaticos.ALERTA,
              href: "/neumaticos?salud=ALERTA",
              tono: "aviso",
            },
            {
              etiqueta: "Medir",
              valor: d.neumaticos.MEDIR,
              href: "/neumaticos?salud=MEDIR",
              tono: "aviso",
            },
            {
              etiqueta: "OK",
              valor: d.neumaticos.OK,
              href: "/neumaticos?salud=OK",
              tono: "bien",
            },
          ]}
        />
      </div>
      <Bloque
        titulo="Horas de trabajo (paradas cerradas del mes)"
        color="var(--mod-paradas)"
        cifras={[{ etiqueta: "Total", valor: `${nf.format(d.horas.total)} h` }]}
      >
        {d.horas.porEquipo.length > 0 && (
          <ul className="divide-y divide-border border-t border-border text-sm">
            {d.horas.porEquipo.slice(0, 10).map((e) => (
              <li key={e.equipo} className="flex justify-between px-5 py-2">
                <span className="font-medium">{e.equipo}</span>
                <span className="font-mono tabular-nums">
                  {nf.format(e.horas)} h
                </span>
              </li>
            ))}
          </ul>
        )}
      </Bloque>
    </div>
  );
}

export function BloqueFlota({
  flota,
}: {
  flota: {
    movilizados: number;
    desmovilizados: number;
    pendientes: number;
    operativos: number;
  };
}) {
  return (
    <Bloque
      titulo="Estado de la flota"
      color="var(--mod-equipos)"
      cifras={[
        { etiqueta: "Movilizados", valor: flota.movilizados, href: "/equipos" },
        {
          etiqueta: "Desmovilizados",
          valor: flota.desmovilizados,
          href: "/equipos",
        },
        {
          etiqueta: "Pendientes",
          valor: flota.pendientes,
          href: "/equipos",
          tono: "aviso",
        },
        {
          etiqueta: "Operativos",
          valor: flota.operativos,
          href: "/equipos",
          tono: "bien",
        },
      ]}
    />
  );
}

// Técnico: lo que tiene a su cargo y accesos rápidos según lo que puede hacer.
export function DashboardTecnico({
  d,
  accesos,
}: {
  d: Extract<Dashboard, { tipo: "TECNICO" }>;
  accesos: { href: string; texto: string }[];
}) {
  return (
    <div className="flex flex-col gap-6">
      {accesos.length > 0 && (
        <nav aria-label="Acciones rápidas" className="flex flex-wrap gap-3">
          {accesos.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className={`${tarjeta} px-4 py-3 text-sm font-semibold transition-colors hover:border-primary/40`}
            >
              {a.texto}
            </Link>
          ))}
        </nav>
      )}
      <Bandeja items={d.bandeja} />
    </div>
  );
}

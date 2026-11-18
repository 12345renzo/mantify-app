import Link from "next/link";

export const POR_PAGINA = 5;

export type ParamsUrl = Record<string, string | string[] | undefined>;

// La página viene de la URL: cualquier valor raro cae en la 1, y uno muy grande en la última.
export function paginar<T>(items: T[], valor: string | string[] | undefined) {
  const paginas = Math.max(1, Math.ceil(items.length / POR_PAGINA));
  const n = Number(Array.isArray(valor) ? valor[0] : valor);
  const pagina = Number.isInteger(n) ? Math.min(Math.max(n, 1), paginas) : 1;
  return {
    items: items.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA),
    pagina,
    paginas,
    total: items.length,
  };
}

// `param` es el nombre en la URL de esta tabla; `params` son los de la URL actual (otras tablas conservan su página).
export function Paginacion({
  param,
  params,
  pagina,
  paginas,
  total,
}: {
  param: string;
  params: ParamsUrl;
  pagina: number;
  paginas: number;
  total: number;
}) {
  if (paginas <= 1) return null;
  const href = (n: number) => {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      const valor = Array.isArray(v) ? v[0] : v;
      if (valor !== undefined && k !== param) qs.set(k, valor);
    }
    if (n > 1) qs.set(param, String(n));
    return `?${qs.toString()}`;
  };
  const desde = (pagina - 1) * POR_PAGINA + 1;
  const hasta = Math.min(pagina * POR_PAGINA, total);
  const enlace =
    "rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium transition-colors hover:bg-surface-2";
  const apagado = `${enlace} pointer-events-none opacity-50`;
  return (
    <nav
      aria-label="Paginación"
      className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-3 sm:px-6"
    >
      <p className="text-sm text-muted tabular-nums">
        {desde}–{hasta} de {total}
      </p>
      <div className="flex items-center gap-2">
        {pagina > 1 ? (
          <Link href={href(pagina - 1)} scroll={false} className={enlace}>
            Anterior
          </Link>
        ) : (
          <span className={apagado}>Anterior</span>
        )}
        <span className="px-1 text-sm text-muted tabular-nums">
          {pagina} / {paginas}
        </span>
        {pagina < paginas ? (
          <Link href={href(pagina + 1)} scroll={false} className={enlace}>
            Siguiente
          </Link>
        ) : (
          <span className={apagado}>Siguiente</span>
        )}
      </div>
    </nav>
  );
}

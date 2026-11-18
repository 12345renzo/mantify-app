"use client";

import { useState } from "react";
import { IconoCandado, IconoCheck } from "@/shared/ui/iconos";

function Copiable({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  const [copiado, setCopiado] = useState(false);
  return (
    <div>
      <p className="text-[10px] font-semibold tracking-[0.12em] text-muted uppercase">
        {etiqueta}
      </p>
      <div className="mt-1.5 flex items-center gap-2">
        <code className="min-w-0 flex-1 truncate rounded-lg border border-border bg-surface-2/70 px-3 py-2 font-mono text-sm select-all">
          {valor}
        </code>
        <button
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(valor);
              setCopiado(true);
              setTimeout(() => setCopiado(false), 2000);
            } catch {
              // Sin portapapeles: el texto se puede seleccionar a mano.
            }
          }}
          className="shrink-0 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-semibold transition-colors hover:border-border-strong hover:bg-surface-2"
        >
          {copiado ? "Copiado" : "Copiar"}
        </button>
      </div>
    </div>
  );
}

// La clave solo existe aquí: no se guarda en Mantify y no se vuelve a mostrar.
export function Credenciales({
  correo,
  clave,
}: {
  correo: string;
  clave: string;
}) {
  return (
    <div className="rounded-[1.15rem] border border-ok/25 bg-ok-soft/70 p-5">
      <p className="flex items-center gap-2 font-semibold text-ok">
        <IconoCheck width={18} height={18} />
        Cuenta lista. Entrega estos datos a la persona.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Copiable etiqueta="Correo" valor={correo} />
        <Copiable etiqueta="Contraseña" valor={clave} />
      </div>
      <p className="mt-4 flex gap-2 rounded-lg border border-warn/20 bg-warn-soft/50 px-3 py-2.5 text-sm text-fg">
        <IconoCandado
          width={16}
          height={16}
          className="mt-0.5 shrink-0 text-warn"
        />
        La contraseña se muestra solo esta vez. Al entrar, la app le pedirá que
        la cambie por una propia.
      </p>
    </div>
  );
}

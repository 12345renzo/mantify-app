"use client";

import { useRouter } from "next/navigation";
import { useActionState, useState } from "react";
import { boton, campo, etiqueta } from "@/shared/ui/estilos";
import { IconoCandado, IconoCheck } from "@/shared/ui/iconos";
import { Modal } from "@/shared/ui/modal";
import { cambiarClaveAction, type EstadoClave } from "./actions";

const CAMPOS = [
  {
    id: "nueva",
    label: "Nueva contraseña",
    auto: "new-password",
    ayuda: "Mínimo 12 caracteres. Una frase corta es fácil de recordar.",
  },
  { id: "repetir", label: "Repite la nueva contraseña", auto: "new-password" },
] as const;

// Modal controlado desde fuera (menú de perfil) o con su propio botón (aviso).
export function ModalClave({
  abierto,
  onCerrar,
}: {
  abierto: boolean;
  onCerrar: () => void;
}) {
  const router = useRouter();
  const cerrar = () => {
    onCerrar();
    // Al cerrar se actualiza la página (el aviso desaparece si ya la cambió).
    router.refresh();
  };
  return (
    <Modal
      abierto={abierto}
      onCerrar={cerrar}
      titulo="Cambiar contraseña"
      descripcion="Usa una que solo tú conozcas."
    >
      {abierto && <FormularioClave onListo={cerrar} />}
    </Modal>
  );
}

// Aviso de "cambia tu contraseña". Sigue montado mientras el modal esté abierto: al cambiarla,
// Supabase renueva las cookies, Next vuelve a pintar la página con mostrar=false, y sin esto
// el modal se iría antes de mostrar el éxito.
export function AvisoClave({ mostrar }: { mostrar: boolean }) {
  const [abierto, setAbierto] = useState(false);
  if (!mostrar && !abierto) return null;
  return (
    <>
      {mostrar && (
        <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-warn/30 border-l-[3px] border-l-warn bg-warn-soft px-4 py-3 text-sm">
          <IconoCandado width={18} height={18} className="shrink-0 text-warn" />
          <p className="min-w-0 flex-1 text-fg">
            Por seguridad, cambia la contraseña que te asignaron por una que
            solo tú conozcas.
          </p>
          <button
            type="button"
            onClick={() => setAbierto(true)}
            className="rounded-md border border-warn/25 bg-surface/60 px-3 py-1.5 text-xs font-semibold text-warn transition-colors hover:bg-surface"
          >
            Cambiar ahora
          </button>
        </div>
      )}
      <ModalClave abierto={abierto} onCerrar={() => setAbierto(false)} />
    </>
  );
}

function FormularioClave({ onListo }: { onListo: () => void }) {
  const [estado, enviar, pendiente] = useActionState<EstadoClave, FormData>(
    cambiarClaveAction,
    {},
  );
  const e = estado.errores ?? {};

  if (estado.exito) {
    return (
      <div className="flex flex-col items-center gap-4 p-8 text-center">
        <span className="grid size-12 place-items-center rounded-full bg-ok-soft text-ok">
          <IconoCheck />
        </span>
        <p className="font-semibold">Contraseña actualizada</p>
        <p className="text-sm text-muted">Úsala la próxima vez que ingreses.</p>
        <button type="button" onClick={onListo} className={boton.primario}>
          Listo
        </button>
      </div>
    );
  }

  return (
    <form action={enviar} noValidate>
      <div className="flex flex-col gap-4 p-6">
        {CAMPOS.map((c) => (
          <div key={c.id}>
            <label htmlFor={c.id} className={etiqueta}>
              {c.label}
            </label>
            <input
              id={c.id}
              name={c.id}
              type="password"
              autoComplete={c.auto}
              maxLength={200}
              className={campo}
              aria-invalid={e[c.id] ? true : undefined}
            />
            {e[c.id] ? (
              <p className="mt-1.5 text-sm text-bad">{e[c.id]}</p>
            ) : (
              "ayuda" in c && (
                <p className="mt-1.5 text-xs text-muted">{c.ayuda}</p>
              )
            )}
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border px-6 py-4">
        {estado.error && (
          <p className="mr-auto text-sm text-bad" aria-live="polite">
            {estado.error}
          </p>
        )}
        <button type="button" onClick={onListo} className={boton.secundario}>
          Cancelar
        </button>
        <button type="submit" disabled={pendiente} className={boton.primario}>
          {pendiente ? "Guardando…" : "Cambiar contraseña"}
        </button>
      </div>
    </form>
  );
}

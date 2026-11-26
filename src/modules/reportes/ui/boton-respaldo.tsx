"use client";

import { useState } from "react";
import { boton, campo, etiqueta } from "@/shared/ui/estilos";
import { Modal } from "@/shared/ui/modal";

const MENSAJE: Record<number, string> = {
  400: "La contraseña no es correcta.",
  403: "No tienes permiso para descargar el respaldo.",
  429: "Demasiadas descargas. Espera un minuto.",
};

// Respaldo de la empresa para el superadmin: pide su contraseña y descarga el JSON sin salir de la página.
export function BotonRespaldo({ empresaId }: { empresaId: string }) {
  const [abierto, setAbierto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendiente, setPendiente] = useState(false);

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPendiente(true);
    setError(null);
    try {
      const r = await fetch("/api/reportes/respaldo", {
        method: "POST",
        body: new FormData(e.currentTarget),
      });
      if (!r.ok) {
        setError(MENSAJE[r.status] ?? "No se pudo generar el respaldo.");
        return;
      }
      const nombre =
        /filename="([^"]+)"/.exec(
          r.headers.get("content-disposition") ?? "",
        )?.[1] ?? "respaldo.json";
      const url = URL.createObjectURL(await r.blob());
      const a = document.createElement("a");
      a.href = url;
      a.download = nombre;
      a.click();
      URL.revokeObjectURL(url);
      setAbierto(false);
    } catch {
      setError("No se pudo generar el respaldo.");
    } finally {
      setPendiente(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError(null);
          setAbierto(true);
        }}
        className={boton.secundario}
      >
        Respaldo (JSON)
      </button>
      <Modal
        abierto={abierto}
        onCerrar={() => setAbierto(false)}
        titulo="Descargar respaldo"
        descripcion="Todos los datos de esta empresa, con membresías, pagos y auditoría. La descarga queda registrada."
      >
        {abierto && (
          <form onSubmit={enviar}>
            <input type="hidden" name="empresaId" value={empresaId} />
            <div className="p-6">
              <label htmlFor="clave-respaldo" className={etiqueta}>
                Tu contraseña
              </label>
              <input
                id="clave-respaldo"
                name="clave"
                type="password"
                autoComplete="current-password"
                required
                maxLength={200}
                className={campo}
                aria-invalid={error ? true : undefined}
              />
            </div>
            <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border px-6 py-4">
              {error && (
                <p className="mr-auto text-sm text-bad" aria-live="polite">
                  {error}
                </p>
              )}
              <button
                type="button"
                onClick={() => setAbierto(false)}
                className={boton.secundario}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={pendiente}
                className={boton.primario}
              >
                {pendiente ? "Generando…" : "Descargar"}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}

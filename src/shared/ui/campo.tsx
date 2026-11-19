import type { ReactNode } from "react";
import { etiqueta } from "./estilos";

// Etiqueta, control, error o ayuda: el bloque de cada campo de los formularios en modal.
export function Campo({
  id,
  label,
  error,
  ayuda,
  opcional,
  ancho,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  ayuda?: string;
  opcional?: boolean;
  ancho?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={ancho ? "sm:col-span-2" : ""}>
      <label htmlFor={id} className={etiqueta}>
        {label}
        {opcional && (
          <span className="ml-1 font-normal text-muted">(opcional)</span>
        )}
      </label>
      {children}
      {error ? (
        <p className="mt-1.5 text-sm text-bad">{error}</p>
      ) : (
        ayuda && <p className="mt-1.5 text-xs text-muted">{ayuda}</p>
      )}
    </div>
  );
}

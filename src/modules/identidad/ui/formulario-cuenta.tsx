"use client";

import { useActionState, useState } from "react";
import { boton, campo, etiqueta } from "@/shared/ui/estilos";
import { CamposPersona } from "./campos-persona";
import { Credenciales } from "./credenciales";

export type EstadoFormularioCuenta = {
  error?: string;
  exito?: string;
  errores?: Record<string, string | undefined>;
  valores?: Record<string, string>;
  credenciales?: { correo: string; clave: string };
};

type Props = {
  accion: (
    previo: EstadoFormularioCuenta,
    fd: FormData,
  ) => Promise<EstadoFormularioCuenta>;
  // Crear: elige rol. Asignar: la cuenta ya existe y su rol no cambia.
  modo:
    | {
        tipo: "crear";
        roles: { valor: string; etiqueta: string }[];
        empresaId?: string;
      }
    | { tipo: "asignar"; cuentaId: string };
  personasLibres: { id: string; nombre: string }[];
  textoBoton: string;
  // Se llama con "Listo", después de ver las credenciales.
  onListo: () => void;
};

export function FormularioCuenta({
  accion,
  modo,
  personasLibres,
  textoBoton,
  onListo,
}: Props) {
  const [estado, enviar, pendiente] = useActionState(accion, {});
  const v = estado.valores ?? {};
  const e = estado.errores ?? {};
  const [origen, setOrigen] = useState<"nueva" | "existente">(
    v.personaId || modo.tipo === "asignar" ? "existente" : "nueva",
  );

  if (estado.credenciales) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <Credenciales
          correo={estado.credenciales.correo}
          clave={estado.credenciales.clave}
        />
        <button
          type="button"
          onClick={onListo}
          className={`${boton.primario} self-end`}
        >
          Listo, ya la copié
        </button>
      </div>
    );
  }

  return (
    <form action={enviar} noValidate>
      {modo.tipo === "asignar" && (
        <input type="hidden" name="cuentaId" value={modo.cuentaId} />
      )}
      {modo.tipo === "crear" && (
        <input type="hidden" name="empresaId" value={modo.empresaId ?? ""} />
      )}

      <div className="grid gap-5 p-6 sm:grid-cols-2">
        {modo.tipo === "crear" && (
          <div>
            <label htmlFor="rol" className={etiqueta}>
              Rol
            </label>
            <select
              id="rol"
              name="rol"
              defaultValue={v.rol ?? modo.roles[0]?.valor}
              className={campo}
              aria-invalid={e.rol ? true : undefined}
            >
              {modo.roles.map((r) => (
                <option key={r.valor} value={r.valor}>
                  {r.etiqueta}
                </option>
              ))}
            </select>
            {e.rol && <p className="mt-1.5 text-sm text-bad">{e.rol}</p>}
          </div>
        )}
        <div className={modo.tipo === "asignar" ? "sm:col-span-2" : ""}>
          <label htmlFor="correo" className={etiqueta}>
            Correo para ingresar
          </label>
          <input
            id="correo"
            name="correo"
            type="email"
            autoComplete="off"
            maxLength={160}
            defaultValue={v.correo}
            placeholder="nombre@empresa.pe"
            className={campo}
            aria-invalid={e.correo ? true : undefined}
          />
          {e.correo ? (
            <p className="mt-1.5 text-sm text-bad">{e.correo}</p>
          ) : (
            <p className="mt-1.5 text-xs text-muted">
              La contraseña la genera Mantify.
            </p>
          )}
        </div>

        <fieldset className="sm:col-span-2">
          <legend className={etiqueta}>Persona</legend>
          {modo.tipo === "crear" && (
            <div
              className="mb-4 inline-flex rounded-[10px] border border-border bg-surface-2/60 p-1 text-sm"
              role="radiogroup"
            >
              {(
                [
                  ["nueva", "Registrar persona nueva"],
                  [
                    "existente",
                    `Elegir del personal (${personasLibres.length})`,
                  ],
                ] as const
              ).map(([valor, texto]) => (
                <button
                  key={valor}
                  type="button"
                  role="radio"
                  aria-checked={origen === valor}
                  disabled={
                    valor === "existente" && personasLibres.length === 0
                  }
                  onClick={() => setOrigen(valor)}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all disabled:opacity-50 ${
                    origen === valor
                      ? "bg-surface text-fg shadow-[0_1px_2px_rgb(35_40_32/0.12)]"
                      : "text-muted hover:text-fg"
                  }`}
                >
                  {texto}
                </button>
              ))}
            </div>
          )}

          {origen === "existente" ? (
            <div>
              <label htmlFor="personaId" className="sr-only">
                Persona del personal
              </label>
              <select
                id="personaId"
                name="personaId"
                defaultValue={v.personaId ?? ""}
                className={campo}
              >
                <option value="">
                  {personasLibres.length === 0
                    ? "No hay personal activo sin cuenta"
                    : "Elige una persona sin cuenta…"}
                </option>
                {personasLibres.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <>
              <input type="hidden" name="personaId" value="" />
              <CamposPersona valores={v} errores={e} />
            </>
          )}
        </fieldset>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border px-6 py-4">
        {estado.error && (
          <p className="mr-auto text-sm text-bad" aria-live="polite">
            {estado.error}
          </p>
        )}
        <button
          type="submit"
          disabled={
            pendiente ||
            (modo.tipo === "asignar" && personasLibres.length === 0)
          }
          className={boton.primario}
        >
          {pendiente ? "Guardando…" : textoBoton}
        </button>
      </div>
    </form>
  );
}

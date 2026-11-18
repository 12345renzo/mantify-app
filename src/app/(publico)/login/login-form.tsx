"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { MENSAJE_SIN_ACCESO } from "@/modules/identidad/domain/reglas-persona-cuenta";
import { boton, campo, etiqueta } from "@/shared/ui/estilos";
import { IconoCandado, IconoOjo, IconoOjoTachado } from "@/shared/ui/iconos";
import { iniciarSesion } from "./actions";

const MAX_FALLOS = 3;
const ESPERA_SEGUNDOS = 30;

// Avisos cuando una página manda de vuelta al login (?error=...). Texto fijo: nunca se pinta lo que trae la URL.
const ERRORES_URL: Record<string, string> = {
  "sin-acceso": "Esta cuenta no tiene acceso a esa sección.",
  sin_cuenta: "Esta cuenta no tiene acceso a Mantify.",
  ...Object.fromEntries(
    Object.entries(MENSAJE_SIN_ACCESO).map(([k, v]) => [k.toLowerCase(), v]),
  ),
};

export function LoginForm() {
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(
    ERRORES_URL[params.get("error") ?? ""] ?? null,
  );
  const [email, setEmail] = useState("");
  const [verClave, setVerClave] = useState(false);
  // El contador vive solo en memoria: recargar la página lo reinicia. Freno para la persona;
  // la barrera real es el límite de intentos de Supabase Auth.
  const [fallos, setFallos] = useState(0);
  const [bloqueadoHasta, setBloqueadoHasta] = useState<number | null>(null);
  const [restante, setRestante] = useState(0);

  useEffect(() => {
    if (bloqueadoHasta === null) return;
    const id = setInterval(() => {
      const s = Math.ceil((bloqueadoHasta - Date.now()) / 1000);
      if (s <= 0) {
        setBloqueadoHasta(null);
        setRestante(0);
        setError(null);
      } else {
        setRestante(s);
      }
    }, 250);
    return () => clearInterval(id);
  }, [bloqueadoHasta]);

  const bloqueado = bloqueadoHasta !== null;

  async function enviar(formData: FormData) {
    if (bloqueado) return;
    const resultado = await iniciarSesion(formData);
    if (!resultado) return;
    const total = fallos + 1;
    if (total >= MAX_FALLOS) {
      setFallos(0);
      setBloqueadoHasta(Date.now() + ESPERA_SEGUNDOS * 1000);
      setRestante(ESPERA_SEGUNDOS);
      setError(
        `Fallaste ${MAX_FALLOS} veces. Espera ${ESPERA_SEGUNDOS} segundos para volver a intentar.`,
      );
    } else {
      setFallos(total);
      setError(resultado.error);
    }
  }

  return (
    <form action={enviar} className="mt-7 flex flex-col gap-4" noValidate>
      <div>
        <label htmlFor="email" className={etiqueta}>
          Correo
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          maxLength={160}
          placeholder="nombre@empresa.pe"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={campo}
          aria-invalid={error ? true : undefined}
        />
      </div>

      <div>
        <label htmlFor="password" className={etiqueta}>
          Contraseña
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={verClave ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••••••"
            required
            maxLength={200}
            className={`${campo} pr-11`}
            aria-invalid={error ? true : undefined}
          />
          <button
            type="button"
            onClick={() => setVerClave((v) => !v)}
            className="absolute inset-y-0 right-0 grid w-11 place-items-center rounded-r-xl text-muted transition-colors hover:text-fg"
            aria-label={verClave ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {verClave ? (
              <IconoOjoTachado width={18} height={18} />
            ) : (
              <IconoOjo width={18} height={18} />
            )}
          </button>
        </div>
      </div>

      <div aria-live="polite" className="min-h-0">
        {error && (
          <p className="rounded-lg border border-bad/25 border-l-[3px] border-l-bad bg-bad-soft px-3.5 py-2.5 text-sm leading-snug text-bad">
            {error}
          </p>
        )}
        {!bloqueado && fallos > 0 && (
          <p className="mt-2 font-mono text-[11px] text-muted">
            Intentos restantes: {MAX_FALLOS - fallos}
          </p>
        )}
      </div>

      <BotonIngresar bloqueado={bloqueado} restante={restante} />
    </form>
  );
}

function BotonIngresar({
  bloqueado,
  restante,
}: {
  bloqueado: boolean;
  restante: number;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || bloqueado}
      className={`${boton.primario} w-full py-3`}
    >
      {bloqueado ? (
        <>
          <IconoCandado width={18} height={18} />
          <span className="tabular-nums">Espera {restante} s</span>
        </>
      ) : pending ? (
        "Ingresando…"
      ) : (
        "Ingresar"
      )}
    </button>
  );
}

import { campo, campo2, etiqueta } from "@/shared/ui/estilos";

type Props = {
  valores?: Record<string, string>;
  errores?: Record<string, string | undefined>;
};

function Campo({
  id,
  label,
  error,
  opcional,
  className = "",
  children,
}: {
  id: string;
  label: string;
  error?: string;
  opcional?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className={etiqueta}>
        {label}
        {opcional && (
          <span className="ml-1 font-normal text-muted">(opcional)</span>
        )}
      </label>
      {children}
      {error && <p className="mt-1.5 text-sm text-bad">{error}</p>}
    </div>
  );
}

// Datos de una persona del personal. No lleva correo: el correo es de la cuenta.
export function CamposPersona({ valores = {}, errores = {} }: Props) {
  const inv = (k: string) => (errores[k] ? true : undefined);
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Campo id="nombres" label="Nombres" error={errores.nombres}>
        <input
          id="nombres"
          name="nombres"
          maxLength={80}
          defaultValue={valores.nombres}
          className={campo}
          aria-invalid={inv("nombres")}
        />
      </Campo>
      <Campo id="apellidos" label="Apellidos" error={errores.apellidos}>
        <input
          id="apellidos"
          name="apellidos"
          maxLength={80}
          defaultValue={valores.apellidos}
          className={campo}
          aria-invalid={inv("apellidos")}
        />
      </Campo>
      <Campo
        id="tipoDocumento"
        label="Documento"
        opcional
        error={errores.tipoDocumento}
        className="sm:col-span-2"
      >
        <div className="flex gap-2">
          <select
            id="tipoDocumento"
            name="tipoDocumento"
            defaultValue={valores.tipoDocumento ?? ""}
            className={`${campo2} w-40 shrink-0`}
            aria-label="Tipo de documento"
          >
            <option value="">—</option>
            <option value="DNI">DNI</option>
            <option value="CE">CE</option>
            <option value="PASAPORTE">Pasaporte</option>
          </select>
          <input
            id="numeroDocumento"
            name="numeroDocumento"
            maxLength={15}
            defaultValue={valores.numeroDocumento}
            placeholder="Número"
            className={`${campo} min-w-0 flex-1 tabular-nums`}
            aria-label="Número de documento"
            aria-invalid={inv("numeroDocumento")}
          />
        </div>
        {errores.numeroDocumento && (
          <p className="mt-1.5 text-sm text-bad">{errores.numeroDocumento}</p>
        )}
      </Campo>
      <Campo id="cargo" label="Cargo" opcional error={errores.cargo}>
        <input
          id="cargo"
          name="cargo"
          maxLength={80}
          defaultValue={valores.cargo}
          placeholder="Mecánico, operador…"
          className={campo}
        />
      </Campo>
      <Campo id="telefono" label="Teléfono" opcional error={errores.telefono}>
        <input
          id="telefono"
          name="telefono"
          type="tel"
          maxLength={20}
          defaultValue={valores.telefono}
          placeholder="+51 999 999 999"
          className={`${campo} tabular-nums`}
          aria-invalid={inv("telefono")}
        />
      </Campo>
      <Campo
        id="tipoVinculo"
        label="Vínculo"
        opcional
        error={errores.tipoVinculo}
      >
        <select
          id="tipoVinculo"
          name="tipoVinculo"
          defaultValue={valores.tipoVinculo ?? ""}
          className={campo}
        >
          <option value="">—</option>
          <option value="PROPIO">Personal propio</option>
          <option value="CONTRATISTA">Contratista</option>
        </select>
      </Campo>
    </div>
  );
}

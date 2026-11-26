// Clave de cada cuenta de prueba por rol; E2E_CLAVE queda como respaldo si todas comparten una.
export function claveDe(correo: string): string {
  const porCorreo: Record<string, string | undefined> = {
    [process.env.E2E_PLAN ?? "e2e.plan@prueba.pe"]: process.env.E2E_CLAVE_PLAN,
    [process.env.E2E_SUP ?? "e2e.sup@prueba.pe"]: process.env.E2E_CLAVE_SUP,
    [process.env.E2E_TEC ?? "e2e.tec@prueba.pe"]: process.env.E2E_CLAVE_TEC,
    ...(process.env.E2E_SUPERADMIN
      ? { [process.env.E2E_SUPERADMIN]: process.env.E2E_CLAVE_SUPERADMIN }
      : {}),
  };
  return porCorreo[correo] || process.env.E2E_CLAVE || "";
}

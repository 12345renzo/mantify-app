// Una cuenta es un acceso de la empresa. Funciona solo con una persona activa asignada
// y con la empresa al día; si no, existe pero no entra.
export type MotivoSinAcceso =
  "SIN_PERSONA" | "PERSONA_BAJA" | "EMPRESA_INACTIVA" | "SESION_REVOCADA";

export const MENSAJE_SIN_ACCESO: Record<MotivoSinAcceso, string> = {
  SIN_PERSONA:
    "Tu cuenta no está asignada a ninguna persona. Habla con el planificador de tu empresa.",
  PERSONA_BAJA:
    "Tu cuenta fue dada de baja. Habla con el planificador de tu empresa.",
  EMPRESA_INACTIVA:
    "El acceso de tu empresa está suspendido hasta que se renueve la membresía.",
  SESION_REVOCADA: "Tu sesión se cerró. Vuelve a ingresar.",
};

export function esMotivoSinAcceso(
  v: string | null | undefined,
): v is MotivoSinAcceso {
  return v != null && v in MENSAJE_SIN_ACCESO;
}

export type Cupo = { usados: number; maximo: number | null };

// maximo nulo = sin límite.
export function hayCupo(cupo: Cupo): boolean {
  return cupo.maximo === null || cupo.usados < cupo.maximo;
}

export function nombreCompleto(p: {
  nombres: string;
  apellidos: string;
}): string {
  return `${p.nombres} ${p.apellidos}`.trim();
}

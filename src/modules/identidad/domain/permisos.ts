export const ROLES = [
  "SUPERADMIN",
  "PLANIFICADOR",
  "SUPERVISOR",
  "TECNICO",
  "GERENTE",
] as const;
export type Rol = (typeof ROLES)[number];

export const ROLES_EMPRESA = [
  "PLANIFICADOR",
  "SUPERVISOR",
  "TECNICO",
  "GERENTE",
] as const;
export type RolEmpresa = (typeof ROLES_EMPRESA)[number];

export const ETIQUETA_ROL: Record<Rol, string> = {
  SUPERADMIN: "Superadmin",
  PLANIFICADOR: "Planificador",
  SUPERVISOR: "Supervisor",
  TECNICO: "Técnico",
  GERENTE: "Gerente",
};

export type Accion = "leer" | "crear" | "editar" | "dar_baja";

// Recursos de todos los cortes. Los que aún no existen fijan desde ya qué podrá hacer cada rol.
export type Recurso =
  | "plataforma"
  | "personas"
  | "cuentas"
  | "catalogos"
  | "flota"
  | "horometro"
  | "trabajos"
  | "informes_validados"
  | "informes_sin_validar"
  | "reportes"
  // Plan y registros de engrase. El aviso de la empresa va aparte: solo el planificador.
  | "engrase"
  | "aviso_engrase"
  // Neumáticos: "crear" = operar (montar, rotar, desmontar, medir); "editar" = cargar, posiciones, recapar.
  | "neumaticos"
  | "costos_neumaticos"
  | "umbrales_neumaticos"
  // Exportar es leer "reportes". El JSON completo de la empresa va aparte: planificador y superadmin.
  | "respaldo_empresa";

const TODO: Accion[] = ["leer", "crear", "editar", "dar_baja"];
const ESCRIBIR: Accion[] = ["leer", "crear", "editar"];
const LEER: Accion[] = ["leer"];

// Denegar por defecto: lo que no está aquí, no se puede. RLS repite estas reglas en la base.
const MATRIZ: Record<Rol, Partial<Record<Recurso, Accion[]>>> = {
  SUPERADMIN: {
    plataforma: TODO,
    personas: TODO,
    cuentas: TODO,
    respaldo_empresa: LEER,
  },
  PLANIFICADOR: {
    personas: TODO,
    cuentas: TODO,
    catalogos: TODO,
    flota: TODO,
    horometro: ESCRIBIR,
    trabajos: ESCRIBIR,
    informes_validados: LEER,
    informes_sin_validar: LEER,
    reportes: LEER,
    engrase: ESCRIBIR,
    aviso_engrase: ["leer", "editar"],
    neumaticos: ESCRIBIR,
    costos_neumaticos: LEER,
    umbrales_neumaticos: ["leer", "editar"],
    respaldo_empresa: LEER,
  },
  SUPERVISOR: {
    personas: LEER,
    catalogos: LEER,
    // Registra lecturas; corregir a la baja ("editar") es solo del planificador.
    flota: LEER,
    horometro: ["leer", "crear"],
    trabajos: ESCRIBIR,
    informes_validados: LEER,
    informes_sin_validar: LEER,
    reportes: LEER,
    engrase: ESCRIBIR,
    neumaticos: ESCRIBIR,
    costos_neumaticos: LEER,
  },
  // El técnico no ve el estado de la flota ni informes sin validar.
  // Registra engrases ("crear"), pero no edita planes.
  TECNICO: {
    catalogos: LEER,
    trabajos: ESCRIBIR,
    informes_validados: LEER,
    engrase: ["leer", "crear"],
    // Opera y mide, pero no carga cubiertas ni ve costos.
    neumaticos: ["leer", "crear"],
  },
  // El gerente solo lee.
  GERENTE: {
    personas: LEER,
    cuentas: LEER,
    catalogos: LEER,
    flota: LEER,
    horometro: LEER,
    trabajos: LEER,
    informes_validados: LEER,
    informes_sin_validar: LEER,
    reportes: LEER,
    engrase: LEER,
    neumaticos: LEER,
    costos_neumaticos: LEER,
  },
};

export function esRol(valor: string | null | undefined): valor is Rol {
  return ROLES.some((r) => r === valor);
}

export function puede(
  rol: string | null,
  accion: Accion,
  recurso: Recurso,
): boolean {
  if (!esRol(rol)) return false;
  return MATRIZ[rol][recurso]?.includes(accion) ?? false;
}

// Qué cuentas puede crear o gestionar cada rol, siempre menos la propia (lo revisa cada caso de uso).
export function rolesQuePuedeGestionar(
  rol: string | null,
): readonly RolEmpresa[] {
  if (rol === "SUPERADMIN") return ROLES_EMPRESA;
  if (rol === "PLANIFICADOR") return ROLES_EMPRESA;
  return [];
}

// El supervisor valida siempre; el planificador solo si su empresa lo autoriza.
export function puedeValidar(
  rol: string | null,
  empresa: { planificadorPuedeValidar: boolean },
): boolean {
  if (rol === "SUPERVISOR") return true;
  if (rol === "PLANIFICADOR") return empresa.planificadorPuedeValidar;
  return false;
}

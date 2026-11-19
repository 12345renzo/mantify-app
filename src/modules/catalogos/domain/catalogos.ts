// Los 11 catálogos de la empresa. Cada uno es una tabla con id, activo y los campos que declara aquí:
// el formulario, la validación, la tabla y lo que se escribe en la base salen de esta lista.
export const CODIGOS_CATALOGO = [
  "ubicaciones",
  "categorias_equipo",
  "sistemas_mantenimiento",
  "motivos_parada",
  "areas_responsables",
  "motivos_retiro_neumatico",
  "tipos_grasa",
  "nombres_plan_preventivo",
  "plantillas_actividades",
  "plantillas_puntos_engrase",
  "plantillas_disposicion_neumatico",
] as const;

export type CodigoCatalogo = (typeof CODIGOS_CATALOGO)[number];

export type Campo =
  | {
      clave: string;
      etiqueta: string;
      tipo: "texto";
      max: number;
      requerido: boolean;
      // Varias líneas (textarea).
      largo?: boolean;
      mayusculas?: boolean;
      ayuda?: string;
    }
  | {
      clave: string;
      etiqueta: string;
      tipo: "opciones";
      opciones: Record<string, string>;
      requerido: boolean;
    }
  | {
      clave: string;
      etiqueta: string;
      tipo: "numero";
      min: number;
      max: number;
      decimales: 0 | 2;
      requerido: boolean;
      ayuda?: string;
      // Solo se pide (y es obligatorio) cuando otro campo vale uno de estos.
      soloSi?: { campo: string; valores: string[] };
    }
  // Categoría de equipo de la misma empresa. Vacía = aplica a todas.
  | { clave: string; etiqueta: string; tipo: "categoria" }
  // La calcula la base: solo se muestra.
  | { clave: string; etiqueta: string; tipo: "derivado" };

export type Valores = Record<string, string | number | boolean | null>;

export type DefCatalogo = {
  titulo: string;
  singular: string;
  descripcion: string;
  campos: Campo[];
  // Campo que nombra al elemento (primera columna y confirmaciones).
  principal: string;
  ordenarPor: string[];
  // Qué no se repite, para el mensaje de duplicado. Sin valor: se puede repetir.
  unico?: string;
  // Regla entre campos. Devuelve el campo con problema o null.
  validar?: (v: Valores) => { campo: string; mensaje: string } | null;
};

const ORDEN: Campo = {
  clave: "orden",
  etiqueta: "Orden",
  tipo: "numero",
  min: 0,
  max: 9999,
  decimales: 0,
  requerido: false,
  ayuda: "Los menores salen primero en las listas.",
};
const nombre = (max = 80): Campo => ({
  clave: "nombre",
  etiqueta: "Nombre",
  tipo: "texto",
  max,
  requerido: true,
});
const DESCRIPCION: Campo = {
  clave: "descripcion",
  etiqueta: "Descripción",
  tipo: "texto",
  max: 200,
  requerido: true,
};
const CATEGORIA: Campo = {
  clave: "categoria_id",
  etiqueta: "Categoría",
  tipo: "categoria",
};

export const PLANES_PM = { PM1: "PM1", PM2: "PM2", PM3: "PM3", PM4: "PM4" };

// Códigos fijos: los cortes de paradas y preventivos dependen de ellos.
export const CODIGOS_PARADA: Record<string, string> = {
  ...PLANES_PM,
  MCI: "MCI — Correctivo inmediato",
  MCP: "MCP — Correctivo programado",
  MEJORATIVO: "Mejorativo",
  PREDICTIVO: "Predictivo",
  ENGRASE: "Engrase",
  OTROS: "Otros",
};

// Una línea por eje; posiciones separadas por "|". Misma regla que el CHECK de la base.
const LINEA_EJE = /^[A-Z0-9-]{1,10}(\s*\|\s*[A-Z0-9-]{1,10})*$/;
export function layoutValido(layout: string): boolean {
  const lineas = layout.split("\n").map((l) => l.trim());
  return lineas.length <= 10 && lineas.every((l) => LINEA_EJE.test(l));
}

export const CATALOGOS: Record<CodigoCatalogo, DefCatalogo> = {
  ubicaciones: {
    titulo: "Ubicaciones",
    singular: "ubicación",
    descripcion: "Sedes, frentes y lugares donde trabaja la flota.",
    campos: [
      nombre(),
      {
        clave: "tipo",
        etiqueta: "Tipo",
        tipo: "opciones",
        opciones: { SEDE: "Sede", FRENTE: "Frente", LUGAR: "Lugar" },
        requerido: true,
      },
      ORDEN,
    ],
    principal: "nombre",
    ordenarPor: ["tipo", "orden", "nombre"],
    unico: "una con ese nombre y tipo",
  },
  categorias_equipo: {
    titulo: "Categorías de equipo",
    singular: "categoría",
    descripcion: "Tipos de equipo y cómo se mide su uso.",
    campos: [
      nombre(),
      {
        clave: "tipo_medidor",
        etiqueta: "Se mide en",
        tipo: "opciones",
        opciones: { HORAS: "Horas", KILOMETROS: "Kilómetros" },
        requerido: true,
      },
      {
        clave: "nombre_flota",
        etiqueta: "Nombre en el Excel de flota",
        tipo: "texto",
        max: 80,
        requerido: false,
        ayuda: "Ej. VOLQUETE. Sirve para importar equipos.",
      },
      ORDEN,
    ],
    principal: "nombre",
    ordenarPor: ["orden", "nombre"],
    unico: "una con ese nombre o ese nombre de flota",
  },
  sistemas_mantenimiento: {
    titulo: "Sistemas",
    singular: "sistema",
    descripcion: "Sistemas del equipo: motor, transmisión, hidráulico…",
    campos: [nombre(), ORDEN],
    principal: "nombre",
    ordenarPor: ["orden", "nombre"],
    unico: "uno con ese nombre",
  },
  motivos_parada: {
    titulo: "Motivos de parada",
    singular: "motivo de parada",
    descripcion:
      "PM1 a PM4, engrase y predictivo cuentan como planificados; el resto, no.",
    campos: [
      {
        clave: "codigo",
        etiqueta: "Código",
        tipo: "opciones",
        opciones: CODIGOS_PARADA,
        requerido: true,
      },
      nombre(),
      { clave: "es_planificado", etiqueta: "Planificado", tipo: "derivado" },
      {
        clave: "duracion_estandar_horas",
        etiqueta: "Duración estándar (h)",
        tipo: "numero",
        min: 0.01,
        max: 1000,
        decimales: 2,
        requerido: false,
        ayuda: "Sirve para planificar.",
        soloSi: { campo: "codigo", valores: Object.keys(PLANES_PM) },
      },
    ],
    principal: "nombre",
    ordenarPor: ["codigo"],
    unico: "uno con ese código",
    validar: (v) => {
      const pm = typeof v.codigo === "string" && v.codigo in PLANES_PM;
      if (pm && v.duracion_estandar_horas === null)
        return {
          campo: "duracion_estandar_horas",
          mensaje: "La duración es obligatoria en PM1 a PM4.",
        };
      if (!pm && v.duracion_estandar_horas !== null)
        return {
          campo: "duracion_estandar_horas",
          mensaje: "Solo los PM1 a PM4 llevan duración.",
        };
      return null;
    },
  },
  areas_responsables: {
    titulo: "Áreas responsables",
    singular: "área",
    descripcion: "Quién responde por una demora o por una parada.",
    campos: [
      nombre(),
      {
        clave: "tipo",
        etiqueta: "Tipo",
        tipo: "opciones",
        opciones: { DEMORA: "Demora", PARADA: "Parada" },
        requerido: true,
      },
    ],
    principal: "nombre",
    ordenarPor: ["tipo", "nombre"],
    unico: "una con ese nombre y tipo",
  },
  motivos_retiro_neumatico: {
    titulo: "Retiro de neumático",
    singular: "motivo",
    descripcion: "Motivos por los que se retira un neumático.",
    campos: [nombre()],
    principal: "nombre",
    ordenarPor: ["nombre"],
    unico: "uno con ese nombre",
  },
  tipos_grasa: {
    titulo: "Tipos de grasa",
    singular: "tipo de grasa",
    descripcion: "Grasas que se usan en el engrase.",
    campos: [nombre()],
    principal: "nombre",
    ordenarPor: ["nombre"],
    unico: "uno con ese nombre",
  },
  nombres_plan_preventivo: {
    titulo: "Planes preventivos",
    singular: "nombre de plan",
    descripcion: "Nombres de los planes: 250 h, 5,000 km, mensual…",
    campos: [nombre()],
    principal: "nombre",
    ordenarPor: ["nombre"],
    unico: "uno con ese nombre",
  },
  plantillas_actividades: {
    titulo: "Actividades",
    singular: "actividad",
    descripcion:
      "Actividades que se proponen al armar un preventivo. Sin categoría: aplica a todas.",
    campos: [
      DESCRIPCION,
      CATEGORIA,
      {
        clave: "plan",
        etiqueta: "Plan",
        tipo: "opciones",
        opciones: PLANES_PM,
        requerido: false,
      },
      ORDEN,
    ],
    principal: "descripcion",
    ordenarPor: ["orden", "descripcion"],
  },
  plantillas_puntos_engrase: {
    titulo: "Puntos de engrase",
    singular: "punto de engrase",
    descripcion:
      "Puntos que se proponen al armar el plan de engrase. Sin categoría: general.",
    campos: [DESCRIPCION, CATEGORIA, ORDEN],
    principal: "descripcion",
    ordenarPor: ["orden", "descripcion"],
  },
  plantillas_disposicion_neumatico: {
    titulo: "Disposición de neumáticos",
    singular: "disposición",
    descripcion: "Cómo van los neumáticos en cada eje.",
    campos: [
      nombre(),
      {
        clave: "preset",
        etiqueta: "Configuración",
        tipo: "opciones",
        opciones: {
          "4X2": "4x2",
          "6X4": "6x4",
          "8X4": "8x4",
          "8X4_REPUESTO": "8x4 con repuesto",
          OTR_2_EJES: "OTR 2 ejes",
        },
        requerido: true,
      },
      {
        clave: "layout",
        etiqueta: "Posiciones",
        tipo: "texto",
        max: 500,
        requerido: true,
        largo: true,
        mayusculas: true,
        ayuda:
          "Una línea por eje, posiciones separadas por |. Ej. DEL-I | DEL-D",
      },
    ],
    principal: "nombre",
    ordenarPor: ["nombre"],
    unico: "una con ese nombre",
    validar: (v) =>
      typeof v.layout === "string" && !layoutValido(v.layout)
        ? {
            campo: "layout",
            mensaje:
              "Hasta 10 líneas; cada posición con letras, números o guion (máx. 10).",
          }
        : null,
  },
};

export function esCatalogo(valor: unknown): valor is CodigoCatalogo {
  return CODIGOS_CATALOGO.some((c) => c === valor);
}

// Campos que entran por formulario (los derivados los pone la base).
export const camposEditables = (def: DefCatalogo) =>
  def.campos.filter((c) => c.tipo !== "derivado");

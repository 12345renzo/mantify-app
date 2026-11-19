import { HOROMETRO_MAX } from "@/modules/equipos/domain/horometro";
import { duracionHoras, esFechaHora, type FechaHora } from "./duracion";

export type FilaParada = {
  fila: number;
  idImportacion: string;
  equipo: string;
  motivo: string;
  inicio: FechaHora;
  fin: FechaHora;
  horometroInicio: number;
  horometroFin: number;
  descripcion: string;
  responsable: string;
  areaDemora: string | null;
  areaParada: string | null;
  hallazgo: string | null;
};
export type ErrorFila = { fila: number; motivo: string };

type Campo =
  | "id"
  | "equipo"
  | "motivo"
  | "inicio"
  | "fin"
  | "horoInicio"
  | "horoFin"
  | "descripcion"
  | "responsable"
  | "areaDemora"
  | "areaParada"
  | "hallazgo";

// Encabezado sin tildes, mayúsculas ni símbolos → campo.
const ALIAS: Record<string, Campo> = {
  idimportacion: "id",
  id: "id",
  codigoimportacion: "id",
  equipo: "equipo",
  codigo: "equipo",
  codigoequipo: "equipo",
  motivo: "motivo",
  inicio: "inicio",
  fechainicio: "inicio",
  horaparada: "inicio",
  parada: "inicio",
  fin: "fin",
  fechafin: "fin",
  salida: "fin",
  horasalida: "fin",
  horometroinicio: "horoInicio",
  horometroparada: "horoInicio",
  horometrofin: "horoFin",
  horometrosalida: "horoFin",
  descripcion: "descripcion",
  tarea: "descripcion",
  trabajo: "descripcion",
  responsable: "responsable",
  areademora: "areaDemora",
  areaparada: "areaParada",
  hallazgo: "hallazgo",
};

const OBLIGATORIAS: Campo[] = [
  "id",
  "equipo",
  "motivo",
  "inicio",
  "fin",
  "horoInicio",
  "horoFin",
  "descripcion",
  "responsable",
];

const clave = (t: string) =>
  t
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const FORMULA = /^[=+\-@]/;

// Texto de celda sin caracteres de control. Una celda que empieza como fórmula se rechaza
// (no se "arregla"): se informa la fila para que corrijan el archivo.
function texto(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v as string)
    .replace(/\p{Cc}/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Excel da las celdas con formato de fecha como Date con la hora "de pared" en UTC.
// En texto acepta 2026-11-19 08:30, 2026-11-19T08:30 o 19/11/2026 08:30.
function fechaHora(v: unknown): FechaHora | null {
  if (v instanceof Date) {
    const t = v.toISOString().slice(0, 16);
    return Number.isNaN(v.getTime()) ? null : t;
  }
  const t = texto(v);
  const dmy = /^(\d{1,2})\/(\d{1,2})\/(\d{4})[ T](\d{1,2}):(\d{2})$/.exec(t);
  const iso = dmy
    ? `${dmy[3]}-${dmy[2].padStart(2, "0")}-${dmy[1].padStart(2, "0")}T${dmy[4].padStart(2, "0")}:${dmy[5]}`
    : t.replace(" ", "T").slice(0, 16);
  return esFechaHora(iso) ? iso : null;
}

// Número de Excel tal cual o texto estricto con punto decimal; "1,500" o "1e5" no pasan.
function horometro(v: unknown): number | null {
  if (typeof v === "number") {
    return Number.isFinite(v) && v >= 0 && v <= HOROMETRO_MAX
      ? Math.round(v * 100) / 100
      : null;
  }
  const t = texto(v);
  if (!/^\d{1,7}(\.\d{1,2})?$/.test(t)) return null;
  const n = Number(t);
  return n <= HOROMETRO_MAX ? n : null;
}

export type Preparacion =
  | { ok: true; validas: FilaParada[]; errores: ErrorFila[] }
  | { ok: false; error: string };

// Valida cada fila del Excel (la fila 1 es el encabezado). Las malas se informan sin cortar el resto.
export function prepararImportacion(
  filas: unknown[][],
  limiteFilas: number,
): Preparacion {
  if (filas.length < 2) return { ok: false, error: "VACIO" };
  if (filas.length - 1 > limiteFilas) {
    return { ok: false, error: "DEMASIADAS_FILAS" };
  }
  const indice = new Map<Campo, number>();
  filas[0].forEach((h, i) => {
    const c = ALIAS[clave(texto(h))];
    if (c && !indice.has(c)) indice.set(c, i);
  });
  const faltan = OBLIGATORIAS.filter((c) => !indice.has(c));
  if (faltan.length) return { ok: false, error: "COLUMNAS" };

  const validas: FilaParada[] = [];
  const errores: ErrorFila[] = [];
  const vistos = new Set<string>();
  filas.slice(1).forEach((celdas, i) => {
    const n = i + 2;
    const crudo = (c: Campo) => {
      const j = indice.get(c);
      return j === undefined ? null : celdas[j];
    };
    const v = (c: Campo) => texto(crudo(c));
    if (celdas.every((c) => texto(c) === "")) return;
    const error = (motivo: string) => errores.push({ fila: n, motivo });

    const textos = [...indice.keys()]
      .filter((c) => typeof crudo(c) === "string")
      .map(v);
    if (textos.some((t) => FORMULA.test(t))) {
      return error("Tiene una fórmula o un texto que empieza con = + - @.");
    }
    if (textos.some((t) => t.length > 1000))
      return error("Algún texto es muy largo.");
    const id = v("id");
    if (!id || id.length > 60)
      return error("Falta el ID de importación (máx. 60).");
    if (vistos.has(id))
      return error("El ID de importación se repite en el archivo.");
    vistos.add(id);
    const inicio = fechaHora(crudo("inicio"));
    const fin = fechaHora(crudo("fin"));
    if (!inicio || !fin) {
      return error(
        "Fecha y hora no válidas (usa 2026-11-19 08:30 o 19/11/2026 08:30).",
      );
    }
    if (duracionHoras(inicio, fin) <= 0) {
      return error("La salida debe ser posterior a la parada.");
    }
    const hi = horometro(crudo("horoInicio"));
    const hf = horometro(crudo("horoFin"));
    if (hi === null || hf === null) {
      return error("Horómetro no válido: número con punto decimal, sin comas.");
    }
    if (hf < hi)
      return error("El horómetro de salida es menor que el de parada.");
    if (!v("equipo")) return error("Falta el equipo.");
    if (!v("motivo")) return error("Falta el motivo.");
    if (!v("descripcion")) return error("Falta la descripción de la tarea.");
    if (v("responsable").length < 2) return error("Falta el responsable.");
    validas.push({
      fila: n,
      idImportacion: id,
      equipo: v("equipo"),
      motivo: v("motivo"),
      inicio,
      fin,
      horometroInicio: hi,
      horometroFin: hf,
      descripcion: v("descripcion"),
      responsable: v("responsable").slice(0, 120),
      areaDemora: v("areaDemora") || null,
      areaParada: v("areaParada") || null,
      hallazgo: v("hallazgo") || null,
    });
  });
  return { ok: true, validas, errores };
}

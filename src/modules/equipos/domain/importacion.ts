import {
  CODIGO_VALIDO,
  normalizarCodigo,
  type EstadoOperativo,
} from "./equipo";
import { HOROMETRO_MAX, parsearHorometro } from "./horometro";

export const LIMITES_IMPORTACION = {
  bytes: 2 * 1024 * 1024,
  filas: 1000,
  // Un .xlsx es un zip: se rechaza si lo descomprimido pasa de esto (zip bomb).
  descomprimido: 40 * 1024 * 1024,
  entradasZip: 300,
};

// Un .xlsx real empieza con la firma de zip "PK\x03\x04", sin importar la extensión.
export function pareceXlsx(bytes: Uint8Array): boolean {
  return (
    bytes.length > 4 &&
    bytes[0] === 0x50 &&
    bytes[1] === 0x4b &&
    bytes[2] === 0x03 &&
    bytes[3] === 0x04
  );
}

type Campo =
  | "codigo"
  | "categoria"
  | "ubicacion"
  | "marca"
  | "modelo"
  | "serie"
  | "horometro"
  | "idExterno"
  | "estado";

// Encabezado sin tildes, mayúsculas ni símbolos → campo.
const ALIAS: Record<string, Campo> = {
  codigo: "codigo",
  codigoequipo: "codigo",
  equipo: "codigo",
  categoria: "categoria",
  flota: "categoria",
  tipo: "categoria",
  tipoequipo: "categoria",
  ubicacion: "ubicacion",
  frente: "ubicacion",
  lugar: "ubicacion",
  marca: "marca",
  modelo: "modelo",
  serie: "serie",
  numeroserie: "serie",
  nserie: "serie",
  nroserie: "serie",
  horometro: "horometro",
  horas: "horometro",
  kilometraje: "horometro",
  km: "horometro",
  idexterno: "idExterno",
  codigoexterno: "idExterno",
  estado: "estado",
  estadooperativo: "estado",
};

const sinTildes = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "");

// Para comparar nombres de catálogo: "Camión  minero" = "camion minero".
export const claveNombre = (t: string) =>
  sinTildes(t).toLowerCase().replace(/\s+/g, " ").trim();

const claveEncabezado = (t: string) =>
  sinTildes(t)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

// Texto de una celda: sin caracteres de control ni espacios de más. Lo que empieza con
// = + - @ se neutraliza quitando esos signos, para que nunca vuelva a ser una fórmula al exportar.
export function limpiarCelda(v: unknown): string {
  if (v === null || v === undefined) return "";
  const t =
    v instanceof Date ? v.toISOString().slice(0, 10) : String(v as string);
  return t
    .replace(/\p{Cc}/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^[=+\-@\s]+/, "")
    .slice(0, 200);
}

const ESTADOS: Record<string, EstadoOperativo> = {
  operativo: "OPERATIVO",
  inoperativo: "INOPERATIVO",
  "en mantenimiento": "EN_MANTENIMIENTO",
  mantenimiento: "EN_MANTENIMIENTO",
};

export type Columnas = Partial<Record<Campo, number>>;

export function leerEncabezados(
  fila: unknown[],
): { ok: true; columnas: Columnas } | { ok: false; error: string } {
  const columnas: Columnas = {};
  fila.forEach((celda, i) => {
    const campo = ALIAS[claveEncabezado(limpiarCelda(celda))];
    if (campo && columnas[campo] === undefined) columnas[campo] = i;
  });
  const faltan = (["codigo", "categoria"] as const).filter(
    (c) => columnas[c] === undefined,
  );
  return faltan.length
    ? {
        ok: false,
        error: `Faltan columnas obligatorias en la primera fila: ${faltan
          .map((c) => c.toUpperCase())
          .join(", ")}.`,
      }
    : { ok: true, columnas };
}

export type Catalogos = {
  // claveNombre(nombre o nombre de flota) → id. Solo activas.
  categorias: Map<string, string>;
  ubicaciones: Map<string, string>;
};

export type FilaImportada = {
  codigo: string;
  categoriaId: string;
  ubicacionId: string | null;
  marca: string | null;
  modelo: string | null;
  numeroSerie: string | null;
  idExterno: string | null;
  estadoOperativo: EstadoOperativo | null;
  horometro: number | null;
};

// Horómetro: número de Excel tal cual (con rango) o texto estricto. "-5", "1e5" o "=1+1" no pasan.
function leerHorometro(v: unknown): number | null | undefined {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "number") {
    return Number.isFinite(v) && v >= 0 && v <= HOROMETRO_MAX
      ? Math.round(v * 100) / 100
      : undefined;
  }
  return parsearHorometro(String(v)) ?? undefined;
}

// null = fila vacía (se salta). Si no, el equipo o el error de esa fila.
export function parsearFilaEquipo(
  celdas: unknown[],
  columnas: Columnas,
  catalogos: Catalogos,
): { ok: true; equipo: FilaImportada } | { ok: false; error: string } | null {
  const celda = (c: Campo) =>
    columnas[c] === undefined ? "" : limpiarCelda(celdas[columnas[c]]);
  const crudo = (c: Campo) =>
    columnas[c] === undefined ? null : celdas[columnas[c]];
  if (celdas.every((c) => limpiarCelda(c) === "")) return null;

  const codigo = normalizarCodigo(celda("codigo"));
  if (!codigo) return { ok: false, error: "Falta el código." };
  if (!CODIGO_VALIDO.test(codigo)) {
    return {
      ok: false,
      error: `Código «${codigo.slice(0, 30)}» no válido: hasta 30 letras, números o . _ / -.`,
    };
  }
  const nombreCat = celda("categoria");
  const categoriaId = catalogos.categorias.get(claveNombre(nombreCat));
  if (!categoriaId) {
    return {
      ok: false,
      error: nombreCat
        ? `La categoría «${nombreCat}» no existe o está inactiva.`
        : "Falta la categoría.",
    };
  }
  const nombreUbi = celda("ubicacion");
  const ubicacionId = nombreUbi
    ? catalogos.ubicaciones.get(claveNombre(nombreUbi))
    : null;
  if (ubicacionId === undefined) {
    return {
      ok: false,
      error: `La ubicación «${nombreUbi}» no existe o está inactiva.`,
    };
  }
  const textoEstado = celda("estado");
  const estadoOperativo = textoEstado
    ? ESTADOS[claveNombre(textoEstado)]
    : null;
  if (estadoOperativo === undefined) {
    return {
      ok: false,
      error: `Estado «${textoEstado}» no válido: usa Operativo, Inoperativo o En mantenimiento.`,
    };
  }
  const horometro = leerHorometro(crudo("horometro"));
  if (horometro === undefined) {
    return {
      ok: false,
      error: "Horómetro no válido: un número entre 0 y 1,000,000.",
    };
  }
  const opcional = (c: Campo) => celda(c).slice(0, 80) || null;
  return {
    ok: true,
    equipo: {
      codigo,
      categoriaId,
      ubicacionId,
      marca: opcional("marca"),
      modelo: opcional("modelo"),
      numeroSerie: opcional("serie"),
      idExterno: opcional("idExterno"),
      estadoOperativo,
      horometro,
    },
  };
}

export type ErrorFila = { fila: number; motivo: string };

// Fila 1 = encabezados. Las filas se numeran como en Excel para que el usuario las encuentre.
export function prepararImportacion(
  filas: unknown[][],
  catalogos: Catalogos,
):
  | { ok: false; error: string }
  | {
      ok: true;
      validas: { fila: number; equipo: FilaImportada }[];
      errores: ErrorFila[];
    } {
  if (filas.length < 2) {
    return { ok: false, error: "El archivo no tiene filas de equipos." };
  }
  if (filas.length - 1 > LIMITES_IMPORTACION.filas) {
    return {
      ok: false,
      error: `Máximo ${LIMITES_IMPORTACION.filas} equipos por archivo. Divídelo en varios.`,
    };
  }
  const enc = leerEncabezados(filas[0]);
  if (!enc.ok) return enc;

  const validas: { fila: number; equipo: FilaImportada }[] = [];
  const errores: ErrorFila[] = [];
  const vistos = new Map<string, number>();
  filas.slice(1).forEach((celdas, i) => {
    const fila = i + 2;
    const r = parsearFilaEquipo(celdas, enc.columnas, catalogos);
    if (r === null) return;
    if (!r.ok) return errores.push({ fila, motivo: r.error });
    const anterior = vistos.get(r.equipo.codigo);
    if (anterior !== undefined) {
      return errores.push({
        fila,
        motivo: `Código ${r.equipo.codigo} repetido (ya está en la fila ${anterior}).`,
      });
    }
    vistos.set(r.equipo.codigo, fila);
    validas.push({ fila, equipo: r.equipo });
  });
  return { ok: true, validas, errores };
}

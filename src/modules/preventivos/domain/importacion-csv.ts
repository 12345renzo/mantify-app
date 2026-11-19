import { esFechaISO, type FechaISO } from "@/shared/kernel/fechas";
import { parsearHorometro } from "@/modules/equipos/domain/horometro";
import { TIPOS_PM, type TipoPM } from "./preventivo-estado";

export const LIMITES_CSV = { bytes: 512 * 1024, filas: 1000 };

export type FilaPreventivo = {
  fila: number;
  equipo: string;
  plan: string;
  tipo: TipoPM;
  fecha: FechaISO;
  horometro: number | null;
  responsable: string;
};
export type ErrorFila = { fila: number; motivo: string };

type Campo = "equipo" | "plan" | "tipo" | "fecha" | "horometro" | "responsable";

// Encabezado sin tildes, mayúsculas ni símbolos → campo.
const ALIAS: Record<string, Campo> = {
  equipo: "equipo",
  codigo: "equipo",
  codigoequipo: "equipo",
  plan: "plan",
  nombreplan: "plan",
  tipo: "tipo",
  pm: "tipo",
  fecha: "fecha",
  fechaprogramada: "fecha",
  horometro: "horometro",
  horometroprogramado: "horometro",
  responsable: "responsable",
  tercero: "responsable",
};

const clave = (t: string) =>
  t
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

// Excel abre las celdas que empiezan así como fórmula: se rechazan al leer (estándar 1).
const FORMULA = /^[=+\-@\t\r]/;
const SIN_CONTROL = /^[^\p{Cc}]*$/u;

// CSV con comillas ("a,b" y "" escapada). Separador coma o punto y coma, según el encabezado.
export function leerCsv(texto: string): string[][] {
  const limpio = texto.replace(/^﻿/, "");
  const primera = limpio.slice(0, limpio.search(/\r?\n|$/));
  const sep =
    (primera.match(/;/g)?.length ?? 0) > (primera.match(/,/g)?.length ?? 0)
      ? ";"
      : ",";
  const filas: string[][] = [];
  let fila: string[] = [];
  let celda = "";
  let comillas = false;
  for (let i = 0; i < limpio.length; i++) {
    const c = limpio[i];
    if (comillas) {
      if (c === '"' && limpio[i + 1] === '"') {
        celda += '"';
        i++;
      } else if (c === '"') comillas = false;
      else celda += c;
    } else if (c === '"' && celda === "") comillas = true;
    else if (c === sep) {
      fila.push(celda);
      celda = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && limpio[i + 1] === "\n") i++;
      fila.push(celda);
      filas.push(fila);
      fila = [];
      celda = "";
    } else celda += c;
  }
  if (celda !== "" || fila.length) {
    fila.push(celda);
    filas.push(fila);
  }
  return filas.filter((f) => f.some((c) => c.trim() !== ""));
}

// Acepta 2026-11-30 o 30/11/2026. Fechas imposibles (31/02) no pasan.
function fecha(t: string): FechaISO | null {
  const dmy = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(t);
  const iso = dmy
    ? `${dmy[3]}-${dmy[2].padStart(2, "0")}-${dmy[1].padStart(2, "0")}`
    : t;
  return esFechaISO(iso) ? iso : null;
}

export type Preparacion =
  | { ok: true; validas: FilaPreventivo[]; errores: ErrorFila[] }
  | { ok: false; error: string };

// Valida cada fila. Las malas se informan con su número (como en Excel: el encabezado es la fila 1).
export function prepararCsv(texto: string): Preparacion {
  const filas = leerCsv(texto);
  if (filas.length < 2) return { ok: false, error: "VACIO" };
  if (filas.length - 1 > LIMITES_CSV.filas) {
    return { ok: false, error: "DEMASIADAS_FILAS" };
  }
  const indice = new Map<Campo, number>();
  filas[0].forEach((h, i) => {
    const campo = ALIAS[clave(h)];
    if (campo && !indice.has(campo)) indice.set(campo, i);
  });
  for (const c of ["equipo", "plan", "tipo", "fecha", "responsable"] as const) {
    if (!indice.has(c)) return { ok: false, error: "COLUMNAS" };
  }

  const validas: FilaPreventivo[] = [];
  const errores: ErrorFila[] = [];
  const vistas = new Set<string>();
  filas.slice(1).forEach((celdas, i) => {
    const n = i + 2;
    const v = (c: Campo) => {
      const j = indice.get(c);
      return j === undefined ? "" : (celdas[j] ?? "").trim();
    };
    const valores = [...indice.keys()].map(v);
    const error = (motivo: string) => errores.push({ fila: n, motivo });
    if (celdas.length > filas[0].length) {
      return error(
        "Tiene más columnas que el encabezado (¿un número con coma? usa punto decimal).",
      );
    }
    if (valores.some((x) => FORMULA.test(x))) {
      return error("Tiene una fórmula o empieza con = + - @.");
    }
    if (valores.some((x) => x.length > 120 || !SIN_CONTROL.test(x))) {
      return error(
        "Algún texto es muy largo o tiene caracteres no permitidos.",
      );
    }
    const tipo = v("tipo").toUpperCase();
    const f = fecha(v("fecha"));
    const h = v("horometro") ? parsearHorometro(v("horometro")) : null;
    if (!v("equipo")) return error("Falta el código del equipo.");
    if (!v("plan")) return error("Falta el plan.");
    if (!TIPOS_PM.includes(tipo as TipoPM)) {
      return error("El tipo debe ser PM1, PM2, PM3 o PM4.");
    }
    if (!f) return error("Fecha no válida (usa 2026-11-30 o 30/11/2026).");
    if (v("horometro") && h === null) {
      return error("Horómetro no válido: número con punto decimal, sin comas.");
    }
    if (v("responsable").length < 2) return error("Falta el responsable.");
    const llave = `${clave(v("equipo"))}|${clave(v("plan"))}|${f}`;
    if (vistas.has(llave)) {
      return error("Repite equipo, plan y fecha de otra fila del archivo.");
    }
    vistas.add(llave);
    validas.push({
      fila: n,
      equipo: v("equipo"),
      plan: v("plan"),
      tipo: tipo as TipoPM,
      fecha: f,
      horometro: h,
      responsable: v("responsable"),
    });
  });
  return { ok: true, validas, errores };
}

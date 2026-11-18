import { strToU8, zipSync } from "fflate";
import { describe, expect, it, vi } from "vitest";
import type { CatalogosRepositorio } from "@/modules/catalogos/application/repositorios";
import { importarEquipos } from "@/modules/equipos/application/importar-equipos";
import type { EquiposRepositorio } from "@/modules/equipos/application/repositorios";
import {
  limpiarCelda,
  pareceXlsx,
  prepararImportacion,
  type Catalogos,
} from "@/modules/equipos/domain/importacion";
import type { Actor } from "@/shared/kernel/actor";
import { ok } from "@/shared/kernel/result";

vi.mock("server-only", () => ({}));
const { lectorExcel } =
  await import("@/modules/equipos/infrastructure/excel-lector");

const CAT = "0190a1b2-0000-7000-8000-0000000000c1";
const UBI = "0190a1b2-0000-7000-8000-0000000000d1";
const catalogos: Catalogos = {
  categorias: new Map([
    ["camion minero", CAT],
    ["volquete", CAT],
  ]),
  ubicaciones: new Map([["lomadas 4", UBI]]),
};
const ENC = [
  "Código",
  "Categoría",
  "Ubicación",
  "Marca",
  "Horómetro",
  "Estado",
];

describe("limpiarCelda", () => {
  it("neutraliza fórmulas y quita caracteres de control", () => {
    expect(limpiarCelda('=HYPERLINK("http://x","clic")')).toBe(
      'HYPERLINK("http://x","clic")',
    );
    expect(limpiarCelda("+cmd|' /C calc'!A0")).toBe("cmd|' /C calc'!A0");
    expect(limpiarCelda("@SUM(A1)")).toBe("SUM(A1)");
    expect(limpiarCelda("a\u0000b\tc\n d")).toBe("a b c d");
    expect(limpiarCelda(null)).toBe("");
    expect(limpiarCelda(1500)).toBe("1500");
    expect(limpiarCelda("x".repeat(5000))).toHaveLength(200);
  });
});

describe("prepararImportacion", () => {
  it("crea las válidas y reporta cada fila con error, con su número de Excel", () => {
    const r = prepararImportacion(
      [
        ENC,
        ["eq 01", "Camión Minero", "Lomadas 4", "CAT", 1500, "Operativo"],
        [],
        ["EQ-02", "VOLQUETE", "", "", "", ""],
        ["EQ01", "Volquete", "", "", "", ""],
        ["EQ-03", "Excavadora", "", "", "", ""],
        ["EQ-04", "Volquete", "", "", "mil", ""],
        ["EQ-05", "Volquete", "", "", -5, ""],
        ["EQ-06", "Volquete", "Marte", "", "", ""],
        ["EQ-07", "Volquete", "", "", "", "Roto"],
        ["EQ#08", "Volquete", "", "", "", ""],
        ["", "Volquete", "", "", "", ""],
        ["EQ-09", "Volquete", "", "<script>alert(1)</script>", "1e6", ""],
      ],
      catalogos,
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.validas.map((v) => [v.fila, v.equipo.codigo])).toEqual([
      [2, "EQ01"],
      [4, "EQ-02"],
    ]);
    expect(r.validas[0].equipo).toMatchObject({
      categoriaId: CAT,
      ubicacionId: UBI,
      marca: "CAT",
      horometro: 1500,
      estadoOperativo: "OPERATIVO",
    });
    expect(r.errores.map((e) => e.fila)).toEqual([
      5, 6, 7, 8, 9, 10, 11, 12, 13,
    ]);
    expect(r.errores[0].motivo).toContain("repetido (ya está en la fila 2)");
    expect(r.errores[1].motivo).toContain("«Excavadora» no existe");
  });

  it("columnas faltantes, archivo vacío y demasiadas filas rechazan el archivo entero", () => {
    const sinCat = prepararImportacion(
      [
        ["Código", "Marca"],
        ["E1", "x"],
      ],
      catalogos,
    );
    expect(!sinCat.ok && sinCat.error).toContain("CATEGORIA");
    expect(prepararImportacion([ENC], catalogos).ok).toBe(false);
    const muchas = Array.from({ length: 1001 }, (_, i) => [
      `E${i}`,
      "Volquete",
    ]);
    expect(prepararImportacion([ENC, ...muchas], catalogos).ok).toBe(false);
  });

  it("acepta encabezados con otra forma (FLOTA, N° serie)", () => {
    const r = prepararImportacion(
      [
        ["codigo ", "FLOTA", "N° Serie"],
        ["A1", "volquete", "S-9"],
      ],
      catalogos,
    );
    expect(r.ok && r.validas[0].equipo).toMatchObject({
      categoriaId: CAT,
      numeroSerie: "S-9",
    });
  });
});

// Un .xlsx mínimo de verdad (zip con sus XML), para probar el lector sin archivos externos.
function xlsx(
  filas: (string | number)[][],
  extra: Record<string, Uint8Array> = {},
) {
  const strings: string[] = [];
  const celda = (v: string | number, ref: string) => {
    if (typeof v === "number") return `<c r="${ref}"><v>${v}</v></c>`;
    strings.push(v);
    return `<c r="${ref}" t="s"><v>${strings.length - 1}</v></c>`;
  };
  const filasXml = filas
    .map(
      (f, i) =>
        `<row r="${i + 1}">${f.map((v, j) => celda(v, `${String.fromCharCode(65 + j)}${i + 1}`)).join("")}</row>`,
    )
    .join("");
  const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  return zipSync({
    "[Content_Types].xml": strToU8(
      '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/></Types>',
    ),
    "_rels/.rels": strToU8(
      '<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
    ),
    "xl/workbook.xml": strToU8(
      '<?xml version="1.0"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Hoja1" sheetId="1" r:id="rId1"/></sheets></workbook>',
    ),
    "xl/_rels/workbook.xml.rels": strToU8(
      '<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/></Relationships>',
    ),
    "xl/worksheets/sheet1.xml": strToU8(
      `<?xml version="1.0"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${filasXml}</sheetData></worksheet>`,
    ),
    "xl/sharedStrings.xml": strToU8(
      `<?xml version="1.0"?><sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">${strings.map((s) => `<si><t>${esc(s)}</t></si>`).join("")}</sst>`,
    ),
    ...extra,
  });
}

describe("lector de Excel", () => {
  it("lee un .xlsx real", async () => {
    const bytes = xlsx([ENC, ["EQ-01", "Volquete", "", "CAT", 1500, ""]]);
    expect(pareceXlsx(bytes)).toBe(true);
    const r = await lectorExcel.leer(bytes);
    expect(r.ok && r.value[1]).toEqual([
      "EQ-01",
      "Volquete",
      null,
      "CAT",
      1500,
      null,
    ]);
  });

  it("rechaza un zip bomb y un archivo que no es xlsx", async () => {
    // 60 MB de ceros comprimen a unos pocos KB: el índice del zip los delata sin descomprimir.
    const bomba = xlsx([ENC], {
      "xl/media/relleno.bin": new Uint8Array(60 * 1024 * 1024),
    });
    expect(bomba.length).toBeLessThan(2 * 1024 * 1024);
    const r = await lectorExcel.leer(bomba);
    expect(!r.ok && r.error.message).toBe("ZIP_SOSPECHOSO");
    expect(pareceXlsx(strToU8("codigo,categoria\nEQ1,Volquete"))).toBe(false);
    const roto = await lectorExcel.leer(strToU8("PK\u0003\u0004basura"));
    expect(roto.ok).toBe(false);
  });
});

describe("importarEquipos", () => {
  const planificador: Actor = {
    id: "u1",
    email: "p@a.pe",
    rol: "PLANIFICADOR",
    empresaId: "0190a1b2-0000-7000-8000-00000000000a",
    personaId: null,
    habilitado: true,
    motivo: null,
    debeCambiarClave: false,
  };
  const catalogosRepo = {
    listar: async (c: string) =>
      c === "categorias_equipo"
        ? [
            {
              id: CAT,
              activo: true,
              valores: { nombre: "Camión Minero", nombre_flota: "VOLQUETE" },
            },
            {
              id: "inactiva",
              activo: false,
              valores: { nombre: "Grúa", nombre_flota: null },
            },
          ]
        : [],
  } as unknown as CatalogosRepositorio;

  it("junta errores del archivo y de la base, ordenados por fila", async () => {
    const enviados: number[] = [];
    const equipos = {
      importar: async (filas: { fila: number }[]) => {
        enviados.push(...filas.map((f) => f.fila));
        return ok([
          { fila: 2, accion: "CREADO" as const },
          { fila: 3, error: "HOROMETRO_MENOR" as const },
        ]);
      },
    } as unknown as EquiposRepositorio;
    const excel = {
      leer: async () =>
        ok([
          ["Codigo", "Flota"],
          ["E1", "volquete"],
          ["E2", "Camión minero"],
          ["E3", "Grúa"],
        ]),
    };
    const r = await importarEquipos(planificador, xlsx([["x"]]), {
      equipos,
      catalogos: catalogosRepo,
      excel,
    });
    expect(enviados).toEqual([2, 3]);
    expect(r.ok && r.value.creados).toBe(1);
    expect(r.ok && r.value.errores.map((e) => e.fila)).toEqual([3, 4]);
  });

  it("rechaza archivo grande o que no es xlsx sin leerlo; supervisor no importa", async () => {
    let leido = false;
    const repos = {
      equipos: {} as EquiposRepositorio,
      catalogos: catalogosRepo,
      excel: { leer: async () => ((leido = true), ok([])) },
    };
    const grande = new Uint8Array(2 * 1024 * 1024 + 1);
    grande.set([0x50, 0x4b, 0x03, 0x04]);
    const g = await importarEquipos(planificador, grande, repos);
    expect(!g.ok && g.error.message).toBe("ARCHIVO_GRANDE");
    const csv = await importarEquipos(planificador, strToU8("a,b"), repos);
    expect(!csv.ok && csv.error.message).toBe("NO_XLSX");
    const s = await importarEquipos(
      { ...planificador, rol: "SUPERVISOR" },
      xlsx([["x"]]),
      repos,
    );
    expect(!s.ok && s.error.code).toBe("FORBIDDEN");
    expect(leido).toBe(false);
  });
});

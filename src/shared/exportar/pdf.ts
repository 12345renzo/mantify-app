// PDF de tabla (A4 horizontal, Helvetica) sin dependencias. Los contenidos van sin comprimir:
// el texto de cada fila queda legible dentro del archivo, lo que permite verificarlo en las pruebas.

export type ColumnaPdf = { titulo: string; ancho: number };
export type TablaPdf = {
  titulo: string;
  subtitulo?: string;
  columnas: ColumnaPdf[];
  filas: string[][];
};

const ANCHO = 842;
const ALTO = 595;
const MARGEN = 32;
const TAM = 7.5;
const LINEA = 13;

// Helvetica estándar trae solo WinAnsi (latín-1 + algunos signos): lo demás se cambia por "?".
const WIN_ANSI_EXTRA: Record<string, number> = {
  "€": 0x80,
  "‚": 0x82,
  "„": 0x84,
  "…": 0x85,
  "‘": 0x91,
  "’": 0x92,
  "“": 0x93,
  "”": 0x94,
  "•": 0x95,
  "–": 0x96,
  "—": 0x97,
};

function aWinAnsi(t: string): string {
  let s = "";
  for (const ch of t.normalize("NFC")) {
    const c = ch.codePointAt(0)!;
    const extra = WIN_ANSI_EXTRA[ch];
    if (extra !== undefined) s += String.fromCharCode(extra);
    else if ((c >= 0x20 && c <= 0x7e) || (c >= 0xa0 && c <= 0xff)) s += ch;
    else if (c === 0x09 || c === 0x0a || c === 0x0d) s += " ";
    else s += "?";
  }
  return s;
}

// Cadena literal de PDF: se escapan \ ( ) para que el contenido no cambie la estructura del archivo.
const literal = (t: string) =>
  `(${aWinAnsi(t).replace(/[\\()]/g, (m) => `\\${m}`)})`;

// Recorta al ancho de la columna (promedio de Helvetica ≈ 0,52 em).
function recortar(t: string, ancho: number): string {
  const max = Math.max(1, Math.floor((ancho - 4) / (TAM * 0.52)));
  const una = t.replace(/\s+/g, " ").trim();
  return una.length > max ? `${una.slice(0, max - 1)}…` : una;
}

function pagina(
  t: TablaPdf,
  filas: string[][],
  numero: number,
  total: number,
): string {
  const ops: string[] = [];
  const texto = (x: number, y: number, s: string, tam = TAM, negrita = false) =>
    ops.push(
      `BT /${negrita ? "F2" : "F1"} ${tam} Tf ${x.toFixed(1)} ${y.toFixed(1)} Td ${literal(s)} Tj ET`,
    );
  let y = ALTO - MARGEN - 12;
  texto(MARGEN, y, t.titulo, 13, true);
  if (t.subtitulo) texto(MARGEN, y - 15, t.subtitulo, 8.5);
  texto(ANCHO - MARGEN - 60, MARGEN - 12, `Página ${numero} de ${total}`, 7);
  y -= 38;
  const fila = (celdas: string[], negrita: boolean) => {
    let x = MARGEN;
    t.columnas.forEach((c, i) => {
      texto(x + 2, y, recortar(celdas[i] ?? "", c.ancho), TAM, negrita);
      x += c.ancho;
    });
    ops.push(
      `0.85 G 0.5 w ${MARGEN} ${(y - 4).toFixed(1)} m ${x} ${(y - 4).toFixed(1)} l S`,
    );
    y -= LINEA;
  };
  fila(
    t.columnas.map((c) => c.titulo),
    true,
  );
  for (const f of filas) fila(f, false);
  if (filas.length === 0) texto(MARGEN, y, "Sin registros.", TAM);
  return ops.join("\n");
}

export function crearPdf(t: TablaPdf): Uint8Array {
  const porPagina = Math.floor((ALTO - 2 * MARGEN - 60) / LINEA);
  const grupos: string[][][] = [];
  for (let i = 0; i < Math.max(1, t.filas.length); i += porPagina) {
    grupos.push(t.filas.slice(i, i + porPagina));
  }
  // Objetos: 1 catálogo, 2 páginas, 3-4 fuentes, luego (página, contenido) por cada hoja.
  const objetos: string[] = [];
  const kids = grupos.map((_, i) => `${5 + i * 2} 0 R`).join(" ");
  objetos.push("<< /Type /Catalog /Pages 2 0 R >>");
  objetos.push(`<< /Type /Pages /Kids [${kids}] /Count ${grupos.length} >>`);
  objetos.push(
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
  );
  objetos.push(
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>",
  );
  grupos.forEach((g, i) => {
    const contenido = pagina(t, g, i + 1, grupos.length);
    objetos.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${ANCHO} ${ALTO}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${6 + i * 2} 0 R >>`,
    );
    objetos.push(
      `<< /Length ${contenido.length} >>\nstream\n${contenido}\nendstream`,
    );
  });
  // Todo es de un byte por carácter (WinAnsi), así que las posiciones del xref son índices del texto.
  let pdf = "%PDF-1.4\n%\xE2\xE3\xCF\xD3\n";
  const posiciones: number[] = [];
  objetos.forEach((o, i) => {
    posiciones.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objetos.length + 1}\n0000000000 65535 f \n`;
  for (const p of posiciones)
    pdf += `${String(p).padStart(10, "0")} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objetos.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  const bytes = new Uint8Array(pdf.length);
  for (let i = 0; i < pdf.length; i++) bytes[i] = pdf.charCodeAt(i) & 0xff;
  return bytes;
}

// Para pruebas: el texto de una fila tal como queda en el PDF.
export const textoPdf = (t: string) => literal(t);

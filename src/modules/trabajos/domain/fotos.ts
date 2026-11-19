// Fotos "antes" y "después" por backlog, y la firma: imágenes de hasta 2 MB.
export const MAX_FOTOS = 3;
export const MAX_BYTES_IMAGEN = 2 * 1024 * 1024;

export type TipoImagen = {
  mime: "image/jpeg" | "image/png" | "image/webp";
  ext: "jpg" | "png" | "webp";
};

// Tipo real por la firma binaria del archivo, no por la extensión ni por lo que diga el navegador.
export function tipoImagen(b: Uint8Array): TipoImagen | null {
  if (b.length < 12) return null;
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) {
    return { mime: "image/jpeg", ext: "jpg" };
  }
  if (
    b[0] === 0x89 &&
    b[1] === 0x50 &&
    b[2] === 0x4e &&
    b[3] === 0x47 &&
    b[4] === 0x0d &&
    b[5] === 0x0a &&
    b[6] === 0x1a &&
    b[7] === 0x0a
  ) {
    return { mime: "image/png", ext: "png" };
  }
  const ascii = (i: number, n: number) =>
    String.fromCharCode(...b.slice(i, i + n));
  if (ascii(0, 4) === "RIFF" && ascii(8, 4) === "WEBP") {
    return { mime: "image/webp", ext: "webp" };
  }
  return null;
}

// Medidas razonables: ni un píxel suelto como firma, ni imágenes gigantes que revienten la memoria al abrirlas.
export const MAX_LADO = 8000;
export const MIN_FIRMA = { ancho: 100, alto: 30 };

const u16 = (b: Uint8Array, i: number) => (b[i] << 8) | b[i + 1];
const u32 = (b: Uint8Array, i: number) =>
  ((b[i] << 24) | (b[i + 1] << 16) | (b[i + 2] << 8) | b[i + 3]) >>> 0;
const u32le = (b: Uint8Array, i: number) =>
  (b[i] | (b[i + 1] << 8) | (b[i + 2] << 16) | (b[i + 3] << 24)) >>> 0;
const ascii = (b: Uint8Array, i: number, n: number) =>
  String.fromCharCode(...b.slice(i, i + n));

// Lee ancho y alto del encabezado y exige que el archivo termine donde dice su formato:
// un archivo cortado, o con otra cosa pegada al final (HTML, un zip, un script), devuelve null.
export function medidasImagen(
  b: Uint8Array,
  tipo: TipoImagen,
): { ancho: number; alto: number } | null {
  if (tipo.mime === "image/png") {
    if (b.length < 45 || ascii(b, 12, 4) !== "IHDR") return null;
    if (ascii(b, b.length - 8, 4) !== "IEND") return null;
    return { ancho: u32(b, 16), alto: u32(b, 20) };
  }
  if (tipo.mime === "image/jpeg") {
    if (b[b.length - 2] !== 0xff || b[b.length - 1] !== 0xd9) return null;
    // Recorre los segmentos hasta el SOF (marcadores C0–CF salvo C4, C8 y CC).
    let i = 2;
    while (i + 9 < b.length) {
      if (b[i] !== 0xff) return null;
      const m = b[i + 1];
      if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) {
        return { ancho: u16(b, i + 7), alto: u16(b, i + 5) };
      }
      i += 2 + u16(b, i + 2);
    }
    return null;
  }
  // WEBP: el tamaño del contenedor RIFF debe cubrir el archivo entero.
  if (b.length < 30 || u32le(b, 4) + 8 !== b.length) return null;
  const trozo = ascii(b, 12, 4);
  if (trozo === "VP8X") {
    const u24 = (i: number) => b[i] | (b[i + 1] << 8) | (b[i + 2] << 16);
    return { ancho: 1 + u24(24), alto: 1 + u24(27) };
  }
  if (trozo === "VP8 ") {
    return {
      ancho: (b[26] | (b[27] << 8)) & 0x3fff,
      alto: (b[28] | (b[29] << 8)) & 0x3fff,
    };
  }
  if (trozo === "VP8L" && b[20] === 0x2f) {
    return {
      ancho: 1 + (((b[22] & 0x3f) << 8) | b[21]),
      alto: 1 + (((b[24] & 0x0f) << 10) | (b[23] << 2) | ((b[22] & 0xc0) >> 6)),
    };
  }
  return null;
}

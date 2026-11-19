import { crc32, deflateSync } from "node:zlib";

// PNG real (blanco, RGB) que cualquier navegador puede abrir.
export function png(ancho: number, alto: number): Uint8Array {
  const trozo = (tipo: string, datos: Buffer) => {
    const largo = Buffer.alloc(4);
    largo.writeUInt32BE(datos.length);
    const cuerpo = Buffer.concat([Buffer.from(tipo, "ascii"), datos]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(cuerpo));
    return Buffer.concat([largo, cuerpo, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(ancho, 0);
  ihdr.writeUInt32BE(alto, 4);
  ihdr.set([8, 2, 0, 0, 0], 8);
  const fila = Buffer.concat([Buffer.from([0]), Buffer.alloc(ancho * 3, 255)]);
  return new Uint8Array(
    Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      trozo("IHDR", ihdr),
      trozo("IDAT", deflateSync(Buffer.concat(Array(alto).fill(fila)))),
      trozo("IEND", Buffer.alloc(0)),
    ]),
  );
}

// Esqueleto JPEG (SOI, APP0, SOF0, EOI): basta para leer firma binaria y medidas.
export function jpg(ancho: number, alto: number): Uint8Array {
  return new Uint8Array([
    0xff,
    0xd8,
    0xff,
    0xe0,
    0x00,
    0x10,
    ...Buffer.from("JFIF\0"),
    1,
    1,
    0,
    0,
    1,
    0,
    1,
    0,
    0,
    0xff,
    0xc0,
    0x00,
    0x11,
    8,
    alto >> 8,
    alto & 255,
    ancho >> 8,
    ancho & 255,
    3,
    1,
    0x22,
    0,
    2,
    0x11,
    1,
    3,
    0x11,
    1,
    0xff,
    0xd9,
  ]);
}

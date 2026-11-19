// Las fotos del celular pesan 3–6 MB: se reducen en el navegador a JPEG de 1600 px antes de enviarlas.
// Si el navegador no puede leerla (p. ej. HEIC), se envía tal cual y el servidor la rechaza con un mensaje.
export async function comprimirImagen(
  archivo: File,
  lado = 1600,
  calidad = 0.82,
): Promise<File> {
  try {
    const bmp = await createImageBitmap(archivo);
    const k = Math.min(1, lado / Math.max(bmp.width, bmp.height));
    const lienzo = document.createElement("canvas");
    lienzo.width = Math.round(bmp.width * k);
    lienzo.height = Math.round(bmp.height * k);
    lienzo.getContext("2d")?.drawImage(bmp, 0, 0, lienzo.width, lienzo.height);
    bmp.close();
    const blob = await new Promise<Blob | null>((r) =>
      lienzo.toBlob(r, "image/jpeg", calidad),
    );
    return blob
      ? new File([blob], "foto.jpg", { type: "image/jpeg" })
      : archivo;
  } catch {
    return archivo;
  }
}

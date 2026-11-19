"use client";

import { useActionState, useEffect, useState } from "react";
import { MAX_BYTES_IMAGEN, MIN_FIRMA } from "@/modules/trabajos/domain/fotos";
import { Campo } from "@/shared/ui/campo";
import { boton, campo } from "@/shared/ui/estilos";
import { Modal } from "@/shared/ui/modal";
import {
  guardarFirmaAction,
  miFirmaAction,
  type EstadoTrabajo,
} from "./actions";

// Botón + modal, para los avisos de "necesitas tu firma".
export function ModalFirma() {
  const [abierto, setAbierto] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className={boton.secundario}
      >
        Subir mi firma
      </button>
      <PanelFirma abierto={abierto} onCerrar={() => setAbierto(false)} />
    </>
  );
}

export function PanelFirma({
  abierto,
  onCerrar,
}: {
  abierto: boolean;
  onCerrar: () => void;
}) {
  return (
    <Modal
      abierto={abierto}
      onCerrar={onCerrar}
      titulo="Mi firma"
      descripcion="Se copia en cada cierre y validación que hagas. Sube una foto o escaneo de tu firma en papel blanco, bien recortada."
    >
      {abierto && <FormFirma onCerrar={onCerrar} />}
    </Modal>
  );
}

const TIPOS = ["image/png", "image/jpeg"];
// Antes de procesarla en el navegador; lo que llega al servidor ya es un PNG reducido.
const MAX_ORIGINAL = 10 * 1024 * 1024;
const ANCHO_MAX = 1000;

// Vuelve a dibujar la imagen sobre fondo blanco y la guarda como PNG nuevo: se quedan solo los
// píxeles (sin metadatos, ubicación GPS ni nada pegado al archivo) y el fondo transparente queda blanco.
async function prepararFirma(archivo: File): Promise<Blob | string> {
  if (!TIPOS.includes(archivo.type)) return "Solo imágenes PNG o JPG.";
  if (archivo.size > MAX_ORIGINAL) return "La imagen pesa más de 10 MB.";
  let bmp: ImageBitmap;
  try {
    bmp = await createImageBitmap(archivo);
  } catch {
    return "No se pudo leer la imagen. Prueba con otra en PNG o JPG.";
  }
  if (bmp.width < MIN_FIRMA.ancho || bmp.height < MIN_FIRMA.alto) {
    bmp.close();
    return `La imagen es muy pequeña (mínimo ${MIN_FIRMA.ancho}×${MIN_FIRMA.alto} px).`;
  }
  const k = Math.min(1, ANCHO_MAX / bmp.width);
  const lienzo = document.createElement("canvas");
  lienzo.width = Math.round(bmp.width * k);
  lienzo.height = Math.max(MIN_FIRMA.alto, Math.round(bmp.height * k));
  const c = lienzo.getContext("2d");
  if (!c) return "Tu navegador no pudo procesar la imagen.";
  c.fillStyle = "#fff";
  c.fillRect(0, 0, lienzo.width, lienzo.height);
  c.drawImage(bmp, 0, 0, lienzo.width, lienzo.height);
  bmp.close();
  const blob = await new Promise<Blob | null>((r) =>
    lienzo.toBlob(r, "image/png"),
  );
  if (!blob) return "Tu navegador no pudo procesar la imagen.";
  if (blob.size > MAX_BYTES_IMAGEN)
    return "La imagen queda muy pesada. Recórtala más.";
  return blob;
}

function FormFirma({ onCerrar }: { onCerrar: () => void }) {
  const [actual, setActual] = useState<string | null>(null);
  const [lista, setLista] = useState<{ blob: Blob; vista: string } | null>(
    null,
  );
  const [aviso, setAviso] = useState<string | null>(null);
  const [estado, enviar, pendiente] = useActionState<EstadoTrabajo, FormData>(
    async (previo, fd) => {
      const r = await guardarFirmaAction(previo, fd);
      if (r.exito) onCerrar();
      return r;
    },
    {},
  );

  useEffect(() => {
    let vivo = true;
    miFirmaAction().then((url) => vivo && setActual(url));
    return () => {
      vivo = false;
    };
  }, []);

  // La vista previa usa una URL local; se libera al cambiarla o cerrar.
  useEffect(
    () => () => {
      if (lista) URL.revokeObjectURL(lista.vista);
    },
    [lista],
  );

  async function elegir(archivo: File | undefined) {
    setLista(null);
    setAviso(null);
    if (!archivo) return;
    const r = await prepararFirma(archivo);
    if (typeof r === "string") setAviso(r);
    else setLista({ blob: r, vista: URL.createObjectURL(r) });
  }

  function guardar() {
    if (!lista) return;
    const fd = new FormData();
    fd.append(
      "firma",
      new File([lista.blob], "firma.png", { type: "image/png" }),
    );
    enviar(fd);
  }

  return (
    <form action={guardar}>
      <div className="flex flex-col gap-5 p-6">
        {actual && !lista && (
          <div>
            <p className="mb-1.5 text-xs text-muted">Firma actual</p>
            {/* eslint-disable-next-line @next/next/no-img-element -- URL firmada de vida corta */}
            <img
              src={actual}
              alt="Tu firma actual"
              className="h-24 max-w-full rounded-lg border border-border bg-white object-contain"
            />
          </div>
        )}
        <Campo
          id="firma"
          label={actual ? "Reemplazar firma" : "Imagen de tu firma"}
          error={aviso ?? estado.error}
          ayuda={`PNG o JPG. Mínimo ${MIN_FIRMA.ancho}×${MIN_FIRMA.alto} px.`}
        >
          <input
            id="firma"
            type="file"
            accept="image/png,image/jpeg"
            onChange={(e) => elegir(e.currentTarget.files?.[0])}
            className={`${campo} file:mr-3 file:rounded-lg file:border-0 file:bg-surface-2 file:px-3 file:py-1 file:text-sm`}
          />
        </Campo>
        {lista && (
          <div>
            <p className="mb-1.5 text-xs text-muted">Así se verá</p>
            {/* eslint-disable-next-line @next/next/no-img-element -- vista previa local (blob:) */}
            <img
              src={lista.vista}
              alt="Vista previa de tu firma"
              className="h-24 max-w-full rounded-lg border border-border bg-white object-contain"
            />
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border px-6 py-4">
        <button type="button" onClick={onCerrar} className={boton.secundario}>
          Cancelar
        </button>
        <button
          type="submit"
          disabled={pendiente || !lista}
          className={boton.primario}
        >
          {pendiente ? "Guardando…" : "Guardar firma"}
        </button>
      </div>
    </form>
  );
}

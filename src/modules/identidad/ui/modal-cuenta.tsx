"use client";

import { useRouter } from "next/navigation";
import { useState, type ComponentProps } from "react";
import { boton } from "@/shared/ui/estilos";
import { IconoMas } from "@/shared/ui/iconos";
import { Modal } from "@/shared/ui/modal";
import { FormularioCuenta } from "./formulario-cuenta";

type Props = Omit<ComponentProps<typeof FormularioCuenta>, "onListo"> & {
  textoDisparador: string;
  titulo: string;
  descripcion: string;
  // "boton": botón primario con +. "enlace": texto, para usar dentro de una tabla.
  estilo?: "boton" | "enlace";
};

export function ModalCuenta({
  textoDisparador,
  titulo,
  descripcion,
  estilo = "boton",
  ...formulario
}: Props) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [vez, setVez] = useState(0);

  // Al cerrar se recarga la lista (cupo, cuentas). No antes: se perdería la clave en pantalla.
  const cerrar = () => {
    setAbierto(false);
    router.refresh();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setVez((n) => n + 1);
          setAbierto(true);
        }}
        className={
          estilo === "boton"
            ? boton.primario
            : "rounded-md border border-primary/20 bg-primary-soft px-2 py-1 text-xs font-semibold text-primary transition-colors hover:border-primary/35 hover:bg-primary-soft/70"
        }
      >
        {estilo === "boton" && <IconoMas width={18} height={18} />}
        {textoDisparador}
      </button>
      <Modal
        abierto={abierto}
        onCerrar={cerrar}
        titulo={titulo}
        descripcion={descripcion}
      >
        <FormularioCuenta key={vez} {...formulario} onListo={cerrar} />
      </Modal>
    </>
  );
}

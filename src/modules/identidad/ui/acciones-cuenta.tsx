import type { ComponentProps } from "react";
import { boton } from "@/shared/ui/estilos";
import type { CuentaFila } from "../application/consultas";
import { BotonDesactivarCuenta } from "./boton-desactivar-cuenta";
import { ModalCuenta } from "./modal-cuenta";

type AccionCuenta = ComponentProps<typeof ModalCuenta>["accion"];

// Qué se puede hacer con una cuenta, igual para el planificador y el superadmin:
// activa → Desactivar (y Asignar personal si quedó libre); inactiva → Reactivar con persona.
export function AccionesCuenta({
  cuenta: c,
  etiquetaRol,
  personasLibres,
  conCupo,
  acciones,
}: {
  cuenta: CuentaFila;
  etiquetaRol: string;
  personasLibres: { id: string; nombre: string }[];
  conCupo: boolean;
  acciones: {
    asignar: AccionCuenta;
    desactivar: ComponentProps<typeof BotonDesactivarCuenta>["accion"];
  };
}) {
  if (!c.activa) {
    return conCupo ? (
      <ModalCuenta
        estilo="enlace"
        textoDisparador="Reactivar"
        titulo="Reactivar cuenta"
        descripcion={`Cuenta de ${etiquetaRol}. Elige la persona que la usará; la contraseña se genera y se muestra una sola vez.`}
        accion={acciones.asignar}
        modo={{ tipo: "asignar", cuentaId: c.id, correo: c.correo }}
        personasLibres={personasLibres}
        textoBoton="Reactivar y generar contraseña"
      />
    ) : (
      <span
        className={`${boton.secundario} cursor-not-allowed px-2 py-1 text-xs opacity-50`}
        title="Sin cupo en el plan"
      >
        Sin cupo
      </span>
    );
  }
  return (
    <>
      {!c.persona && (
        <ModalCuenta
          estilo="enlace"
          textoDisparador="Asignar personal"
          titulo="Asignar cuenta"
          descripcion={`Cuenta de ${etiquetaRol}, antes ${c.correo}. Recibe correo y contraseña nuevos; los anteriores dejan de servir.`}
          accion={acciones.asignar}
          modo={{ tipo: "asignar", cuentaId: c.id }}
          personasLibres={personasLibres}
          textoBoton="Asignar y generar contraseña"
        />
      )}
      <BotonDesactivarCuenta
        cuentaId={c.id}
        datos={{
          correo: c.correo,
          rol: etiquetaRol,
          persona: c.persona?.nombre ?? null,
        }}
        accion={acciones.desactivar}
      />
    </>
  );
}

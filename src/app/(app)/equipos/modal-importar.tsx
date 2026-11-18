"use client";

import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { boton, campo } from "@/shared/ui/estilos";
import { useModal } from "@/shared/ui/formulario-modal";
import { Modal } from "@/shared/ui/modal";
import { importarAction, type EstadoImportacion } from "./actions";

const COLUMNAS: [string, string][] = [
  ["CODIGO", "Obligatoria. Si ya existe, el equipo se actualiza."],
  [
    "CATEGORIA o FLOTA",
    "Obligatoria. Nombre o nombre de flota de la categoría.",
  ],
  ["UBICACION", "Opcional. Nombre de una ubicación activa."],
  ["MARCA, MODELO, SERIE", "Opcionales."],
  ["HOROMETRO", "Opcional. Número; no puede ser menor que el actual."],
  ["ESTADO", "Opcional. Operativo, Inoperativo o En mantenimiento."],
  ["ID_EXTERNO", "Opcional. Código en otro sistema."],
];

export function ModalImportar() {
  const router = useRouter();
  const m = useModal();
  const cerrar = () => {
    m.cerrar();
    router.refresh();
  };
  return (
    <>
      <button type="button" onClick={m.abrir} className={boton.secundario}>
        Importar Excel
      </button>
      <Modal
        abierto={m.abierto}
        onCerrar={cerrar}
        titulo="Importar equipos desde Excel"
        descripcion="Crea los equipos nuevos y actualiza los existentes por código. Las filas con error se informan sin detener el resto."
      >
        <FormImportar key={m.vez} onCerrar={cerrar} />
      </Modal>
    </>
  );
}

function FormImportar({ onCerrar }: { onCerrar: () => void }) {
  const [estado, enviar, pendiente] = useActionState<
    EstadoImportacion,
    FormData
  >(importarAction, {});

  if (estado.resumen) {
    const { creados, actualizados, errores } = estado.resumen;
    return (
      <div className="flex flex-col gap-4 p-6">
        <div className="grid gap-3 sm:grid-cols-3">
          <Cifra valor={creados} texto="creados" color="text-ok" />
          <Cifra
            valor={actualizados}
            texto="actualizados"
            color="text-primary"
          />
          <Cifra
            valor={errores.length}
            texto="con error"
            color={errores.length ? "text-bad" : "text-muted"}
          />
        </div>
        {errores.length > 0 && (
          <div className="max-h-64 overflow-y-auto rounded-lg border border-bad/30">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-bad-soft text-left">
                <tr>
                  <th className="px-4 py-2 text-xs font-semibold text-bad">
                    Fila
                  </th>
                  <th className="px-4 py-2 text-xs font-semibold text-bad">
                    Motivo
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {errores.map((e) => (
                  <tr key={`${e.fila}-${e.motivo}`}>
                    <td className="px-4 py-2 font-mono tabular-nums">
                      {e.fila}
                    </td>
                    <td className="px-4 py-2">{e.motivo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <button
          type="button"
          onClick={onCerrar}
          className={`${boton.primario} self-end`}
        >
          Listo
        </button>
      </div>
    );
  }

  return (
    <form action={enviar}>
      <div className="flex flex-col gap-5 p-6">
        <div>
          <label htmlFor="archivo" className="mb-1.5 block text-sm font-medium">
            Archivo .xlsx{" "}
            <span className="font-normal text-muted">
              (máx. 2 MB, 1000 equipos)
            </span>
          </label>
          <input
            id="archivo"
            name="archivo"
            type="file"
            required
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className={`${campo} file:mr-3 file:rounded-md file:border-0 file:bg-surface-2 file:px-3 file:py-1 file:text-sm file:font-medium`}
          />
        </div>
        <div className="rounded-lg bg-surface-2 p-4 text-sm">
          <p className="font-medium">
            Primera fila: encabezados. Columnas que se leen:
          </p>
          <dl className="mt-2 grid gap-x-4 gap-y-1.5 sm:grid-cols-[auto_1fr]">
            {COLUMNAS.map(([col, ayuda]) => (
              <div key={col} className="contents">
                <dt className="font-mono text-xs font-semibold">{col}</dt>
                <dd className="text-muted">{ayuda}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border px-6 py-4">
        {estado.error && (
          <p className="mr-auto text-sm text-bad" aria-live="polite">
            {estado.error}
          </p>
        )}
        <button type="button" onClick={onCerrar} className={boton.secundario}>
          Cancelar
        </button>
        <button type="submit" disabled={pendiente} className={boton.primario}>
          {pendiente ? "Importando…" : "Importar"}
        </button>
      </div>
    </form>
  );
}

function Cifra({
  valor,
  texto,
  color,
}: {
  valor: number;
  texto: string;
  color: string;
}) {
  return (
    <div className="rounded-lg border border-border p-4 text-center">
      <p className={`font-mono text-2xl font-semibold tabular-nums ${color}`}>
        {valor}
      </p>
      <p className="text-sm text-muted">{texto}</p>
    </div>
  );
}

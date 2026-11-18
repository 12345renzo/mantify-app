import "server-only";
import { unzipSync } from "fflate";
import { readSheet } from "read-excel-file/node";
import { DomainError } from "@/shared/kernel/errors";
import { err, ok } from "@/shared/kernel/result";
import { LIMITES_IMPORTACION } from "../domain/importacion";
import type { LectorExcel } from "../application/repositorios";

// Antes de leer, revisa el índice del zip sin descomprimir nada: si declara demasiadas entradas
// o demasiados bytes, es un archivo armado para agotar memoria (zip bomb) y se rechaza.
function zipSeguro(bytes: Uint8Array): boolean {
  let total = 0;
  let entradas = 0;
  try {
    unzipSync(bytes, {
      filter: (f) => {
        entradas++;
        total += f.originalSize;
        return false;
      },
    });
  } catch {
    return false;
  }
  return (
    entradas > 0 &&
    entradas <= LIMITES_IMPORTACION.entradasZip &&
    total <= LIMITES_IMPORTACION.descomprimido
  );
}

// read-excel-file solo lee valores: no ejecuta macros ni fórmulas (usa el valor ya calculado).
export const lectorExcel: LectorExcel = {
  async leer(bytes) {
    if (!zipSeguro(bytes)) {
      return err(new DomainError("VALIDATION", "ZIP_SOSPECHOSO"));
    }
    try {
      const filas = await readSheet(Buffer.from(bytes));
      return ok(filas as unknown[][]);
    } catch {
      return err(new DomainError("VALIDATION", "XLSX_DANADO"));
    }
  },
};

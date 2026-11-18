import { DomainError } from "@/shared/kernel/errors";
import { err, ok, type Result } from "@/shared/kernel/result";

// Tope razonable (mismo CHECK de la base). Un millón de horas son más de 100 años de uso continuo.
export const HOROMETRO_MAX = 1_000_000;

// Acepta "1500" y "1500.5" (punto decimal, como en Perú). Rechaza NaN, Infinity, notación
// científica, signos y comas: "1,500" se rechaza en vez de leerse como 1.5.
export function parsearHorometro(texto: string): number | null {
  const t = texto.trim();
  if (!/^\d{1,7}(\.\d{1,2})?$/.test(t)) return null;
  const n = Number(t);
  return n <= HOROMETRO_MAX ? n : null;
}

// Solo sube. Igual se acepta (otra lectura del mismo día). Bajar solo con corrección y motivo.
export function validarLectura(
  actual: number,
  nueva: number,
  esCorreccion: boolean,
  motivo: string | null,
): Result<void> {
  if (!Number.isFinite(nueva) || nueva < 0 || nueva > HOROMETRO_MAX) {
    return err(new DomainError("VALIDATION", "valor fuera de rango"));
  }
  if (esCorreccion) {
    if (!motivo || motivo.trim().length < 5) {
      return err(new DomainError("VALIDATION", "la corrección exige motivo"));
    }
    if (nueva >= actual) {
      return err(
        new DomainError("VALIDATION", "una corrección debe bajar el horómetro"),
      );
    }
    return ok(undefined);
  }
  if (nueva < actual) {
    return err(new DomainError("VALIDATION", "lectura menor que la actual"));
  }
  return ok(undefined);
}

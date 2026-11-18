import type { Result } from "@/shared/kernel/result";
import { exigirSuperadmin, type Actor } from "@/shared/kernel/actor";
import type { CambiarPrecioEntrada } from "./esquemas";
import type { PlanesRepositorio } from "./repositorios";

// El nuevo precio aplica a los pagos que se registren desde ahora; las membresías ya pagadas guardan su monto.
// shortcut: sin aviso por correo a las empresas; llega con el envío de avisos (corte 11).
export async function cambiarPrecioPlan(
  actor: Actor | null,
  entrada: CambiarPrecioEntrada,
  repos: { planes: PlanesRepositorio },
): Promise<Result<void>> {
  const permiso = exigirSuperadmin(actor);
  if (!permiso.ok) return permiso;
  return repos.planes.cambiarPrecio(entrada.planId, entrada.precioMensual);
}

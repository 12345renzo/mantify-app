import { exigirSuperadminEnPagina } from "@/modules/acceso/infrastructure/sesion";
import { reposPlataforma } from "@/modules/plataforma/infrastructure";
import { boton } from "@/shared/ui/estilos";
import { IconoMas } from "@/shared/ui/iconos";
import { ModalNuevaEmpresa } from "./modal-nueva-empresa";

// Los planes se leen con la sesión, así que el botón va dentro de un <Suspense>.
export async function BotonNuevaEmpresa({ texto }: { texto?: string }) {
  await exigirSuperadminEnPagina();
  const { lector } = await reposPlataforma();
  return (
    <ModalNuevaEmpresa planes={await lector.listarPlanes()} texto={texto} />
  );
}

export function BotonNuevaEmpresaCargando() {
  return (
    <span className={`${boton.primario} opacity-60`} aria-busy="true">
      <IconoMas width={18} height={18} />
      Nueva empresa
    </span>
  );
}

import type { ComponentType, SVGProps } from "react";
import {
  IconoCalendario,
  IconoCatalogo,
  IconoEmpresa,
  IconoEquipo,
  IconoGota,
  IconoLlave,
  IconoNeumatico,
  IconoPanel,
  IconoParada,
  IconoPersonas,
  IconoPlanes,
  IconoReporte,
} from "@/shared/ui/iconos";

export type ItemNav = {
  etiqueta: string;
  descripcion: string;
  icono: ComponentType<SVGProps<SVGSVGElement>>;
  // Variable CSS del color del módulo (globals.css).
  color: string;
  href?: string;
  // Corte en que llega el módulo. Sin href = todavía no disponible.
  corte?: number;
  // Roles que lo ven. Sin lista: todos (los módulos futuros se muestran como "Pronto").
  roles?: readonly string[];
  // false: no sale en el menú lateral (se llega desde el perfil), pero sí en la ubicación.
  enMenu?: boolean;
};

const SOLO_SUPERADMIN = ["SUPERADMIN"] as const;
const ROLES_EMPRESA = [
  "PLANIFICADOR",
  "SUPERVISOR",
  "TECNICO",
  "GERENTE",
] as const;

export type GrupoNav = { titulo: string; items: ItemNav[] };

export const NAVEGACION: GrupoNav[] = [
  {
    titulo: "General",
    items: [
      {
        etiqueta: "Inicio",
        descripcion: "Tu resumen en Mantify.",
        icono: IconoPanel,
        color: "var(--mod-plataforma)",
        href: "/inicio",
        roles: ROLES_EMPRESA,
      },
    ],
  },
  {
    titulo: "Plataforma",
    items: [
      {
        etiqueta: "Panel",
        descripcion: "Resumen de empresas y membresías.",
        icono: IconoPanel,
        color: "var(--mod-plataforma)",
        href: "/panel",
        roles: SOLO_SUPERADMIN,
      },
      {
        etiqueta: "Empresas",
        descripcion: "Alta con RUC, pagos y estado.",
        icono: IconoEmpresa,
        color: "var(--mod-plataforma)",
        href: "/empresas",
        roles: SOLO_SUPERADMIN,
      },
      {
        etiqueta: "Planes y precios",
        descripcion: "Precio mensual de cada plan.",
        icono: IconoPlanes,
        color: "var(--mod-plataforma)",
        href: "/tarifas",
        roles: SOLO_SUPERADMIN,
      },
    ],
  },
  {
    titulo: "Operación",
    items: [
      {
        etiqueta: "Equipos",
        descripcion: "Flota, movilización y horómetro.",
        icono: IconoEquipo,
        color: "var(--mod-equipos)",
        href: "/equipos",
        // El técnico no ve el estado de la flota.
        roles: ["PLANIFICADOR", "SUPERVISOR", "GERENTE"],
      },
      {
        etiqueta: "Backlogs y OT",
        descripcion: "OT, RM, RQ, firmas y validación.",
        icono: IconoLlave,
        color: "var(--mod-mantenimiento)",
        href: "/trabajos",
        roles: ROLES_EMPRESA,
      },
      {
        etiqueta: "Preventivos",
        descripcion: "PM1 a PM4 con alerta a 7 días.",
        icono: IconoCalendario,
        color: "var(--mod-preventivos)",
        href: "/preventivos",
        roles: ROLES_EMPRESA,
      },
      {
        etiqueta: "Paradas",
        descripcion: "Paradas, reporte diario y ranking.",
        icono: IconoParada,
        color: "var(--mod-paradas)",
        href: "/paradas",
        roles: ROLES_EMPRESA,
      },
    ],
  },
  {
    titulo: "Control",
    items: [
      {
        etiqueta: "Engrase",
        descripcion: "Puntos por equipo y umbral.",
        icono: IconoGota,
        color: "var(--mod-engrase)",
        href: "/engrase",
        roles: ROLES_EMPRESA,
      },
      {
        etiqueta: "Neumáticos",
        descripcion: "Montajes, mediciones y salud.",
        icono: IconoNeumatico,
        color: "var(--mod-neumaticos)",
        corte: 9,
      },
    ],
  },
  {
    titulo: "Gestión",
    items: [
      {
        etiqueta: "Personal y cuentas",
        descripcion: "Personas, cuentas y accesos.",
        icono: IconoPersonas,
        color: "var(--mod-personas)",
        href: "/personal",
        roles: ["PLANIFICADOR", "GERENTE"],
      },
      {
        etiqueta: "Catálogos",
        descripcion: "Listas editables por empresa.",
        icono: IconoCatalogo,
        color: "var(--mod-catalogos)",
        href: "/catalogos",
        roles: ROLES_EMPRESA,
      },
      {
        etiqueta: "Reportes",
        descripcion: "Dashboard, PDF y Excel.",
        icono: IconoReporte,
        color: "var(--mod-reportes)",
        corte: 10,
      },
    ],
  },
];

export function veItem(item: ItemNav, rol: string | null): boolean {
  return !item.roles || (rol !== null && item.roles.includes(rol));
}

// Menú del rol: sin grupos vacíos y sin lo que se abre desde el perfil.
export function navegacionPara(rol: string | null): GrupoNav[] {
  return NAVEGACION.map((g) => ({
    ...g,
    items: g.items.filter((i) => i.enMenu !== false && veItem(i, rol)),
  })).filter((g) => g.items.length > 0);
}

export function buscarSeccion(pathname: string) {
  for (const grupo of NAVEGACION) {
    for (const item of grupo.items) {
      if (
        item.href &&
        (pathname === item.href || pathname.startsWith(`${item.href}/`))
      ) {
        return { grupo, item };
      }
    }
  }
  return null;
}

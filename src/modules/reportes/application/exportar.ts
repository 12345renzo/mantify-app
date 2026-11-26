import { ESTADO_ENGRASE } from "@/modules/engrase/ui/formato";
import type { FilaEngrase } from "@/modules/engrase/application/repositorios";
import type { EquipoFila } from "@/modules/equipos/application/repositorios";
import {
  ESTADOS_MOVILIZACION,
  ESTADOS_OPERATIVOS,
} from "@/modules/equipos/domain/equipo";
import { exigirPermiso } from "@/modules/identidad/application/acceso";
import type { FilaNeumatico } from "@/modules/neumaticos/application/repositorios";
import { ESTADO_NEUMATICO, SALUD } from "@/modules/neumaticos/ui/formato";
import type { Archivo } from "@/modules/paradas/application/casos-uso";
import type { PreventivoFila } from "@/modules/preventivos/application/repositorios";
import { ESTADOS_PREVENTIVO } from "@/modules/preventivos/domain/preventivo-estado";
import type {
  BacklogDetalle,
  BacklogFila,
} from "@/modules/trabajos/application/repositorios";
import {
  CRITICIDADES,
  ESTADOS_BACKLOG,
} from "@/modules/trabajos/domain/backlog-estado";
import { exigirSuperadmin, type Actor } from "@/shared/kernel/actor";
import { DomainError } from "@/shared/kernel/errors";
import { err, ok, type Result } from "@/shared/kernel/result";
import { crearPdf, type TablaPdf } from "@/shared/exportar/pdf";
import { crearXlsx, type Celda, type Hoja } from "@/shared/exportar/xlsx";
import { exigirFrecuencia } from "./limite-frecuencia";

export const MODULOS_EXCEL = [
  "trabajos",
  "preventivos",
  "equipos",
  "engrase",
  "neumaticos",
] as const;
export type ModuloExcel = (typeof MODULOS_EXCEL)[number];
export const esModuloExcel = (v: string | null): v is ModuloExcel =>
  MODULOS_EXCEL.some((m) => m === v);

export const MAX_FILAS = 5000;

type FilasDe = {
  trabajos: BacklogFila;
  preventivos: PreventivoFila;
  equipos: EquipoFila;
  engrase: FilaEngrase;
  neumaticos: FilaNeumatico;
};

// Cada hoja usa las mismas filas que la lista del módulo: la exportación no puede diferir de la pantalla.
const DEFINICION: {
  [M in ModuloExcel]: {
    nombre: string;
    encabezado: string[];
    fila: (f: FilasDe[M]) => Celda[];
  };
} = {
  trabajos: {
    nombre: "Trabajos",
    encabezado: [
      "Código",
      "Equipo",
      "Componente",
      "Criticidad",
      "Estado",
      "Fecha programada",
    ],
    fila: (b) => [
      b.codigo,
      b.equipo,
      b.componente,
      CRITICIDADES[b.criticidad],
      ESTADOS_BACKLOG[b.estado],
      b.fechaProgramada,
    ],
  },
  preventivos: {
    nombre: "Preventivos",
    encabezado: [
      "Código",
      "Equipo",
      "Plan",
      "Tipo",
      "Estado",
      "Fecha programada",
      "Horómetro programado",
      "Responsable",
    ],
    fila: (p) => [
      p.codigo,
      p.equipo,
      p.plan,
      p.tipo,
      ESTADOS_PREVENTIVO[p.estado],
      p.fechaProgramada,
      p.horometroProgramado,
      p.responsable,
    ],
  },
  equipos: {
    nombre: "Equipos",
    encabezado: [
      "Código",
      "Marca",
      "Modelo",
      "Categoría",
      "Ubicación",
      "Movilización",
      "Estado",
      "Horómetro",
    ],
    fila: (e) => [
      e.codigo,
      e.marca,
      e.modelo,
      e.categoria,
      e.ubicacion,
      ESTADOS_MOVILIZACION[e.estadoMovilizacion],
      ESTADOS_OPERATIVOS[e.estadoOperativo],
      e.horometroActual,
    ],
  },
  engrase: {
    nombre: "Engrase",
    encabezado: [
      "Equipo",
      "Estado",
      "Horas restantes",
      "Días restantes",
      "Último completo",
      "Horómetro",
    ],
    fila: (g) => [
      g.codigo,
      ESTADO_ENGRASE[g.estado].texto,
      g.restanteHoras,
      g.restanteDias,
      g.ultimoCompleto?.fecha ?? null,
      g.horometro,
    ],
  },
  neumaticos: {
    nombre: "Neumáticos",
    encabezado: [
      "Código",
      "Marca",
      "Medida",
      "Estado",
      "Equipo",
      "Posición",
      "Cocada (mm)",
      "Salud",
      "Costo por hora",
    ],
    fila: (n) => [
      n.codigo,
      n.marca,
      n.medida,
      ESTADO_NEUMATICO[n.estado],
      n.montaje?.equipoCodigo ?? null,
      n.montaje?.posicionCodigo ?? null,
      n.cocadaActual,
      n.salud ? SALUD[n.salud].texto : null,
      // null para quien no ve costos: la base no los envía.
      n.costoPorHora,
    ],
  },
};

export function hojasModulo<M extends ModuloExcel>(
  modulo: M,
  filas: FilasDe[M][],
): Hoja[] {
  const d = DEFINICION[modulo];
  return [
    {
      nombre: d.nombre,
      filas: [d.encabezado, ...filas.slice(0, MAX_FILAS).map(d.fila)],
    },
  ];
}

export type FuentesExcel = { [M in ModuloExcel]: () => Promise<FilasDe[M][]> };

const XLSX =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

// Exportar = leer "reportes" (planificador, supervisor, gerente). Pesado: con límite de frecuencia.
export async function exportarExcelModulo(
  actor: Actor | null,
  modulo: ModuloExcel,
  fuentes: FuentesExcel,
  hoy: string,
): Promise<Result<Archivo>> {
  const permiso = exigirPermiso(actor, "leer", "reportes");
  if (!permiso.ok) return permiso;
  const limite = exigirFrecuencia(permiso.value.id);
  if (!limite.ok) return limite;
  const filas = await fuentes[modulo]();
  return ok({
    nombre: `${modulo}-${hoy}.xlsx`,
    tipo: XLSX,
    bytes: crearXlsx(hojasModulo(modulo, filas as never)),
  });
}

const fechaHora = (t: string) => t.slice(0, 16).replace("T", " ");

// PDF de una OT como tabla de dos columnas (el generador no admite imágenes: firmas como texto).
export function tablaOrden(b: BacklogDetalle, empresa: string): TablaPdf {
  const filas: string[][] = [
    ["Backlog", b.codigo],
    ["Equipo", b.equipo],
    ["Componente", b.componente],
    ["Criticidad", CRITICIDADES[b.criticidad]],
    ["Estado", ESTADOS_BACKLOG[b.estado]],
    ["Fecha programada", b.fechaProgramada],
    ["Descripción", b.descripcion],
    ["Responsable de la OT", b.ot?.responsable ?? "—"],
  ];
  if (b.rm) {
    filas.push(
      ["Reporte de mantenimiento", b.rm.codigo],
      ["Fecha del RM", b.rm.fecha],
      ["Horómetro de cierre", String(b.rm.horometro)],
      ["Notas del RM", b.rm.notas ?? "—"],
    );
  }
  for (const q of b.requisiciones) {
    filas.push([
      `Requisición ${q.codigo}`,
      `${q.descripcion} · ${q.cantidad}${q.unidad ? ` ${q.unidad}` : ""} · ${q.estado.toLowerCase()}`,
    ]);
  }
  for (const h of b.historial) {
    filas.push([
      `Historial ${fechaHora(h.creadoEn)}`,
      `${h.evento}${h.usuario ? ` · ${h.usuario}` : ""}${h.nota ? ` · ${h.nota}` : ""}`,
    ]);
  }
  for (const f of b.firmas) {
    filas.push([
      f.tipo === "CIERRE" ? "Firma de cierre" : "Firma de validación",
      `Firmado por ${f.nombre} el ${fechaHora(f.creadoEn)}${f.vigente ? "" : " (anulada)"}`,
    ]);
  }
  return {
    titulo: `Orden de trabajo ${b.ot?.codigo ?? b.codigo}`,
    subtitulo: empresa,
    columnas: [
      { titulo: "Campo", ancho: 200 },
      { titulo: "Detalle", ancho: 578 },
    ],
    filas,
  };
}

export async function exportarOrdenPdf(
  actor: Actor | null,
  backlogId: string,
  fuente: {
    backlog(id: string): Promise<BacklogDetalle | null>;
    empresa(): Promise<string>;
  },
): Promise<Result<Archivo>> {
  const permiso = exigirPermiso(actor, "leer", "reportes");
  if (!permiso.ok) return permiso;
  const b = await fuente.backlog(backlogId);
  if (!b?.ot) return err(new DomainError("NOT_FOUND", "sin orden de trabajo"));
  return ok({
    nombre: `${b.ot.codigo}.pdf`,
    tipo: "application/pdf",
    bytes: crearPdf(tablaOrden(b, await fuente.empresa())),
  });
}

// JSON con todos los datos de la empresa del planificador (sin facturación). Pesado: con límite.
export async function exportarJsonEmpresa(
  actor: Actor | null,
  fuente: { empresa(empresaId: string): Promise<unknown> },
  hoy: string,
): Promise<Result<Archivo>> {
  const permiso = exigirPermiso(actor, "leer", "respaldo_empresa");
  if (!permiso.ok) return permiso;
  const empresaId = permiso.value.empresaId;
  // El superadmin baja el respaldo completo por su propia ruta, con contraseña.
  if (!empresaId) return err(new DomainError("FORBIDDEN", "sin empresa"));
  const limite = exigirFrecuencia(permiso.value.id);
  if (!limite.ok) return limite;
  return ok({
    nombre: `respaldo-${hoy}.json`,
    tipo: "application/json",
    bytes: new TextEncoder().encode(
      JSON.stringify(await fuente.empresa(empresaId), null, 2),
    ),
  });
}

// Respaldo completo de una empresa para el superadmin. Pide su contraseña antes; la base deja el
// registro en auditoría al generarlo (una clave incorrecta no llega a generarlo).
export async function exportarRespaldo(
  actor: Actor | null,
  entrada: { empresaId: string; clave: string },
  deps: {
    auth: { verificarClave(correo: string, clave: string): Promise<boolean> };
    fuente: { empresa(empresaId: string, completo: boolean): Promise<unknown> };
  },
  hoy: string,
): Promise<Result<Archivo>> {
  const sa = exigirSuperadmin(actor);
  if (!sa.ok) return sa;
  const limite = exigirFrecuencia(sa.value.id);
  if (!limite.ok) return limite;
  if (!(await deps.auth.verificarClave(sa.value.email, entrada.clave))) {
    return err(new DomainError("VALIDATION", "clave incorrecta"));
  }
  const datos = await deps.fuente.empresa(entrada.empresaId, true);
  return ok({
    nombre: `respaldo-${entrada.empresaId}-${hoy}.json`,
    tipo: "application/json",
    bytes: new TextEncoder().encode(JSON.stringify(datos, null, 2)),
  });
}

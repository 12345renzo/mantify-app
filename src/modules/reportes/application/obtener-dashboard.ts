import type { EstadoEngrase } from "@/modules/engrase/domain/estado-engrase";
import type { Salud } from "@/modules/neumaticos/domain/salud";
import type { FilaRanking } from "@/modules/paradas/domain/ranking-fallas";
import type { Actor } from "@/shared/kernel/actor";
import { DomainError } from "@/shared/kernel/errors";
import { hoyEn, type FechaISO } from "@/shared/kernel/fechas";
import { err, ok, type Result } from "@/shared/kernel/result";
import {
  armarBandeja,
  type FilaBacklog,
  type FilaParadaAbierta,
  type FilaPreventivo,
  type ItemBandejaVista,
} from "../domain/bandeja";
import {
  backlogsPorCriticidad,
  horasDeTrabajo,
  resumenEngrase,
  resumenFlota,
  resumenNeumaticos,
  resumenOT,
  resumenPreventivos,
  trabajosPorTecnico,
} from "../domain/indicadores";

// Lo que devuelve la función dashboard_datos de la base (ya filtrado por empresa y, al técnico, por persona).
export type DatosDashboard = {
  backlogs: FilaBacklog[];
  ots: {
    estado: "ABIERTA" | "CERRADA";
    fecha_programada: FechaISO;
    cerrada_en: FechaISO | null;
  }[];
  preventivos: FilaPreventivo[];
  reprogramados: number;
  equipos: { estado_movilizacion: string; estado_operativo: string }[];
  paradas_abiertas: FilaParadaAbierta[];
  paradas_cerradas: { equipo: string; duracion_horas: number | null }[];
};

export interface LectorDashboard {
  zonaHoraria(empresaId: string): Promise<string>;
  datos(periodo: { desde: FechaISO; hasta: FechaISO }): Promise<DatosDashboard>;
}

// Lecturas de otros módulos, por sus propios casos de uso (misma regla que su pantalla).
export type FuentesDashboard = {
  engrase(): Promise<
    {
      id: string;
      codigo: string;
      estado: EstadoEngrase;
      restanteDias: number | null;
    }[]
  >;
  neumaticos(): Promise<{ id: string; codigo: string; salud: Salud | null }[]>;
  ranking(periodo: {
    desde: FechaISO;
    hasta: FechaISO;
  }): Promise<FilaRanking[]>;
};

export const TOP_FALLAS = 5;

// Mes de "hoy": del día 1 al último día.
export function mesDe(hoy: FechaISO) {
  const [anio, mes] = hoy.split("-").map(Number);
  const ultimo = new Date(Date.UTC(anio, mes, 0)).getUTCDate();
  const m = hoy.slice(0, 7);
  return { desde: `${m}-01`, hasta: `${m}-${String(ultimo).padStart(2, "0")}` };
}

type Base = { hoy: FechaISO; periodo: { desde: FechaISO; hasta: FechaISO } };

export type Dashboard =
  | (Base & {
      tipo: "GESTION";
      validaciones: { trabajos: number; preventivos: number } | null;
      preventivos: ReturnType<typeof resumenPreventivos>;
      fallas: FilaRanking[];
      backlogs: ReturnType<typeof backlogsPorCriticidad>;
      flota: ReturnType<typeof resumenFlota>;
      ot: ReturnType<typeof resumenOT>;
      tecnicos: ReturnType<typeof trabajosPorTecnico>;
      engrase: ReturnType<typeof resumenEngrase>;
      neumaticos: ReturnType<typeof resumenNeumaticos>;
      horas: ReturnType<typeof horasDeTrabajo>;
      bandeja: ItemBandejaVista[];
    })
  | (Base & { tipo: "GERENTE"; flota: ReturnType<typeof resumenFlota> })
  | (Base & {
      tipo: "TECNICO";
      trabajos: FilaBacklog[];
      bandeja: ItemBandejaVista[];
    });

// Planificador y supervisor: todo (el supervisor, además, su cola de validaciones).
// Gerente: solo la flota. Técnico: lo suyo. El superadmin no tiene dashboard.
export async function obtenerDashboard(
  actor: Actor | null,
  repos: { lector: LectorDashboard; fuentes: FuentesDashboard },
  ahora: Date = new Date(),
): Promise<Result<Dashboard>> {
  if (!actor || !actor.habilitado) {
    return err(new DomainError("UNAUTHENTICATED", "sin sesión válida"));
  }
  if (!actor.empresaId || actor.rol === "SUPERADMIN") {
    return err(new DomainError("FORBIDDEN", "sin dashboard"));
  }
  const hoy = hoyEn(await repos.lector.zonaHoraria(actor.empresaId), ahora);
  const periodo = mesDe(hoy);
  const base = { hoy, periodo };

  if (actor.rol === "GERENTE") {
    const d = await repos.lector.datos(periodo);
    return ok({ ...base, tipo: "GERENTE", flota: resumenFlota(flotaDe(d)) });
  }
  if (actor.rol === "TECNICO") {
    const d = await repos.lector.datos(periodo);
    return ok({
      ...base,
      tipo: "TECNICO",
      trabajos: d.backlogs,
      bandeja: armarBandeja({ ...d, engrase: [], neumaticos: [] }, hoy, {
        validaciones: false,
      }),
    });
  }
  if (actor.rol !== "PLANIFICADOR" && actor.rol !== "SUPERVISOR") {
    return err(new DomainError("FORBIDDEN", "rol sin dashboard"));
  }

  const [d, engrase, neumaticos, ranking] = await Promise.all([
    repos.lector.datos(periodo),
    repos.fuentes.engrase(),
    repos.fuentes.neumaticos(),
    repos.fuentes.ranking(periodo),
  ]);
  const conOT = d.backlogs.filter((b) => b.tecnico !== null);
  return ok({
    ...base,
    tipo: "GESTION",
    validaciones:
      actor.rol === "SUPERVISOR"
        ? {
            trabajos: d.backlogs.filter(
              (b) => b.estado === "PENDIENTE_VALIDACION",
            ).length,
            preventivos: d.preventivos.filter((p) => p.estado === "COMPLETADO")
              .length,
          }
        : null,
    preventivos: resumenPreventivos(
      d.preventivos.map((p) => ({
        estado: p.estado,
        fechaProgramada: p.fecha_programada,
        horometroProgramado: p.horometro_programado,
        horometroActual: p.horometro_actual,
        ejecutadoEn: p.ejecutado_en,
      })),
      d.reprogramados,
      hoy,
    ),
    fallas: ranking.filter((r) => r.fallas > 0).slice(0, TOP_FALLAS),
    backlogs: backlogsPorCriticidad(d.backlogs),
    flota: resumenFlota(flotaDe(d)),
    ot: resumenOT(
      d.ots.map((o) => ({
        estado: o.estado,
        fechaProgramada: o.fecha_programada,
        cerradaEn: o.cerrada_en,
      })),
      hoy,
    ),
    tecnicos: trabajosPorTecnico(
      conOT.map((b) => ({
        tecnico: b.tecnico ?? "",
        estado: b.estado,
        devuelto: b.devuelto,
      })),
    ),
    engrase: resumenEngrase(engrase.map((e) => e.estado)),
    neumaticos: resumenNeumaticos(
      neumaticos.flatMap((n) => (n.salud ? [n.salud] : [])),
    ),
    horas: horasDeTrabajo(
      d.paradas_cerradas.map((p) => ({
        equipo: p.equipo,
        duracionHoras: p.duracion_horas,
      })),
    ),
    bandeja: armarBandeja({ ...d, engrase, neumaticos }, hoy, {
      validaciones: true,
    }),
  });
}

const flotaDe = (d: DatosDashboard) =>
  d.equipos.map((e) => ({
    estadoMovilizacion: e.estado_movilizacion,
    estadoOperativo: e.estado_operativo,
  }));

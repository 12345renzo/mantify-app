import "server-only";
import {
  lista,
  rpc,
  una,
  urlsFirmadas,
} from "@/modules/trabajos/infrastructure/trabajos-repositorio";
import { err, ok } from "@/shared/kernel/result";
import { aDomainError } from "@/shared/supabase/errores";
import type { SupabaseServidor } from "@/shared/supabase/server";
import type { Resultado } from "../domain/actividad-observada";
import {
  TIPOS_PM,
  type EstadoPreventivo,
  type TipoPM,
  type Turno,
} from "../domain/preventivo-estado";
import type {
  LectorPreventivos,
  PreventivoDetalle,
  PreventivoFila,
  PreventivosRepositorio,
  ResultadoImportacion,
} from "../application/repositorios";

const COLUMNAS_FILA =
  "id, codigo, plan_id, equipo_id, tipo, estado, fecha_programada, horometro_programado, responsable_id, tercero";

type FilaBase = {
  id: string;
  codigo: string;
  plan_id: string;
  equipo_id: string;
  tipo: string;
  estado: string;
  fecha_programada: string;
  horometro_programado: number | null;
  responsable_id: string | null;
  tercero: string | null;
};

const num = (v: number | null) => (v === null ? null : Number(v));
const hora = (v: string | null) => v?.slice(0, 5) ?? null;

// Equipos (con horómetro), planes y nombres: lo que hace falta para mostrar una fila.
async function referencias(db: SupabaseServidor, planIds: string[]) {
  const [equipos, nombres, planes] = await Promise.all([
    db.rpc("equipos_para_preventivos").then(lista),
    db.rpc("nombres_trabajos").then(lista),
    planIds.length
      ? db
          .from("planes_preventivos")
          .select("id, nombre_plan_id, cada_dias, cada_horas")
          .in("id", [...new Set(planIds)])
          .then(lista)
      : [],
  ]);
  const nombresPlan = planes.length
    ? await db
        .from("nombres_plan_preventivo")
        .select("id, nombre")
        .in("id", [...new Set(planes.map((p) => p.nombre_plan_id))])
        .then(lista)
    : [];
  const nombrePlan = new Map(nombresPlan.map((n) => [n.id, n.nombre]));
  return {
    equipo: new Map(equipos.map((e) => [e.id, e])),
    nombre: new Map(nombres.map((n) => [n.id, n.nombre])),
    plan: new Map(
      planes.map((p) => [
        p.id,
        { ...p, nombre: nombrePlan.get(p.nombre_plan_id) ?? "—" },
      ]),
    ),
  };
}

function fila(
  p: FilaBase,
  ref: Awaited<ReturnType<typeof referencias>>,
): PreventivoFila {
  const eq = ref.equipo.get(p.equipo_id);
  return {
    id: p.id,
    codigo: p.codigo,
    equipoId: p.equipo_id,
    equipo: eq?.codigo ?? "—",
    plan: ref.plan.get(p.plan_id)?.nombre ?? "—",
    tipo: p.tipo as TipoPM,
    estado: p.estado as EstadoPreventivo,
    fechaProgramada: p.fecha_programada,
    horometroProgramado: num(p.horometro_programado),
    horometroActual: eq ? Number(eq.horometro) : null,
    responsable: p.tercero
      ? p.tercero
      : (ref.nombre.get(p.responsable_id ?? "") ?? "—"),
  };
}

export function crearLectorPreventivos(
  db: SupabaseServidor,
): LectorPreventivos {
  return {
    async listar(empresaId) {
      // shortcut: hasta 1000 preventivos vigentes y filtro por vista en memoria; paginar en la base si crece.
      const data = await db
        .from("preventivos")
        .select(COLUMNAS_FILA)
        .eq("empresa_id", empresaId)
        .is("eliminado_en", null)
        .order("fecha_programada")
        .limit(1000)
        .then(lista);
      const ref = await referencias(
        db,
        data.map((p) => p.plan_id),
      );
      return data.map((p) => fila(p, ref));
    },

    async obtener(id) {
      const p = await db
        .from("preventivos")
        .select("*")
        .eq("id", id)
        .is("eliminado_en", null)
        .maybeSingle()
        .then(una);
      if (!p) return null;
      const [ref, acts, repuestos, personal, firmas, adjuntos, historial] =
        await Promise.all([
          referencias(db, [p.plan_id]),
          db
            .from("preventivo_actividades")
            .select("id, descripcion, resultado, observacion, backlog_id")
            .eq("preventivo_id", id)
            .order("orden")
            .then(lista),
          db
            .from("preventivo_repuestos")
            .select("descripcion, cantidad, unidad")
            .eq("preventivo_id", id)
            .eq("anulado", false)
            .order("creado_en")
            .then(lista),
          db
            .from("preventivo_personal")
            .select("persona_id")
            .eq("preventivo_id", id)
            .eq("anulado", false)
            .then(lista),
          db
            .from("preventivo_firmas")
            .select("id, tipo, nombre_firmante, vigente, archivo_id, creado_en")
            .eq("preventivo_id", id)
            .order("creado_en", { ascending: false })
            .then(lista),
          db
            .from("preventivo_archivos")
            .select("id, archivo_id")
            .eq("preventivo_id", id)
            .order("creado_en")
            .then(lista),
          db
            .from("preventivo_historial_estados")
            .select("id, evento, nota, usuario_id, creado_en")
            .eq("preventivo_id", id)
            .order("creado_en", { ascending: false })
            .then(lista),
        ]);
      const idsBacklog = acts.flatMap((a) =>
        a.backlog_id ? [a.backlog_id] : [],
      );
      const idsArchivo = [
        ...firmas.map((f) => f.archivo_id),
        ...adjuntos.map((a) => a.archivo_id),
      ];
      const [backlogs, archivos] = await Promise.all([
        idsBacklog.length
          ? db
              .from("backlogs")
              .select("id, codigo")
              .in("id", idsBacklog)
              .then(lista)
          : [],
        idsArchivo.length
          ? db
              .from("archivos")
              .select("id, ruta_storage")
              .in("id", idsArchivo)
              .then(lista)
          : [],
      ]);
      const codigoBacklog = new Map(backlogs.map((b) => [b.id, b.codigo]));
      const ruta = new Map(archivos.map((a) => [a.id, a.ruta_storage]));
      const urls = await urlsFirmadas(
        db,
        archivos.map((a) => a.ruta_storage),
      );
      const url = (archivoId: string) =>
        urls.get(ruta.get(archivoId) ?? "") ?? null;
      const de = (uid: string | null) =>
        uid ? (ref.nombre.get(uid) ?? null) : null;
      const plan = ref.plan.get(p.plan_id);

      const detalle: PreventivoDetalle = {
        ...fila(p, ref),
        nombrePlanId: plan?.nombre_plan_id ?? "",
        cadaDias: plan?.cada_dias ?? null,
        cadaHoras: num(plan?.cada_horas ?? null),
        responsableId: p.responsable_id,
        esTercero: p.tercero !== null,
        version: p.version,
        fechaEjecucion: p.fecha_ejecucion,
        horaInicio: hora(p.hora_inicio),
        horaFin: hora(p.hora_fin),
        duracionHoras: num(p.duracion_horas),
        turno: p.turno as Turno | null,
        horometroEjecucion: num(p.horometro_ejecucion),
        notas: p.notas,
        ejecutadoPorId: p.ejecutado_por,
        ejecutadoPor: de(p.ejecutado_por),
        validadoPor: de(p.validado_por),
        notaDevolucion: p.nota_devolucion,
        actividades: acts.map((a) => ({
          id: a.id,
          descripcion: a.descripcion,
          resultado: a.resultado as Resultado | null,
          observacion: a.observacion,
          backlog: a.backlog_id
            ? {
                id: a.backlog_id,
                codigo: codigoBacklog.get(a.backlog_id) ?? "—",
              }
            : null,
        })),
        repuestos: repuestos.map((r) => ({
          descripcion: r.descripcion,
          cantidad: Number(r.cantidad),
          unidad: r.unidad,
        })),
        personal: personal.map((x) => ({
          id: x.persona_id,
          nombre: de(x.persona_id) ?? "—",
        })),
        firmas: firmas.map((f) => ({
          id: f.id,
          tipo: f.tipo as "EJECUCION" | "VALIDACION",
          nombre: f.nombre_firmante,
          vigente: f.vigente,
          url: url(f.archivo_id),
          creadoEn: f.creado_en,
        })),
        fotos: adjuntos.map((a) => ({ id: a.id, url: url(a.archivo_id) })),
        historial: historial.map((h) => ({
          id: h.id,
          evento: h.evento,
          nota: h.nota,
          usuario: de(h.usuario_id),
          creadoEn: h.creado_en,
        })),
      };
      return detalle;
    },

    personas: async () => lista(await db.rpc("personas_activas")),

    async opciones(empresaId) {
      const [equipos, planes, personas, motivos] = await Promise.all([
        db.rpc("equipos_para_preventivos").then(lista),
        db
          .from("nombres_plan_preventivo")
          .select("id, nombre")
          .eq("empresa_id", empresaId)
          .eq("activo", true)
          .order("nombre")
          .then(lista),
        db.rpc("personas_activas").then(lista),
        db
          .from("motivos_parada")
          .select("codigo, duracion_estandar_horas")
          .eq("empresa_id", empresaId)
          .in("codigo", [...TIPOS_PM])
          .then(lista),
      ]);
      return {
        equipos: equipos.map(({ id, codigo, movilizado }) => ({
          id,
          codigo,
          movilizado,
        })),
        planes,
        personas,
        duraciones: Object.fromEntries(
          motivos.flatMap((m) =>
            m.duracion_estandar_horas === null
              ? []
              : [[m.codigo, Number(m.duracion_estandar_horas)]],
          ),
        ),
      };
    },
  };
}

export function crearPreventivosRepositorio(
  db: SupabaseServidor,
): PreventivosRepositorio {
  return {
    async programar(d, clave) {
      const { data, error } = await db.rpc("programar_preventivo", {
        p_datos: {
          equipo_id: d.equipoId,
          nombre_plan_id: d.nombrePlanId,
          tipo: d.tipo,
          fecha_programada: d.fechaProgramada,
          horometro_programado: d.horometroProgramado,
          responsable_id: d.responsableId ?? "",
          tercero: d.tercero ?? "",
          cada_dias: d.cadaDias,
          cada_horas: d.cadaHoras,
        },
        p_clave: clave,
      });
      if (error) return err(aDomainError(error));
      return ok({ id: data });
    },

    async importar(filas) {
      const { data, error } = await db.rpc("importar_preventivos", {
        p_filas: filas,
      });
      if (error) return err(aDomainError(error));
      return ok(data as ResultadoImportacion[]);
    },

    ejecutar: (id, d, fotos, clave) =>
      rpc(
        db.rpc("ejecutar_preventivo", {
          p_prev: id,
          p_datos: {
            fecha_ejecucion: d.fechaEjecucion,
            hora_inicio: d.horaInicio,
            hora_fin: d.horaFin,
            turno: d.turno,
            horometro_ejecucion: d.horometroEjecucion,
            notas: d.notas ?? "",
            actividades: d.actividades,
            repuestos: d.repuestos,
            personal: d.personal,
          },
          p_fotos: fotos,
          p_clave: clave,
        }),
      ),

    validar: (id, aprobar, nota, clave) =>
      rpc(
        db.rpc("validar_preventivo", {
          p_prev: id,
          p_aprobar: aprobar,
          p_nota: nota ?? "",
          p_clave: clave,
        }),
      ),

    reprogramar: (id, fecha, clave) =>
      rpc(
        db.rpc("reprogramar_preventivo", {
          p_prev: id,
          p_fecha: fecha,
          p_clave: clave,
        }),
      ),
  };
}

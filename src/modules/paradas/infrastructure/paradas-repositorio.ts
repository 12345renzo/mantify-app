import "server-only";
import {
  lista,
  rpc,
  urlsFirmadas,
} from "@/modules/trabajos/infrastructure/trabajos-repositorio";
import { err, ok } from "@/shared/kernel/result";
import { aDomainError } from "@/shared/supabase/errores";
import type { Database } from "@/shared/supabase/database.types";
import type { SupabaseServidor } from "@/shared/supabase/server";
import type {
  EstadoParada,
  LectorParadas,
  Parada,
  ParadasRepositorio,
  ResultadoImportacion,
} from "../application/repositorios";

type FilaReporte =
  Database["public"]["Functions"]["paradas_reporte"]["Returns"][number];

const num = (v: number | null) => (v === null ? null : Number(v));

function parada(f: FilaReporte): Parada {
  return {
    id: f.id,
    codigo: f.codigo,
    equipoId: f.equipo_id,
    equipo: f.equipo,
    motivoCodigo: f.motivo_codigo,
    motivo: f.motivo,
    esPlanificado: f.es_planificado,
    inicio: f.inicio,
    fin: f.fin,
    duracionHoras: num(f.duracion_horas),
    horometroInicio: Number(f.horometro_inicio),
    horometroFin: num(f.horometro_fin),
    responsableId: f.responsable_id,
    responsable: f.responsable ?? "—",
    descripcion: f.descripcion,
    hallazgo: f.hallazgo,
    areaDemora: f.area_demora,
    areaParada: f.area_parada,
    estado: f.estado as EstadoParada,
    cruceConfirmado: f.cruce_confirmado,
    backlog:
      f.backlog_id && f.backlog_codigo
        ? { id: f.backlog_id, codigo: f.backlog_codigo }
        : null,
  };
}

export function crearLectorParadas(db: SupabaseServidor): LectorParadas {
  return {
    async reporte(f) {
      const data = lista(
        await db.rpc("paradas_reporte", {
          p_desde: f.desde,
          p_hasta: f.hasta,
          p_abiertas: f.abiertas ?? false,
          ...(f.equipoId ? { p_equipo: f.equipoId } : {}),
        }),
      );
      return data.map(parada);
    },

    async obtener(id) {
      const [filas, adjuntos] = await Promise.all([
        db
          .rpc("paradas_reporte", { p_desde: null, p_hasta: null, p_id: id })
          .then(lista),
        db
          .from("parada_archivos")
          .select("id, archivo_id")
          .eq("parada_id", id)
          .order("creado_en")
          .then(lista),
      ]);
      if (!filas[0]) return null;
      const archivos = adjuntos.length
        ? await db
            .from("archivos")
            .select("id, ruta_storage")
            .in(
              "id",
              adjuntos.map((a) => a.archivo_id),
            )
            .then(lista)
        : [];
      const ruta = new Map(archivos.map((a) => [a.id, a.ruta_storage]));
      const urls = await urlsFirmadas(
        db,
        archivos.map((a) => a.ruta_storage),
      );
      return {
        ...parada(filas[0]),
        fotos: adjuntos.map((a) => ({
          id: a.id,
          url: urls.get(ruta.get(a.archivo_id) ?? "") ?? null,
        })),
      };
    },

    async nombreEmpresa(empresaId) {
      const { data } = await db
        .from("empresas")
        .select("nombre")
        .eq("id", empresaId)
        .maybeSingle();
      return data?.nombre ?? "";
    },

    async opciones(empresaId) {
      const [equipos, motivos, areas, personas] = await Promise.all([
        db.rpc("equipos_para_preventivos").then(lista),
        db
          .from("motivos_parada")
          .select("id, codigo, nombre, es_planificado")
          .eq("empresa_id", empresaId)
          .eq("activo", true)
          .order("codigo")
          .then(lista),
        db
          .from("areas_responsables")
          .select("id, nombre, tipo")
          .eq("empresa_id", empresaId)
          .eq("activo", true)
          .order("nombre")
          .then(lista),
        db.rpc("personas_activas").then(lista),
      ]);
      return {
        equipos: equipos.map((e) => ({ ...e, horometro: Number(e.horometro) })),
        motivos: motivos.map((m) => ({
          id: m.id,
          codigo: m.codigo,
          nombre: m.nombre,
          esPlanificado: m.es_planificado === true && m.codigo !== "MCI",
        })),
        areas: areas.map((a) => ({
          ...a,
          tipo: a.tipo as "DEMORA" | "PARADA",
        })),
        personas,
      };
    },
  };
}

export function crearParadasRepositorio(
  db: SupabaseServidor,
): ParadasRepositorio {
  return {
    async iniciar(d, fotos, confirmar, clave) {
      const { data, error } = await db.rpc("iniciar_parada", {
        p_datos: {
          equipo_id: d.equipoId,
          motivo_id: d.motivoId,
          inicio: d.inicio,
          horometro_inicio: d.horometroInicio,
          responsable_id: d.responsableId ?? "",
          responsable_externo: d.responsableExterno ?? "",
        },
        p_fotos: fotos,
        p_confirmar_cruce: confirmar,
        p_clave: clave,
      });
      if (error) return err(aDomainError(error));
      return ok({ id: data });
    },

    cerrar: (id, d, fotos, confirmar, clave) =>
      rpc(
        db.rpc("cerrar_parada", {
          p_parada: id,
          p_datos: {
            fin: d.fin,
            horometro_fin: d.horometroFin,
            descripcion: d.descripcion,
            area_demora_id: d.areaDemoraId ?? "",
            area_parada_id: d.areaParadaId ?? "",
            hallazgo: d.hallazgo ?? "",
          },
          p_fotos: fotos,
          p_confirmar_cruce: confirmar,
          p_clave: clave,
        }),
      ),

    async importar(filas) {
      const { data, error } = await db.rpc("importar_paradas", {
        p_filas: filas.map((f) => ({
          fila: f.fila,
          id_importacion: f.idImportacion,
          equipo: f.equipo,
          motivo: f.motivo,
          inicio: f.inicio,
          fin: f.fin,
          horometro_inicio: f.horometroInicio,
          horometro_fin: f.horometroFin,
          descripcion: f.descripcion,
          responsable: f.responsable,
          area_demora: f.areaDemora ?? "",
          area_parada: f.areaParada ?? "",
          hallazgo: f.hallazgo ?? "",
        })),
      });
      if (error) return err(aDomainError(error));
      return ok(data as ResultadoImportacion[]);
    },
  };
}

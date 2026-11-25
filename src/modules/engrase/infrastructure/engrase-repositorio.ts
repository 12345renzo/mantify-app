import "server-only";
import {
  lista,
  rpc,
  una,
} from "@/modules/trabajos/infrastructure/trabajos-repositorio";
import type { SupabaseServidor } from "@/shared/supabase/server";
import { TIPOS_AVISO } from "../domain/estado-engrase";
import type {
  EngraseRepositorio,
  LectorEngrase,
  Medidor,
} from "../application/repositorios";

const num = (v: number | null) => (v === null ? null : Number(v));
const ultimo = (fecha: string | null, horometro: number | null) =>
  fecha === null || horometro === null
    ? null
    : { fecha, horometro: Number(horometro) };

export function crearLectorEngrase(db: SupabaseServidor): LectorEngrase {
  return {
    async equipos(equipoId) {
      const filas = await db
        .rpc("engrase_equipos", equipoId ? { p_equipo: equipoId } : {})
        .then(lista);
      return filas.map((e) => ({
        id: e.id,
        codigo: e.codigo,
        categoriaId: e.categoria_id,
        medidor: e.tipo_medidor as Medidor,
        horometro: Number(e.horometro),
        plan: e.tipo_grasa_id
          ? {
              cadaHoras: num(e.cada_horas),
              cadaDias: e.cada_dias,
              tipoGrasaId: e.tipo_grasa_id,
            }
          : null,
        ultimoCompleto: ultimo(e.ultimo_fecha, e.ultimo_horometro),
        ultimoRegistro: ultimo(
          e.ultimo_registro_fecha,
          e.ultimo_registro_horometro,
        ),
      }));
    },

    async empresa(empresaId) {
      const e = await db
        .from("empresas")
        .select("zona_horaria, engrase_aviso_tipo, engrase_aviso_valor")
        .eq("id", empresaId)
        .maybeSingle()
        .then(una);
      const tipo = TIPOS_AVISO.find((t) => t === e?.engrase_aviso_tipo);
      return {
        zonaHoraria: e?.zona_horaria ?? "America/Lima",
        aviso: {
          tipo: tipo ?? "PORCENTAJE",
          valor: e?.engrase_aviso_valor ?? 20,
        },
      };
    },

    async grasas() {
      return db
        .from("tipos_grasa")
        .select("id, nombre")
        .eq("activo", true)
        .order("nombre")
        .then(lista);
    },

    async plantillas() {
      const filas = await db
        .from("plantillas_puntos_engrase")
        .select("id, descripcion, orden, categoria_id")
        .eq("activo", true)
        .then(lista);
      return filas.map((p) => ({
        id: p.id,
        descripcion: p.descripcion,
        orden: p.orden ?? 0,
        categoriaId: p.categoria_id,
      }));
    },

    async puntos(equipoId) {
      let q = db
        .from("puntos_engrase")
        .select("id, equipo_id, descripcion, orden")
        .eq("activo", true);
      if (equipoId) q = q.eq("equipo_id", equipoId);
      const filas = await q.order("orden").then(lista);
      return filas.map((p) => ({
        id: p.id,
        equipoId: p.equipo_id,
        descripcion: p.descripcion,
        orden: p.orden,
      }));
    },

    async registros(equipoId) {
      // shortcut: los 200 más recientes; paginar si un equipo acumula más historial.
      const filas = await db
        .from("registros_engrase")
        .select(
          "id, fecha, horometro, tipo_grasa_id, completo, observacion, creado_por, creado_en",
        )
        .eq("equipo_id", equipoId)
        .order("fecha", { ascending: false })
        .order("creado_en", { ascending: false })
        .limit(200)
        .then(lista);
      if (filas.length === 0) return [];
      const [puntos, grasas, nombres] = await Promise.all([
        db
          .from("registros_engrase_puntos")
          .select("registro_id, descripcion, orden, engrasado")
          .in(
            "registro_id",
            filas.map((r) => r.id),
          )
          .order("orden")
          .then(lista),
        db.from("tipos_grasa").select("id, nombre").then(lista),
        db.rpc("nombres_trabajos").then(lista),
      ]);
      const grasa = new Map(grasas.map((g) => [g.id, g.nombre]));
      const nombre = new Map(nombres.map((n) => [n.id, n.nombre]));
      return filas.map((r) => ({
        id: r.id,
        fecha: r.fecha,
        horometro: Number(r.horometro),
        grasa: grasa.get(r.tipo_grasa_id) ?? "—",
        completo: r.completo,
        observacion: r.observacion,
        registradoPor: nombre.get(r.creado_por ?? "") ?? "—",
        creadoEn: r.creado_en,
        puntos: puntos
          .filter((p) => p.registro_id === r.id)
          .map((p) => ({ descripcion: p.descripcion, engrasado: p.engrasado })),
      }));
    },
  };
}

// Toda escritura va por funciones de la base, que vuelven a revisar empresa, rol y reglas.
export function crearEngraseRepositorio(
  db: SupabaseServidor,
): EngraseRepositorio {
  return {
    guardarPlan(d) {
      return rpc(
        db.rpc("guardar_plan_engrase", {
          p_equipo: d.equipoId,
          p_datos: {
            cada_horas: d.cadaHoras,
            cada_dias: d.cadaDias,
            tipo_grasa_id: d.tipoGrasaId,
            puntos: d.puntos.map((descripcion) => ({ descripcion })),
          },
        }),
      );
    },

    registrar(d) {
      return rpc(
        db.rpc("registrar_engrase", {
          p_equipo: d.equipoId,
          p_datos: {
            fecha: d.fecha,
            horometro: d.horometro,
            tipo_grasa_id: d.tipoGrasaId,
            engrasados: d.engrasados,
            observacion: d.observacion,
          },
          p_clave: d.clave,
        }),
      );
    },

    configurarAviso(d) {
      return rpc(
        db.rpc("configurar_aviso_engrase", {
          p_tipo: d.tipo,
          p_valor: d.valor,
        }),
      );
    },
  };
}

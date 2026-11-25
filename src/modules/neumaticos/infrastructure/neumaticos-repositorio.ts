import "server-only";
import {
  lista,
  rpc,
  una,
} from "@/modules/trabajos/infrastructure/trabajos-repositorio";
import { err, ok } from "@/shared/kernel/result";
import { aDomainError } from "@/shared/supabase/errores";
import type { SupabaseServidor } from "@/shared/supabase/server";
import type {
  EstadoNeumatico,
  LectorNeumaticos,
  Medidor,
  NeumaticosRepositorio,
} from "../application/repositorios";

const num = (v: number | null) => (v === null ? null : Number(v));

export function crearLectorNeumaticos(db: SupabaseServidor): LectorNeumaticos {
  return {
    async neumaticos(id) {
      // Por función: devuelve los costos en null a quien no puede verlos.
      const filas = await db
        .rpc("neumaticos_listado", id ? { p_id: id } : {})
        .then(lista);
      return filas.map((n) => ({
        id: n.id,
        codigo: n.codigo,
        marca: n.marca,
        modelo: n.modelo,
        medida: n.medida,
        cocadaNueva: Number(n.cocada_nueva),
        costo: num(n.costo),
        costoRecapados: num(n.costo_recapados),
        estado: n.estado as EstadoNeumatico,
        recapados: n.recapados,
        horasAcumuladas: Number(n.horas_acumuladas),
        montaje:
          n.equipo_id && n.posicion_id && n.montado_en
            ? {
                equipoId: n.equipo_id,
                equipoCodigo: n.equipo_codigo ?? "—",
                equipoHorometro: Number(n.equipo_horometro),
                categoriaId: n.categoria_id ?? "",
                medidor: (n.medidor ?? "HORAS") as Medidor,
                posicionId: n.posicion_id,
                posicionCodigo: n.posicion_codigo ?? "—",
                montadoEn: n.montado_en,
                horometroMontaje: Number(n.horometro_montaje),
                cocadaMontaje: Number(n.cocada_montaje),
              }
            : null,
        ultimaMedicion:
          n.medicion_fecha &&
          n.interno !== null &&
          n.centro !== null &&
          n.externo !== null
            ? {
                fecha: n.medicion_fecha,
                puntos: {
                  interno: Number(n.interno),
                  centro: Number(n.centro),
                  externo: Number(n.externo),
                },
                presion: num(n.presion),
              }
            : null,
      }));
    },

    async equipos() {
      const filas = await db.rpc("neumaticos_equipos").then(lista);
      return filas.map((e) => ({
        id: e.id,
        codigo: e.codigo,
        categoriaId: e.categoria_id,
        medidor: e.medidor as Medidor,
        horometro: Number(e.horometro),
      }));
    },

    async posiciones(equipoId) {
      return db
        .from("posiciones_neumatico")
        .select("id, codigo, eje, orden")
        .eq("equipo_id", equipoId)
        .eq("activo", true)
        .order("orden")
        .then(lista);
    },

    async umbrales() {
      const filas = await db
        .from("parametros_neumatico")
        .select(
          "categoria_id, equipo_id, cocada_minima, cocada_alerta, dias_sin_medir, diferencia_maxima",
        )
        .eq("activo", true)
        .then(lista);
      return filas.map((u) => ({
        categoriaId: u.categoria_id,
        equipoId: u.equipo_id,
        cocadaMinima: Number(u.cocada_minima),
        cocadaAlerta: Number(u.cocada_alerta),
        diasSinMedir: u.dias_sin_medir,
        diferenciaMaxima: Number(u.diferencia_maxima),
      }));
    },

    async motivos() {
      return db
        .from("motivos_retiro_neumatico")
        .select("id, nombre")
        .eq("activo", true)
        .order("nombre")
        .then(lista);
    },

    async plantillas() {
      return db
        .from("plantillas_disposicion_neumatico")
        .select("id, nombre, layout")
        .eq("activo", true)
        .order("nombre")
        .then(lista);
    },

    async categorias() {
      return db
        .from("categorias_equipo")
        .select("id, nombre")
        .eq("activo", true)
        .order("nombre")
        .then(lista);
    },

    async empresa(empresaId) {
      const e = await db
        .from("empresas")
        .select("zona_horaria, plan_id")
        .eq("id", empresaId)
        .maybeSingle()
        .then(una);
      const plan = e
        ? await db
            .from("planes")
            .select("codigo")
            .eq("id", e.plan_id)
            .maybeSingle()
            .then(una)
        : null;
      return {
        zonaHoraria: e?.zona_horaria ?? "America/Lima",
        esPro: plan?.codigo === "PRO",
      };
    },

    async eventos(neumaticoId) {
      // shortcut: los 200 más recientes; paginar si una cubierta acumula más historial.
      const [filas, nombres, equipos] = await Promise.all([
        db
          .from("eventos_neumatico")
          .select(
            "id, tipo, equipo_id, posicion, horometro, detalle, creado_por, creado_en",
          )
          .eq("neumatico_id", neumaticoId)
          .order("creado_en", { ascending: false })
          .limit(200)
          .then(lista),
        db.rpc("nombres_trabajos").then(lista),
        db.rpc("neumaticos_equipos").then(lista),
      ]);
      const nombre = new Map(nombres.map((n) => [n.id, n.nombre]));
      const equipo = new Map(equipos.map((e) => [e.id, e.codigo]));
      return filas.map((e) => ({
        id: e.id,
        tipo: e.tipo,
        equipo: e.equipo_id ? (equipo.get(e.equipo_id) ?? "—") : null,
        posicion: e.posicion,
        horometro: num(e.horometro),
        detalle: e.detalle,
        registradoPor: nombre.get(e.creado_por ?? "") ?? "—",
        creadoEn: e.creado_en,
      }));
    },

    async mediciones(neumaticoId) {
      const filas = await db
        .from("mediciones_neumatico")
        .select(
          "sesion_id, posicion_id, recapado, interno, centro, externo, presion",
        )
        .eq("neumatico_id", neumaticoId)
        .limit(500)
        .then(lista);
      if (filas.length === 0) return [];
      const [sesiones, posiciones, equipos] = await Promise.all([
        db
          .from("sesiones_medicion_neumatico")
          .select("id, equipo_id, fecha, horometro, creado_en")
          .in("id", [...new Set(filas.map((f) => f.sesion_id))])
          .then(lista),
        db
          .from("posiciones_neumatico")
          .select("id, codigo")
          .in("id", [...new Set(filas.map((f) => f.posicion_id))])
          .then(lista),
        db.rpc("neumaticos_equipos").then(lista),
      ]);
      const sesion = new Map(sesiones.map((s) => [s.id, s]));
      const posicion = new Map(posiciones.map((p) => [p.id, p.codigo]));
      const equipo = new Map(equipos.map((e) => [e.id, e.codigo]));
      return filas
        .map((f) => {
          const s = sesion.get(f.sesion_id);
          return {
            fecha: s?.fecha ?? "",
            creadoEn: s?.creado_en ?? "",
            horometro: Number(s?.horometro ?? 0),
            equipo: equipo.get(s?.equipo_id ?? "") ?? "—",
            posicion: posicion.get(f.posicion_id) ?? "—",
            recapado: f.recapado,
            puntos: {
              interno: Number(f.interno),
              centro: Number(f.centro),
              externo: Number(f.externo),
            },
            presion: num(f.presion),
          };
        })
        .sort(
          (a, b) =>
            b.fecha.localeCompare(a.fecha) ||
            b.creadoEn.localeCompare(a.creadoEn),
        )
        .map((m) => ({
          fecha: m.fecha,
          horometro: m.horometro,
          equipo: m.equipo,
          posicion: m.posicion,
          recapado: m.recapado,
          puntos: m.puntos,
          presion: m.presion,
        }));
    },
  };
}

// Toda escritura va por funciones de la base, que repiten empresa, rol, reglas y bloqueos.
export function crearNeumaticosRepositorio(
  db: SupabaseServidor,
): NeumaticosRepositorio {
  return {
    async guardar(d) {
      const { data, error } = await db.rpc("guardar_neumatico", {
        p_id: d.id,
        p_datos: {
          codigo: d.codigo,
          marca: d.marca,
          modelo: d.modelo,
          medida: d.medida,
          cocada_nueva: d.cocadaNueva,
          costo: d.costo,
        },
        p_clave: d.clave,
      });
      return error ? err(aDomainError(error)) : ok(data);
    },

    definirPosiciones(equipoId, posiciones) {
      return rpc(
        db.rpc("definir_posiciones", {
          p_equipo: equipoId,
          p_posiciones: posiciones,
        }),
      );
    },

    guardarUmbrales(destino, datos) {
      return rpc(
        db.rpc("guardar_umbrales", {
          p_categoria: destino.categoriaId,
          p_equipo: destino.equipoId,
          p_datos: datos && {
            cocada_minima: datos.cocadaMinima,
            cocada_alerta: datos.cocadaAlerta,
            dias_sin_medir: datos.diasSinMedir,
            diferencia_maxima: datos.diferenciaMaxima,
          },
        }),
      );
    },

    montar(d) {
      return rpc(
        db.rpc("montar_neumatico", {
          p_neumatico: d.neumaticoId,
          p_posicion: d.posicionId,
          p_datos: { fecha: d.fecha, horometro: d.horometro, cocada: d.cocada },
          p_clave: d.clave,
        }),
      );
    },

    desmontar(d) {
      return rpc(
        db.rpc("desmontar_neumatico", {
          p_neumatico: d.neumaticoId,
          p_datos: {
            fecha: d.fecha,
            horometro: d.horometro,
            motivo_id: d.motivoId,
            destino: d.destino,
          },
          p_clave: d.clave,
        }),
      );
    },

    rotar(d) {
      return rpc(
        db.rpc("rotar_neumaticos", {
          p_origen: d.origenId,
          p_destino: d.destinoId,
          p_datos: { fecha: d.fecha, horometro: d.horometro },
          p_clave: d.clave,
        }),
      );
    },

    recapar(d) {
      return rpc(
        db.rpc("recapar_neumatico", {
          p_neumatico: d.neumaticoId,
          p_datos: { costo: d.costo, cocada_nueva: d.cocadaNueva },
          p_clave: d.clave,
        }),
      );
    },

    medir(d) {
      return rpc(
        db.rpc("medir_neumaticos", {
          p_equipo: d.equipoId,
          p_datos: {
            fecha: d.fecha,
            horometro: d.horometro,
            mediciones: d.mediciones.map((m) => ({
              neumatico_id: m.neumaticoId,
              interno: m.interno,
              centro: m.centro,
              externo: m.externo,
              presion: m.presion,
            })),
          },
          p_clave: d.clave,
        }),
      );
    },
  };
}

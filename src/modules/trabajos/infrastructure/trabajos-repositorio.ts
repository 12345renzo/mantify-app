import "server-only";
import { DomainError } from "@/shared/kernel/errors";
import { err, ok, type Result } from "@/shared/kernel/result";
import { aDomainError } from "@/shared/supabase/errores";
import type { SupabaseServidor } from "@/shared/supabase/server";
import type { Criticidad, EstadoBacklog } from "../domain/backlog-estado";
import type { DatosBacklog } from "../application/esquemas";
import type {
  BacklogDetalle,
  BacklogFila,
  EstadoRequisicion,
  LectorTrabajos,
  TrabajosRepositorio,
} from "../application/repositorios";

const BUCKET = "archivos";
// Vida de las URL firmadas de fotos y firmas.
const SEGUNDOS_URL = 300;

const ESTADOS_VISTA = {
  abiertos: ["PENDIENTE", "EN_PROCESO"],
  validacion: ["PENDIENTE_VALIDACION"],
  completados: ["COMPLETADO"],
} as const;

function fila(
  b: {
    id: string;
    codigo: string;
    equipo_id: string;
    componente: string;
    criticidad: string;
    estado: string;
    fecha_programada: string;
    devuelto_en: string | null;
  },
  equipos: Map<string, string>,
): BacklogFila {
  return {
    id: b.id,
    codigo: b.codigo,
    equipo: equipos.get(b.equipo_id) ?? "—",
    componente: b.componente,
    criticidad: b.criticidad as Criticidad,
    estado: b.estado as EstadoBacklog,
    fechaProgramada: b.fecha_programada,
    devuelto: b.estado === "EN_PROCESO" && b.devuelto_en !== null,
  };
}

async function mapaEquipos(db: SupabaseServidor) {
  const data = lista(await db.rpc("equipos_para_trabajos"));
  return new Map(data.map((e) => [e.id, e.codigo]));
}

export async function urlsFirmadas(db: SupabaseServidor, rutas: string[]) {
  if (rutas.length === 0) return new Map<string, string>();
  const { data, error } = await db.storage
    .from(BUCKET)
    .createSignedUrls(rutas, SEGUNDOS_URL);
  if (error) {
    console.error("[storage] no se firmaron las URL", {
      mensaje: error.message,
    });
    return new Map<string, string>();
  }
  return new Map(
    data.flatMap((d) =>
      d.path && d.signedUrl ? [[d.path, d.signedUrl] as const] : [],
    ),
  );
}

type Respuesta<T> = {
  data: T | null;
  error: { code?: string; message: string } | null;
};
// Lista: un error de la base se traduce y se lanza (lo atrapa error.tsx).
export const lista = <T>(r: Respuesta<T[]>): T[] => {
  if (r.error) throw aDomainError(r.error);
  return r.data ?? [];
};
// Una fila o nada.
export const una = <T>(r: Respuesta<T>): T | null => {
  if (r.error) throw aDomainError(r.error);
  return r.data;
};

export function crearLectorTrabajos(db: SupabaseServidor): LectorTrabajos {
  return {
    async listar(empresaId, filtro) {
      let q = db
        .from("backlogs")
        .select(
          "id, codigo, equipo_id, componente, criticidad, estado, fecha_programada, devuelto_en",
        )
        .eq("empresa_id", empresaId)
        .is("eliminado_en", null)
        .in("estado", [...ESTADOS_VISTA[filtro.vista]]);
      if (filtro.buscar) {
        // buscar ya viene sin comas, paréntesis ni comodines (sanearBusqueda).
        const t = `%${filtro.buscar}%`;
        q = q.or(`codigo.ilike.${t},componente.ilike.${t}`);
      }
      // shortcut: hasta 1000 trabajos por vista y orden en memoria; paginar en la base si una empresa pasa de eso.
      const [data, equipos] = await Promise.all([
        q.order("creado_en", { ascending: false }).limit(1000).then(lista),
        mapaEquipos(db),
      ]);
      return data.map((b) => fila(b, equipos));
    },

    async obtener(id) {
      const b = await db
        .from("backlogs")
        .select("*")
        .eq("id", id)
        .is("eliminado_en", null)
        .maybeSingle()
        .then(una);
      if (!b) return null;
      const [ot, rqs, historial, firmas, adjuntos, nombres, equipos, sistema] =
        await Promise.all([
          db
            .from("ordenes_trabajo")
            .select("id, codigo, estado, responsable_id")
            .eq("backlog_id", id)
            .is("eliminado_en", null)
            .maybeSingle()
            .then(una),
          db
            .from("requisiciones")
            .select("*")
            .eq("empresa_id", b.empresa_id)
            .order("creado_en")
            .then(lista),
          db
            .from("backlog_historial_estados")
            .select("id, evento, estado_nuevo, nota, usuario_id, creado_en")
            .eq("backlog_id", id)
            .order("creado_en", { ascending: false })
            .then(lista),
          db
            .from("backlog_firmas")
            .select("id, tipo, nombre_firmante, vigente, archivo_id, creado_en")
            .eq("backlog_id", id)
            .order("creado_en", { ascending: false })
            .then(lista),
          db
            .from("backlog_archivos")
            .select("id, rol, archivo_id")
            .eq("backlog_id", id)
            .order("creado_en")
            .then(lista),
          db.rpc("nombres_trabajos").then(lista),
          mapaEquipos(db),
          b.sistema_id
            ? db
                .from("sistemas_mantenimiento")
                .select("nombre")
                .eq("id", b.sistema_id)
                .maybeSingle()
                .then(una)
            : null,
        ]);
      const rm = ot
        ? await db
            .from("reportes_mantenimiento")
            .select("*")
            .eq("orden_trabajo_id", ot.id)
            .maybeSingle()
            .then(una)
        : null;
      const idsArchivo = [
        ...firmas.map((f) => f.archivo_id),
        ...adjuntos.map((a) => a.archivo_id),
      ];
      const archivos = idsArchivo.length
        ? await db
            .from("archivos")
            .select("id, ruta_storage")
            .in("id", idsArchivo)
            .then(lista)
        : [];
      const ruta = new Map(archivos.map((a) => [a.id, a.ruta_storage]));
      const urls = await urlsFirmadas(
        db,
        archivos.map((a) => a.ruta_storage),
      );
      const url = (archivoId: string) =>
        urls.get(ruta.get(archivoId) ?? "") ?? null;
      const nombre = new Map(nombres.map((n) => [n.id, n.nombre]));
      const de = (uid: string | null) =>
        uid ? (nombre.get(uid) ?? null) : null;

      const detalle: BacklogDetalle = {
        ...fila(b, equipos),
        equipoId: b.equipo_id,
        sistemaId: b.sistema_id,
        sistema: sistema?.nombre ?? null,
        descripcion: b.descripcion,
        fechaObservacion: b.fecha_observacion,
        costoEstimado: Number(b.costo_estimado),
        version: b.version,
        creadoPorId: b.creado_por,
        creadoPor: de(b.creado_por),
        creadoEn: b.creado_en,
        cerradoPorId: b.cerrado_por,
        notaDevolucion: b.nota_devolucion,
        ot: ot && {
          id: ot.id,
          codigo: ot.codigo,
          abierta: ot.estado === "ABIERTA",
          responsableId: ot.responsable_id,
          responsable: de(ot.responsable_id) ?? "—",
        },
        rm: rm && {
          codigo: rm.codigo,
          fecha: rm.fecha,
          horometro: Number(rm.horometro),
          notas: rm.notas,
          cerrado: rm.estado === "CERRADO",
          cerradoPor: de(rm.cerrado_por),
        },
        requisiciones: ot
          ? rqs
              .filter((q) => q.orden_trabajo_id === ot.id)
              .map((q) => ({
                id: q.id,
                codigo: q.codigo,
                descripcion: q.descripcion,
                cantidad: Number(q.cantidad),
                unidad: q.unidad,
                estado: q.estado as EstadoRequisicion,
                solicitadoPor: de(q.solicitado_por),
                creadoEn: q.creado_en,
              }))
          : [],
        historial: historial.map((h) => ({
          id: h.id,
          evento: h.evento,
          estadoNuevo: h.estado_nuevo as EstadoBacklog,
          nota: h.nota,
          usuario: de(h.usuario_id),
          creadoEn: h.creado_en,
        })),
        firmas: firmas.map((f) => ({
          id: f.id,
          tipo: f.tipo as "CIERRE" | "VALIDACION",
          nombre: f.nombre_firmante,
          vigente: f.vigente,
          url: url(f.archivo_id),
          creadoEn: f.creado_en,
        })),
        fotos: adjuntos.map((a) => ({
          id: a.id,
          rol: a.rol as "ANTES" | "DESPUES",
          url: url(a.archivo_id),
        })),
      };
      return detalle;
    },

    async opciones(empresaId) {
      const [equipos, sistemas] = await Promise.all([
        db.rpc("equipos_para_trabajos").then(lista),
        db
          .from("sistemas_mantenimiento")
          .select("id, nombre, activo")
          .eq("empresa_id", empresaId)
          .order("orden")
          .order("nombre")
          .then(lista),
      ]);
      return { equipos, sistemas };
    },

    async responsables(empresaId) {
      const data = await db
        .from("personas")
        .select("id, nombres, apellidos")
        .eq("empresa_id", empresaId)
        .eq("estado", "ACTIVA")
        .order("apellidos")
        .then(lista);
      return data.map((p) => ({
        id: p.id,
        nombre: `${p.nombres} ${p.apellidos}`,
      }));
    },

    async empresa(empresaId) {
      const e = await db
        .from("empresas")
        .select("planificador_puede_validar, zona_horaria")
        .eq("id", empresaId)
        .maybeSingle()
        .then(una);
      return {
        planificadorPuedeValidar: e?.planificador_puede_validar ?? false,
        zonaHoraria: e?.zona_horaria ?? "America/Lima",
      };
    },

    async miFirma() {
      const ruta = await db.rpc("mi_firma").then(una);
      if (!ruta) return null;
      return (await urlsFirmadas(db, [ruta])).get(ruta) ?? "";
    },
  };
}

export const rpc = async (
  r: PromiseLike<{ error: { code?: string; message: string } | null }>,
): Promise<Result<void>> => {
  const { error } = await r;
  return error ? err(aDomainError(error)) : ok(undefined);
};

const columnas = (d: DatosBacklog) => ({
  sistema_id: d.sistemaId ?? "",
  componente: d.componente,
  criticidad: d.criticidad,
  descripcion: d.descripcion,
  fecha_observacion: d.fechaObservacion,
  fecha_programada: d.fechaProgramada,
  costo_estimado: d.costoEstimado,
});

export function crearTrabajosRepositorio(
  db: SupabaseServidor,
): TrabajosRepositorio {
  return {
    async subirImagen(empresaId, carpeta, bytes, tipo) {
      const ruta = `${empresaId}/${carpeta}/${crypto.randomUUID()}.${tipo.ext}`;
      const { error } = await db.storage
        .from(BUCKET)
        .upload(ruta, bytes, { contentType: tipo.mime, upsert: false });
      if (error) {
        console.error("[storage] subida rechazada", { mensaje: error.message });
        return err(new DomainError("VALIDATION", "subida_fallida"));
      }
      return ok(ruta);
    },

    async crear(d, fotos, clave) {
      const { data, error } = await db.rpc("crear_backlog", {
        p_datos: {
          ...columnas(d),
          equipo_id: d.equipoId,
          actividad_id: d.actividadId ?? "",
          parada_id: d.paradaId ?? "",
        },
        p_fotos: fotos,
        p_clave: clave,
      });
      if (error) return err(aDomainError(error));
      return ok({ id: data });
    },

    editar: (id, version, d, motivo) =>
      rpc(
        db.rpc("editar_backlog", {
          p_backlog: id,
          p_version: version,
          p_datos: columnas(d),
          p_motivo: motivo ?? "",
        }),
      ),

    abrirOt: (backlogId, responsableId, clave) =>
      rpc(
        db.rpc("abrir_orden_trabajo", {
          p_backlog: backlogId,
          p_responsable: responsableId,
          p_clave: clave,
        }),
      ),

    crearRequisicion: (otId, d, clave) =>
      rpc(
        db.rpc("crear_requisicion", {
          p_ot: otId,
          p_descripcion: d.descripcion,
          p_cantidad: d.cantidad,
          p_unidad: d.unidad ?? "",
          p_clave: clave,
        }),
      ),

    cambiarRequisicion: (id, estado) =>
      rpc(db.rpc("cambiar_estado_requisicion", { p_id: id, p_estado: estado })),

    cerrar: (backlogId, d, fotos, clave) =>
      rpc(
        db.rpc("cerrar_reporte", {
          p_backlog: backlogId,
          p_fecha: d.fecha,
          p_horometro: d.horometro,
          p_notas: d.notas ?? "",
          p_fotos: fotos,
          p_clave: clave,
        }),
      ),

    validar: (backlogId, aprobar, nota, clave) =>
      rpc(
        db.rpc("validar_trabajo", {
          p_backlog: backlogId,
          p_aprobar: aprobar,
          p_nota: nota ?? "",
          p_clave: clave,
        }),
      ),

    reabrir: (backlogId, nota, clave) =>
      rpc(
        db.rpc("reabrir_trabajo", {
          p_backlog: backlogId,
          p_nota: nota,
          p_clave: clave,
        }),
      ),

    guardarFirma: (ruta) => rpc(db.rpc("guardar_mi_firma", { p_ruta: ruta })),
  };
}

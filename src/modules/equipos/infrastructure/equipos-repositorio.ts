import "server-only";
import { DomainError } from "@/shared/kernel/errors";
import { err, ok } from "@/shared/kernel/result";
import { aDomainError } from "@/shared/supabase/errores";
import type { Database } from "@/shared/supabase/database.types";
import type { SupabaseServidor } from "@/shared/supabase/server";
import type {
  EstadoMovilizacion,
  EstadoOperativo,
  OrigenLectura,
} from "../domain/equipo";
import type { DatosEquipo } from "../application/esquemas";
import type {
  EquipoFila,
  EquiposRepositorio,
  LectorEquipos,
  ResultadoFilaImportada,
} from "../application/repositorios";

type FilaEquipo = Database["public"]["Tables"]["equipos"]["Row"];

const columnas = (d: DatosEquipo) => ({
  codigo: d.codigo,
  categoria_id: d.categoriaId,
  ubicacion_id: d.ubicacionId,
  marca: d.marca,
  modelo: d.modelo,
  numero_serie: d.numeroSerie,
  id_externo: d.idExterno,
  estado_operativo: d.estadoOperativo,
  estado_movilizacion: d.estadoMovilizacion,
  requiere_engrase: d.requiereEngrase,
});

// Nombres de categorías y ubicaciones de la empresa, para mostrar junto a cada equipo.
async function nombres(db: SupabaseServidor, empresaId: string) {
  const [cats, ubis] = await Promise.all([
    db
      .from("categorias_equipo")
      .select("id, nombre, tipo_medidor")
      .eq("empresa_id", empresaId),
    db.from("ubicaciones").select("id, nombre").eq("empresa_id", empresaId),
  ]);
  if (cats.error) throw aDomainError(cats.error);
  if (ubis.error) throw aDomainError(ubis.error);
  return {
    categoria: new Map(cats.data.map((c) => [c.id, c])),
    ubicacion: new Map(ubis.data.map((u) => [u.id, u.nombre])),
  };
}

function aFila(
  f: FilaEquipo,
  n: Awaited<ReturnType<typeof nombres>>,
): EquipoFila {
  const cat = n.categoria.get(f.categoria_id);
  return {
    id: f.id,
    codigo: f.codigo,
    marca: f.marca,
    modelo: f.modelo,
    categoria: cat?.nombre ?? "—",
    tipoMedidor: cat?.tipo_medidor === "KILOMETROS" ? "KILOMETROS" : "HORAS",
    ubicacion: f.ubicacion_id
      ? (n.ubicacion.get(f.ubicacion_id) ?? null)
      : null,
    estadoOperativo: f.estado_operativo as EstadoOperativo,
    estadoMovilizacion: f.estado_movilizacion as EstadoMovilizacion,
    // numeric llega como texto desde PostgREST.
    horometroActual: Number(f.horometro_actual),
    horometroActualEn: f.horometro_actual_en,
  };
}

export function crearLectorEquipos(db: SupabaseServidor): LectorEquipos {
  return {
    async listar(empresaId, filtro) {
      let q = db
        .from("equipos")
        .select("*")
        .eq("empresa_id", empresaId)
        .is("eliminado_en", null);
      q = filtro.inactivos
        ? q.eq("estado_movilizacion", "DESMOVILIZADO")
        : q.neq("estado_movilizacion", "DESMOVILIZADO");
      if (filtro.buscar) {
        // buscar ya viene sin comas, paréntesis ni comodines (sanearBusqueda).
        const t = `%${filtro.buscar}%`;
        q = q.or(`codigo.ilike.${t},marca.ilike.${t},modelo.ilike.${t}`);
      }
      // shortcut: hasta 1000 equipos y paginación en memoria; paginar en la base si una flota pasa de eso.
      const [{ data, error }, n] = await Promise.all([
        q.order("codigo").limit(1000),
        nombres(db, empresaId),
      ]);
      if (error) throw aDomainError(error);
      return data.map((f) => aFila(f, n));
    },

    async obtener(id) {
      const { data, error } = await db
        .from("equipos")
        .select("*")
        .eq("id", id)
        .is("eliminado_en", null)
        .maybeSingle();
      if (error) throw aDomainError(error);
      if (!data) return null;
      const n = await nombres(db, data.empresa_id);
      return {
        ...aFila(data, n),
        categoriaId: data.categoria_id,
        ubicacionId: data.ubicacion_id,
        numeroSerie: data.numero_serie,
        idExterno: data.id_externo,
        requiereEngrase: data.requiere_engrase,
        version: data.version,
        creadoEn: data.creado_en,
      };
    },

    async lecturas(equipoId) {
      const [{ data, error }, autores] = await Promise.all([
        db
          .from("lecturas_horometro")
          .select(
            "id, valor, fecha, origen_tipo, es_correccion, motivo_correccion, creado_en",
          )
          .eq("equipo_id", equipoId)
          .order("creado_en", { ascending: false })
          .limit(500),
        db.rpc("autores_lecturas", { p_equipo: equipoId }),
      ]);
      if (error) throw aDomainError(error);
      if (autores.error) throw aDomainError(autores.error);
      const autor = new Map(
        autores.data.map((a) => [a.lectura_id, a.nombre] as const),
      );
      return data.map((l) => ({
        id: l.id,
        valor: Number(l.valor),
        fecha: l.fecha,
        origen: l.origen_tipo as OrigenLectura,
        esCorreccion: l.es_correccion,
        motivo: l.motivo_correccion,
        creadoEn: l.creado_en,
        autor: autor.get(l.id) || null,
      }));
    },
  };
}

export function crearEquiposRepositorio(
  db: SupabaseServidor,
): EquiposRepositorio {
  return {
    async crear(empresaId, d) {
      const { data, error } = await db
        .from("equipos")
        .insert({
          empresa_id: empresaId,
          ...columnas(d),
          horometro_actual: d.horometroInicial,
        })
        .select("id")
        .single();
      if (error) return err(aDomainError(error));
      return ok({ id: data.id });
    },

    async actualizar(id, version, d) {
      const { data, error } = await db
        .from("equipos")
        .update(columnas(d))
        .eq("id", id)
        .eq("version", version)
        .select("id");
      if (error) return err(aDomainError(error));
      if (data.length === 0) {
        return err(
          new DomainError("CONFLICT", "otro lo cambió o no puede editarlo"),
        );
      }
      return ok(undefined);
    },

    async cambiarMovilizacion(id, estado) {
      const { data, error } = await db
        .from("equipos")
        .update({ estado_movilizacion: estado })
        .eq("id", id)
        .select("id");
      if (error) return err(aDomainError(error));
      if (data.length === 0) {
        return err(new DomainError("NOT_FOUND", "equipo no existe"));
      }
      return ok(undefined);
    },

    async paraLectura(id) {
      const { data, error } = await db
        .from("equipos")
        .select("id, empresa_id, horometro_actual, estado_movilizacion")
        .eq("id", id)
        .is("eliminado_en", null)
        .maybeSingle();
      if (error) return err(aDomainError(error));
      if (!data) return err(new DomainError("NOT_FOUND", "equipo no existe"));
      const empresa = await db
        .from("empresas")
        .select("zona_horaria")
        .eq("id", data.empresa_id)
        .maybeSingle();
      if (empresa.error) return err(aDomainError(empresa.error));
      return ok({
        id: data.id,
        empresaId: data.empresa_id,
        horometroActual: Number(data.horometro_actual),
        estadoMovilizacion: data.estado_movilizacion as EstadoMovilizacion,
        zonaHoraria: empresa.data?.zona_horaria ?? "America/Lima",
      });
    },

    async insertarLectura(d) {
      const { error } = await db.from("lecturas_horometro").insert({
        empresa_id: d.empresaId,
        equipo_id: d.equipoId,
        valor: d.valor,
        fecha: d.fecha,
        origen_tipo: "MANUAL",
        es_correccion: d.esCorreccion,
        motivo_correccion: d.motivo,
      });
      if (error) return err(aDomainError(error));
      return ok(undefined);
    },

    async importar(filas) {
      const { data, error } = await db.rpc("importar_equipos", {
        p_filas: filas.map(({ fila, equipo: e }) => ({
          fila,
          codigo: e.codigo,
          categoria_id: e.categoriaId,
          ubicacion_id: e.ubicacionId,
          marca: e.marca,
          modelo: e.modelo,
          numero_serie: e.numeroSerie,
          id_externo: e.idExterno,
          estado_operativo: e.estadoOperativo,
          horometro: e.horometro,
        })),
      });
      if (error) return err(aDomainError(error));
      return ok(data as ResultadoFilaImportada[]);
    },
  };
}

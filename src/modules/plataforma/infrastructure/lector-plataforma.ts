import "server-only";
import { aDomainError } from "@/shared/supabase/errores";
import type { SupabaseServidor } from "@/shared/supabase/server";
import {
  ESTADOS_MEMBRESIA,
  type EstadoMembresia,
} from "../domain/estado-membresia";
import type {
  DetalleEmpresa,
  EmpresaResumen,
  LectorPlataforma,
  Plan,
} from "../application/consultas";

type FilaPlan = {
  id: string;
  codigo: string;
  nombre: string;
  max_accesos: number | null;
  precio_mensual: number;
  moneda: string;
};

const aPlan = (p: FilaPlan): Plan => ({
  id: p.id,
  codigo: p.codigo,
  nombre: p.nombre,
  maxAccesos: p.max_accesos,
  precioMensual: Number(p.precio_mensual),
  moneda: p.moneda,
});

const aEstado = (v: string | null): EstadoMembresia =>
  ESTADOS_MEMBRESIA.find((e) => e === v) ?? "INACTIVA";

const COLUMNAS_PLAN = "id, codigo, nombre, max_accesos, precio_mensual, moneda";

// Planes activos. Sirve igual con sesión de superadmin o con el cliente público.
export async function leerPlanesActivos(
  db: Pick<SupabaseServidor, "from">,
): Promise<Plan[]> {
  const { data, error } = await db
    .from("planes")
    .select(COLUMNAS_PLAN)
    .eq("activo", true)
    .order("precio_mensual");
  if (error) throw aDomainError(error);
  return data.map(aPlan);
}

export function crearLectorPlataforma(db: SupabaseServidor): LectorPlataforma {
  return {
    listarPlanes: () => leerPlanesActivos(db),

    async listarEmpresas(): Promise<EmpresaResumen[]> {
      const [vista, contacto] = await Promise.all([
        db.from("v_empresas_estado").select("*").order("nombre").limit(500),
        db
          .from("empresas")
          .select("id, razon_social, correo_contacto")
          .limit(500),
      ]);
      if (vista.error) throw aDomainError(vista.error);
      if (contacto.error) throw aDomainError(contacto.error);
      const datos = new Map(contacto.data.map((c) => [c.id, c]));
      return vista.data.flatMap((f) =>
        f.empresa_id && f.nombre && f.ruc && f.plan_id
          ? [
              {
                id: f.empresa_id,
                nombre: f.nombre,
                ruc: f.ruc,
                razonSocial: datos.get(f.empresa_id)?.razon_social ?? null,
                correoContacto:
                  datos.get(f.empresa_id)?.correo_contacto ?? null,
                planId: f.plan_id,
                estado: aEstado(f.estado),
                fechaInicio: f.fecha_inicio,
                fechaFin: f.fecha_fin,
                diasGracia: f.dias_gracia ?? 0,
                motivoInactivacion: f.motivo_inactivacion,
              },
            ]
          : [],
      );
    },

    async obtenerEmpresa(id: string): Promise<DetalleEmpresa | null> {
      const [empresa, estado, pagos, membresias] = await Promise.all([
        db
          .from("empresas")
          .select(
            "id, nombre, razon_social, ruc, correo_contacto, plan_id, estado, dias_gracia, zona_horaria, motivo_inactivacion, precio_mensual, moneda",
          )
          .eq("id", id)
          .maybeSingle(),
        db
          .from("v_empresas_estado")
          .select("estado, fecha_inicio, fecha_fin")
          .eq("empresa_id", id)
          .maybeSingle(),
        db
          .from("pagos")
          .select("id, monto, moneda, referencia, creado_en, membresia_id")
          .eq("empresa_id", id)
          .order("creado_en", { ascending: false })
          .limit(50),
        db
          .from("membresias")
          .select("id, fecha_inicio, fecha_fin")
          .eq("empresa_id", id),
      ]);
      for (const r of [empresa, estado, pagos, membresias]) {
        if (r.error) throw aDomainError(r.error);
      }
      const e = empresa.data;
      if (!e) return null;

      const periodos = new Map(
        (membresias.data ?? []).map((m) => [
          m.id,
          { inicio: m.fecha_inicio, fin: m.fecha_fin },
        ]),
      );

      return {
        id: e.id,
        nombre: e.nombre,
        ruc: e.ruc,
        planId: e.plan_id,
        activa: e.estado === "ACTIVA",
        razonSocial: e.razon_social,
        correoContacto: e.correo_contacto,
        zonaHoraria: e.zona_horaria,
        precioMensual: Number(e.precio_mensual),
        moneda: e.moneda,
        diasGracia: e.dias_gracia,
        motivoInactivacion: e.motivo_inactivacion,
        estado: aEstado(estado.data?.estado ?? null),
        fechaInicio: estado.data?.fecha_inicio ?? null,
        fechaFin: estado.data?.fecha_fin ?? null,
        pagos: (pagos.data ?? []).map((p) => ({
          id: p.id,
          monto: Number(p.monto),
          moneda: p.moneda,
          referencia: p.referencia,
          registradoEn: p.creado_en,
          periodo: p.membresia_id
            ? (periodos.get(p.membresia_id) ?? null)
            : null,
        })),
      };
    },
  };
}

import "server-only";
import type { Actor } from "@/shared/kernel/actor";
import { aDomainError } from "@/shared/supabase/errores";
import type { SupabaseServidor } from "@/shared/supabase/server";
import type { LectorIdentidad, Personal } from "../application/consultas";
import { nombreCompleto } from "../domain/reglas-persona-cuenta";

export function crearLectorIdentidad(db: SupabaseServidor): LectorIdentidad {
  return {
    async personal(empresaId): Promise<Personal | null> {
      const [empresa, personas, cuentas, usados] = await Promise.all([
        db
          .from("empresas")
          .select("id, nombre, planes(max_accesos)")
          .eq("id", empresaId)
          .maybeSingle(),
        db
          .from("personas")
          .select(
            "id, nombres, apellidos, tipo_documento, numero_documento, cargo, telefono, tipo_vinculo, estado",
          )
          .eq("empresa_id", empresaId)
          .order("estado")
          .order("apellidos")
          .limit(500),
        db
          .from("usuarios")
          .select(
            "id, correo, rol, persona_id, debe_cambiar_clave, ultimo_acceso_en",
          )
          .eq("empresa_id", empresaId)
          .order("rol")
          .order("correo"),
        db
          .from("usuarios")
          .select("id", { count: "exact", head: true })
          .eq("empresa_id", empresaId),
      ]);
      for (const r of [empresa, personas, cuentas, usados]) {
        if (r.error) throw aDomainError(r.error);
      }
      if (!empresa.data) return null;

      const plan = empresa.data.planes as { max_accesos: number | null } | null;
      const filasPersonas = personas.data ?? [];
      const nombrePorId = new Map(
        filasPersonas.map((p) => [p.id, nombreCompleto(p)]),
      );
      const cuentaPorPersona = new Map(
        (cuentas.data ?? []).flatMap((c) =>
          c.persona_id ? [[c.persona_id, c.id] as const] : [],
        ),
      );

      return {
        empresa: { id: empresa.data.id, nombre: empresa.data.nombre },
        cupo: { usados: usados.count ?? 0, maximo: plan?.max_accesos ?? null },
        personas: filasPersonas.map((p) => ({
          id: p.id,
          nombres: p.nombres,
          apellidos: p.apellidos,
          documento: p.numero_documento
            ? `${p.tipo_documento} ${p.numero_documento}`
            : null,
          tipoDocumento: p.tipo_documento,
          numeroDocumento: p.numero_documento,
          cargo: p.cargo,
          telefono: p.telefono,
          tipoVinculo: p.tipo_vinculo,
          activa: p.estado === "ACTIVA",
          cuentaId: cuentaPorPersona.get(p.id) ?? null,
        })),
        cuentas: (cuentas.data ?? []).map((c) => ({
          id: c.id,
          correo: c.correo,
          rol: c.rol,
          persona: c.persona_id
            ? { id: c.persona_id, nombre: nombrePorId.get(c.persona_id) ?? "—" }
            : null,
          debeCambiarClave: c.debe_cambiar_clave,
          ultimoAcceso: c.ultimo_acceso_en,
        })),
      };
    },

    async miPerfil(actor: Actor) {
      const [persona, empresa] = await Promise.all([
        actor.personaId
          ? db
              .from("personas")
              .select("nombres, apellidos, cargo")
              .eq("id", actor.personaId)
              .maybeSingle()
          : Promise.resolve({ data: null, error: null }),
        actor.empresaId
          ? db
              .from("empresas")
              .select("nombre")
              .eq("id", actor.empresaId)
              .maybeSingle()
          : Promise.resolve({ data: null, error: null }),
      ]);
      if (persona.error) throw aDomainError(persona.error);
      if (empresa.error) throw aDomainError(empresa.error);
      return {
        nombre: persona.data ? nombreCompleto(persona.data) : null,
        cargo: persona.data?.cargo ?? null,
        empresa: empresa.data?.nombre ?? null,
      };
    },
  };
}

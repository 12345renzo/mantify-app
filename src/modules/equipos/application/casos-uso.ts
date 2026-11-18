import {
  empresaDeTrabajo,
  exigirPermiso,
} from "@/modules/identidad/application/acceso";
import type { Actor } from "@/shared/kernel/actor";
import { DomainError } from "@/shared/kernel/errors";
import { hoyEn } from "@/shared/kernel/fechas";
import { err, ok, type Result } from "@/shared/kernel/result";
import { validarLectura } from "../domain/horometro";
import type {
  CrearEquipoEntrada,
  EditarEquipoEntrada,
  LecturaEntrada,
  MovilizacionEntrada,
} from "./esquemas";
import type {
  EquipoDetalle,
  EquipoFila,
  EquiposRepositorio,
  LectorEquipos,
  Lectura,
} from "./repositorios";

// Solo letras, números, espacio y . _ / - : el texto va dentro de un filtro de PostgREST.
export function sanearBusqueda(texto: string | undefined): string | null {
  const t = (texto ?? "")
    .replace(/[^\p{L}\p{N} ._/-]/gu, "")
    .trim()
    .slice(0, 40);
  return t || null;
}

export async function listarEquipos(
  actor: Actor | null,
  filtro: { inactivos: boolean; buscar: string | null },
  repos: { lector: LectorEquipos },
): Promise<Result<EquipoFila[]>> {
  const permiso = exigirPermiso(actor, "leer", "flota");
  if (!permiso.ok) return permiso;
  const empresa = empresaDeTrabajo(permiso.value, null);
  if (!empresa.ok) return empresa;
  return ok(await repos.lector.listar(empresa.value, filtro));
}

export async function verEquipo(
  actor: Actor | null,
  id: string,
  repos: { lector: LectorEquipos },
): Promise<Result<{ equipo: EquipoDetalle; lecturas: Lectura[] } | null>> {
  const permiso = exigirPermiso(actor, "leer", "flota");
  if (!permiso.ok) return permiso;
  // RLS solo devuelve equipos de su empresa: otro id = null (no existe).
  const [equipo, lecturas] = await Promise.all([
    repos.lector.obtener(id),
    repos.lector.lecturas(id),
  ]);
  return ok(equipo ? { equipo, lecturas } : null);
}

export async function crearEquipo(
  actor: Actor | null,
  entrada: CrearEquipoEntrada,
  repos: { equipos: EquiposRepositorio },
): Promise<Result<{ id: string }>> {
  const permiso = exigirPermiso(actor, "crear", "flota");
  if (!permiso.ok) return permiso;
  const empresa = empresaDeTrabajo(permiso.value, null);
  if (!empresa.ok) return empresa;
  return repos.equipos.crear(empresa.value, entrada);
}

export async function editarEquipo(
  actor: Actor | null,
  entrada: EditarEquipoEntrada,
  repos: { equipos: EquiposRepositorio },
): Promise<Result<void>> {
  const permiso = exigirPermiso(actor, "editar", "flota");
  if (!permiso.ok) return permiso;
  const { id, version, ...datos } = entrada;
  return repos.equipos.actualizar(id, version, datos);
}

// Desmovilizar = baja: pasa a inactivos con su historial. No se borra.
export async function cambiarMovilizacion(
  actor: Actor | null,
  entrada: MovilizacionEntrada,
  repos: { equipos: EquiposRepositorio },
): Promise<Result<void>> {
  const permiso = exigirPermiso(actor, "dar_baja", "flota");
  if (!permiso.ok) return permiso;
  return repos.equipos.cambiarMovilizacion(entrada.id, entrada.estado);
}

// Lectura normal (sube o igual): planificador y supervisor. Corrección a la baja: solo planificador.
export async function registrarLectura(
  actor: Actor | null,
  entrada: LecturaEntrada,
  repos: { equipos: EquiposRepositorio },
  ahora: Date = new Date(),
): Promise<Result<void>> {
  const permiso = exigirPermiso(
    actor,
    entrada.esCorreccion ? "editar" : "crear",
    "horometro",
  );
  if (!permiso.ok) return permiso;
  const empresa = empresaDeTrabajo(permiso.value, null);
  if (!empresa.ok) return empresa;

  const equipo = await repos.equipos.paraLectura(entrada.equipoId);
  if (!equipo.ok) return equipo;
  const e = equipo.value;
  if (e.empresaId !== empresa.value) {
    return err(new DomainError("NOT_FOUND", "equipo de otra empresa"));
  }
  if (e.estadoMovilizacion === "DESMOVILIZADO") {
    return err(new DomainError("VALIDATION", "equipo desmovilizado"));
  }
  if (entrada.fecha > hoyEn(e.zonaHoraria, ahora)) {
    return err(new DomainError("VALIDATION", "fecha futura"));
  }
  const valida = validarLectura(
    e.horometroActual,
    entrada.valor,
    entrada.esCorreccion,
    entrada.motivo,
  );
  if (!valida.ok) return valida;

  return repos.equipos.insertarLectura({
    empresaId: e.empresaId,
    equipoId: e.id,
    valor: entrada.valor,
    fecha: entrada.fecha,
    esCorreccion: entrada.esCorreccion,
    motivo: entrada.esCorreccion ? entrada.motivo : null,
  });
}

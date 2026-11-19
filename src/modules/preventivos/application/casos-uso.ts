import {
  empresaDeTrabajo,
  exigirPermiso,
} from "@/modules/identidad/application/acceso";
import {
  crearBacklog,
  revisarImagenes,
} from "@/modules/trabajos/application/casos-uso";
import { MAX_FOTOS } from "@/modules/trabajos/domain/fotos";
import type { Actor } from "@/shared/kernel/actor";
import { DomainError } from "@/shared/kernel/errors";
import { hoyEn, type FechaISO } from "@/shared/kernel/fechas";
import { err, ok, type Result } from "@/shared/kernel/result";
import { revisarActividades } from "../domain/actividad-observada";
import {
  LIMITES_CSV,
  prepararCsv,
  type ErrorFila,
} from "../domain/importacion-csv";
import { siguienteProgramacion } from "../domain/plan-recurrencia";
import {
  programa,
  puedeEjecutar,
  puedeValidarPreventivo,
} from "../domain/preventivo-estado";
import type {
  BacklogObservacionEntrada,
  EjecutarEntrada,
  ProgramarEntrada,
  ReprogramarEntrada,
  ValidarPreventivoEntrada,
} from "./esquemas";
import type {
  LectorPreventivos,
  OpcionesPreventivo,
  PreventivoDetalle,
  PreventivoFila,
  ReposPreventivos,
} from "./repositorios";

const noEncontrado = () =>
  err(new DomainError("NOT_FOUND", "preventivo no existe"));

// Permiso del módulo de trabajos (mismos roles) y, si se pide, ser de planificación.
async function contexto(
  actor: Actor | null,
  accion: "leer" | "crear" | "editar",
  repos: Pick<ReposPreventivos, "trabajos">,
  soloPlanificacion = false,
) {
  const permiso = exigirPermiso(actor, accion, "trabajos");
  if (!permiso.ok) return permiso;
  if (soloPlanificacion && !programa(permiso.value.rol)) {
    return err(new DomainError("FORBIDDEN", "solo planificación"));
  }
  const empresaId = empresaDeTrabajo(permiso.value, null);
  if (!empresaId.ok) return empresaId;
  const empresa = await repos.trabajos.lector.empresa(empresaId.value);
  return ok({ actor: permiso.value, empresaId: empresaId.value, empresa });
}

export async function listarPreventivos(
  actor: Actor | null,
  repos: { lector: LectorPreventivos },
): Promise<Result<PreventivoFila[]>> {
  const permiso = exigirPermiso(actor, "leer", "trabajos");
  if (!permiso.ok) return permiso;
  const empresa = empresaDeTrabajo(permiso.value, null);
  if (!empresa.ok) return empresa;
  return ok(await repos.lector.listar(empresa.value));
}

export async function opcionesPreventivo(
  actor: Actor | null,
  repos: { lector: LectorPreventivos },
): Promise<Result<OpcionesPreventivo>> {
  const permiso = exigirPermiso(actor, "crear", "trabajos");
  if (!permiso.ok) return permiso;
  if (!programa(permiso.value.rol)) {
    return err(new DomainError("FORBIDDEN", "solo planificación"));
  }
  const empresa = empresaDeTrabajo(permiso.value, null);
  if (!empresa.ok) return empresa;
  return ok(await repos.lector.opciones(empresa.value));
}

export type VistaPreventivo = {
  preventivo: PreventivoDetalle;
  ejecuta: boolean;
  valida: boolean;
  reprograma: boolean;
  creaBacklog: boolean;
  tieneFirma: boolean;
  // Para marcar al personal que participó (solo si puede ejecutar).
  personas: { id: string; nombre: string }[];
  hoy: FechaISO;
  // Propuesta para programar el siguiente (solo validados con recurrencia).
  siguiente: { fecha: FechaISO | null; horometro: number | null } | null;
};

export async function verPreventivo(
  actor: Actor | null,
  id: string,
  repos: ReposPreventivos,
  ahora: Date = new Date(),
): Promise<Result<VistaPreventivo | null>> {
  const c = await contexto(actor, "leer", repos);
  if (!c.ok) return c;
  const a = c.value.actor;
  const [p, firma] = await Promise.all([
    repos.lector.obtener(id),
    repos.trabajos.lector.miFirma(),
  ]);
  if (!p) return ok(null);
  const escribe = exigirPermiso(a, "editar", "trabajos").ok;
  const recurrente = p.cadaDias !== null || p.cadaHoras !== null;
  const ejecuta =
    escribe && puedeEjecutar(p.estado, a.rol, p.responsableId === a.personaId);
  return ok({
    preventivo: p,
    ejecuta,
    personas: ejecuta ? await repos.lector.personas() : [],
    valida:
      escribe &&
      puedeValidarPreventivo(p.estado, a.rol, {
        esPropio: p.ejecutadoPorId === a.id,
        planificadorPuedeValidar: c.value.empresa.planificadorPuedeValidar,
      }),
    reprograma: escribe && programa(a.rol) && p.estado === "PROGRAMADO",
    creaBacklog: exigirPermiso(a, "crear", "trabajos").ok,
    tieneFirma: firma !== null,
    hoy: hoyEn(c.value.empresa.zonaHoraria, ahora),
    siguiente:
      p.estado === "VALIDADO" && recurrente && p.fechaEjecucion
        ? siguienteProgramacion(p, {
            fecha: p.fechaEjecucion,
            horometro: p.horometroEjecucion,
          })
        : null,
  });
}

export async function programarPreventivo(
  actor: Actor | null,
  entrada: ProgramarEntrada,
  repos: ReposPreventivos,
): Promise<Result<{ id: string }>> {
  const c = await contexto(actor, "crear", repos, true);
  if (!c.ok) return c;
  const { clave, ...datos } = entrada;
  return repos.preventivos.programar(datos, clave);
}

export type ResumenImportacion = {
  creados: number;
  omitidos: number;
  errores: ErrorFila[];
};

const MOTIVO_BASE = {
  EQUIPO: "No hay un equipo movilizado con ese código.",
  PLAN: "No hay un plan activo con ese nombre (Catálogos → Planes preventivos).",
  DATOS: "Algún dato no es válido para guardar.",
} as const;

// Crea los preventivos nuevos; el que ya existe (equipo + plan + fecha) se omite, así importar
// el mismo archivo dos veces no duplica. Las filas con error se informan sin cortar el resto.
export async function importarPreventivos(
  actor: Actor | null,
  texto: string,
  repos: ReposPreventivos,
): Promise<Result<ResumenImportacion>> {
  const c = await contexto(actor, "crear", repos, true);
  if (!c.ok) return c;
  if (new TextEncoder().encode(texto).length > LIMITES_CSV.bytes) {
    return err(new DomainError("VALIDATION", "ARCHIVO_GRANDE"));
  }
  const prep = prepararCsv(texto);
  if (!prep.ok) return err(new DomainError("VALIDATION", prep.error));
  const errores = [...prep.errores];
  let creados = 0;
  let omitidos = 0;
  if (prep.validas.length) {
    const r = await repos.preventivos.importar(prep.validas);
    if (!r.ok) return r;
    for (const x of r.value) {
      if ("error" in x)
        errores.push({ fila: x.fila, motivo: MOTIVO_BASE[x.error] });
      else if (x.accion === "CREADO") creados++;
      else omitidos++;
    }
  }
  errores.sort((a, b) => a.fila - b.fila);
  return ok({ creados, omitidos, errores });
}

// El técnico registra lo hecho: actividades, horas, turno, repuestos, personal y fotos. Queda por validar.
export async function ejecutarPreventivo(
  actor: Actor | null,
  entrada: EjecutarEntrada,
  fotos: Uint8Array[],
  repos: ReposPreventivos,
  ahora: Date = new Date(),
): Promise<Result<void>> {
  const c = await contexto(actor, "editar", repos);
  if (!c.ok) return c;
  const a = c.value.actor;
  const [p, firma] = await Promise.all([
    repos.lector.obtener(entrada.preventivoId),
    repos.trabajos.lector.miFirma(),
  ]);
  if (!p) return noEncontrado();
  if (!puedeEjecutar(p.estado, a.rol, p.responsableId === a.personaId)) {
    return err(
      new DomainError(
        p.estado === "PROGRAMADO" || p.estado === "DEVUELTO"
          ? "FORBIDDEN"
          : "CONFLICT",
        a.rol === "TECNICO" ? "no_responsable" : "estado_cambio",
      ),
    );
  }
  if (firma === null) return err(new DomainError("VALIDATION", "sin_firma"));
  const acts = revisarActividades(
    p.actividades.map((x) => x.id),
    entrada.actividades,
  );
  if (!acts.ok) return acts;
  if (entrada.fechaEjecucion > hoyEn(c.value.empresa.zonaHoraria, ahora)) {
    return err(new DomainError("VALIDATION", "fecha_futura"));
  }
  if (p.fotos.length + fotos.length > MAX_FOTOS) {
    return err(new DomainError("VALIDATION", "fotos_maximo"));
  }
  const tipos = revisarImagenes(fotos);
  if (!tipos.ok) return tipos;
  // shortcut: si la base rechaza después de subir, las fotos quedan huérfanas (igual que en backlogs).
  const rutas: string[] = [];
  for (const [i, bytes] of fotos.entries()) {
    const r = await repos.trabajos.trabajos.subirImagen(
      c.value.empresaId,
      "preventivos",
      bytes,
      tipos.value[i],
    );
    if (!r.ok) return r;
    rutas.push(r.value);
  }
  const { preventivoId, clave, ...datos } = entrada;
  return repos.preventivos.ejecutar(preventivoId, datos, rutas, clave);
}

// El supervisor aprueba (con su firma) o devuelve con lo que falta.
export async function validarPreventivo(
  actor: Actor | null,
  entrada: ValidarPreventivoEntrada,
  repos: ReposPreventivos,
): Promise<Result<void>> {
  const c = await contexto(actor, "editar", repos);
  if (!c.ok) return c;
  const a = c.value.actor;
  const [p, firma] = await Promise.all([
    repos.lector.obtener(entrada.preventivoId),
    repos.trabajos.lector.miFirma(),
  ]);
  if (!p) return noEncontrado();
  if (p.estado !== "COMPLETADO") {
    return err(new DomainError("CONFLICT", "estado_cambio"));
  }
  const esPropio = p.ejecutadoPorId === a.id;
  if (
    !puedeValidarPreventivo(p.estado, a.rol, {
      esPropio,
      planificadorPuedeValidar: c.value.empresa.planificadorPuedeValidar,
    })
  ) {
    return err(
      new DomainError(
        "FORBIDDEN",
        esPropio ? "propio_cierre" : "no autorizado",
      ),
    );
  }
  const aprobar = entrada.decision === "APROBAR";
  if (aprobar && firma === null) {
    return err(new DomainError("VALIDATION", "sin_firma"));
  }
  return repos.preventivos.validar(
    p.id,
    aprobar,
    entrada.nota || null,
    entrada.clave,
  );
}

export async function reprogramarPreventivo(
  actor: Actor | null,
  entrada: ReprogramarEntrada,
  repos: ReposPreventivos,
  ahora: Date = new Date(),
): Promise<Result<void>> {
  const c = await contexto(actor, "editar", repos, true);
  if (!c.ok) return c;
  const p = await repos.lector.obtener(entrada.preventivoId);
  if (!p) return noEncontrado();
  if (p.estado !== "PROGRAMADO") {
    return err(new DomainError("CONFLICT", "estado_cambio"));
  }
  if (entrada.fecha < hoyEn(c.value.empresa.zonaHoraria, ahora)) {
    return err(new DomainError("VALIDATION", "fecha_pasada"));
  }
  return repos.preventivos.reprogramar(p.id, entrada.fecha, entrada.clave);
}

// Una actividad OBSERVADO pasa a la bandeja de trabajos como backlog con origen PREVENTIVO.
// La clave es el id de la actividad: un reintento devuelve el mismo backlog.
export async function generarBacklogDesdeObservacion(
  actor: Actor | null,
  entrada: BacklogObservacionEntrada,
  repos: ReposPreventivos,
  ahora: Date = new Date(),
): Promise<Result<{ id: string }>> {
  const c = await contexto(actor, "crear", repos);
  if (!c.ok) return c;
  const p = await repos.lector.obtener(entrada.preventivoId);
  if (!p) return noEncontrado();
  const act = p.actividades.find((x) => x.id === entrada.actividadId);
  if (
    !act ||
    act.resultado !== "OBSERVADO" ||
    act.backlog ||
    !p.fechaEjecucion
  ) {
    return err(new DomainError("VALIDATION", "actividad_no_valida"));
  }
  const hoy = hoyEn(c.value.empresa.zonaHoraria, ahora);
  return crearBacklog(
    actor,
    {
      equipoId: p.equipoId,
      sistemaId: null,
      componente: act.descripcion.slice(0, 120),
      criticidad: entrada.criticidad,
      descripcion: `${act.observacion ?? ""} (${p.codigo})`.slice(0, 1000),
      fechaObservacion: p.fechaEjecucion,
      fechaProgramada: hoy,
      costoEstimado: 0,
      clave: act.id,
      actividadId: act.id,
    },
    [],
    repos.trabajos,
    ahora,
  );
}

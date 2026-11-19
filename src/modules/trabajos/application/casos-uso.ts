import {
  empresaDeTrabajo,
  exigirPermiso,
} from "@/modules/identidad/application/acceso";
import type { Actor } from "@/shared/kernel/actor";
import { DomainError } from "@/shared/kernel/errors";
import { hoyEn } from "@/shared/kernel/fechas";
import { err, ok, type Result } from "@/shared/kernel/result";
import {
  eventosDisponibles,
  puedeEditar,
  transicionar,
  type EventoBacklog,
} from "../domain/backlog-estado";
import {
  MAX_BYTES_IMAGEN,
  MAX_FOTOS,
  MAX_LADO,
  MIN_FIRMA,
  medidasImagen,
  tipoImagen,
  type TipoImagen,
} from "../domain/fotos";
import { puedeCerrar } from "../domain/reglas-cierre";
import type {
  AbrirOtEntrada,
  CerrarReporteEntrada,
  CrearBacklogEntrada,
  EditarBacklogEntrada,
  EstadoRequisicionEntrada,
  ReabrirEntrada,
  RequisicionEntrada,
  ValidarEntrada,
} from "./esquemas";
import type {
  BacklogDetalle,
  BacklogFila,
  LectorTrabajos,
  OpcionesTrabajo,
  TrabajosRepositorio,
  VistaBandeja,
} from "./repositorios";

type Repos = { lector: LectorTrabajos; trabajos: TrabajosRepositorio };

const noEncontrado = () =>
  err(new DomainError("NOT_FOUND", "backlog no existe"));

// Lo que el actor necesita para escribir: su empresa y sus reglas de validación.
async function contexto(
  actor: Actor | null,
  accion: "crear" | "editar",
  repos: Repos,
) {
  const permiso = exigirPermiso(actor, accion, "trabajos");
  if (!permiso.ok) return permiso;
  const empresaId = empresaDeTrabajo(permiso.value, null);
  if (!empresaId.ok) return empresaId;
  const empresa = await repos.lector.empresa(empresaId.value);
  return ok({ actor: permiso.value, empresaId: empresaId.value, empresa });
}

// Cada archivo: tamaño, tipo real por firma binaria (no por extensión ni por lo que diga el navegador),
// archivo completo sin nada pegado al final, y medidas razonables. Devuelve los tipos en el mismo orden.
export function revisarImagenes(
  archivos: Uint8Array[],
  permitidos: TipoImagen["mime"][] = ["image/jpeg", "image/png", "image/webp"],
  minimo = { ancho: 1, alto: 1 },
): Result<TipoImagen[]> {
  const tipos: TipoImagen[] = [];
  for (const a of archivos) {
    const t = a.length <= MAX_BYTES_IMAGEN ? tipoImagen(a) : null;
    const m = t && permitidos.includes(t.mime) ? medidasImagen(a, t) : null;
    if (
      !t ||
      !m ||
      m.ancho < minimo.ancho ||
      m.alto < minimo.alto ||
      m.ancho > MAX_LADO ||
      m.alto > MAX_LADO
    ) {
      return err(new DomainError("VALIDATION", "foto_no_valida"));
    }
    tipos.push(t);
  }
  return ok(tipos);
}

// shortcut: si la base rechaza después de subir, las fotos quedan huérfanas en Storage; limpiarlas con un job si crece.
async function subirTodas(
  repos: Repos,
  empresaId: string,
  archivos: Uint8Array[],
  tipos: TipoImagen[],
): Promise<Result<string[]>> {
  const rutas: string[] = [];
  for (const [i, bytes] of archivos.entries()) {
    const r = await repos.trabajos.subirImagen(
      empresaId,
      "backlogs",
      bytes,
      tipos[i],
    );
    if (!r.ok) return r;
    rutas.push(r.value);
  }
  return ok(rutas);
}

export async function listarTrabajos(
  actor: Actor | null,
  filtro: { vista: VistaBandeja; buscar: string | null },
  repos: { lector: LectorTrabajos },
): Promise<Result<BacklogFila[]>> {
  const permiso = exigirPermiso(actor, "leer", "trabajos");
  if (!permiso.ok) return permiso;
  const empresa = empresaDeTrabajo(permiso.value, null);
  if (!empresa.ok) return empresa;
  return ok(await repos.lector.listar(empresa.value, filtro));
}

export type VistaTrabajo = {
  backlog: BacklogDetalle;
  eventos: EventoBacklog[];
  edicion: { permitido: boolean; exigeMotivo: boolean };
  // Puede pedir repuestos en la OT abierta.
  pideRepuestos: boolean;
  gestionaRepuestos: boolean;
  tieneFirma: boolean;
  zonaHoraria: string;
};

export async function verTrabajo(
  actor: Actor | null,
  id: string,
  repos: { lector: LectorTrabajos },
): Promise<Result<VistaTrabajo | null>> {
  const permiso = exigirPermiso(actor, "leer", "trabajos");
  if (!permiso.ok) return permiso;
  const a = permiso.value;
  const empresaId = empresaDeTrabajo(a, null);
  if (!empresaId.ok) return empresaId;
  const [backlog, empresa, firma] = await Promise.all([
    repos.lector.obtener(id),
    repos.lector.empresa(empresaId.value),
    repos.lector.miFirma(),
  ]);
  if (!backlog) return ok(null);
  const escribe = exigirPermiso(a, "editar", "trabajos").ok;
  const ctx = {
    esPropio: backlog.cerradoPorId === a.id,
    planificadorPuedeValidar: empresa.planificadorPuedeValidar,
  };
  const esResponsable = backlog.ot?.responsableId === a.personaId;
  return ok({
    backlog,
    // El técnico solo cierra la OT que tiene asignada.
    eventos: escribe
      ? eventosDisponibles(backlog.estado, a.rol, ctx).filter(
          (e) => e !== "CERRAR_RM" || a.rol !== "TECNICO" || esResponsable,
        )
      : [],
    edicion: escribe
      ? puedeEditar(backlog.estado, a.rol, backlog.creadoPorId === a.id, ctx)
      : { permitido: false, exigeMotivo: false },
    pideRepuestos:
      escribe &&
      !!backlog.ot?.abierta &&
      (a.rol !== "TECNICO" || esResponsable),
    gestionaRepuestos: a.rol === "PLANIFICADOR" || a.rol === "SUPERVISOR",
    tieneFirma: firma !== null,
    zonaHoraria: empresa.zonaHoraria,
  });
}

export async function opcionesTrabajo(
  actor: Actor | null,
  repos: { lector: LectorTrabajos },
): Promise<Result<OpcionesTrabajo>> {
  const permiso = exigirPermiso(actor, "crear", "trabajos");
  if (!permiso.ok) return permiso;
  const empresa = empresaDeTrabajo(permiso.value, null);
  if (!empresa.ok) return empresa;
  return ok(await repos.lector.opciones(empresa.value));
}

export async function responsablesOt(
  actor: Actor | null,
  repos: { lector: LectorTrabajos },
): Promise<Result<{ id: string; nombre: string }[]>> {
  const permiso = exigirPermiso(actor, "editar", "trabajos");
  if (!permiso.ok) return permiso;
  if (
    permiso.value.rol !== "PLANIFICADOR" &&
    permiso.value.rol !== "SUPERVISOR"
  ) {
    return err(new DomainError("FORBIDDEN", "solo quien abre OT"));
  }
  const empresa = empresaDeTrabajo(permiso.value, null);
  if (!empresa.ok) return empresa;
  return ok(await repos.lector.responsables(empresa.value));
}

// 1. El técnico (o el supervisor/planificador) detecta la falla: backlog PENDIENTE con fotos "antes".
export async function crearBacklog(
  actor: Actor | null,
  entrada: CrearBacklogEntrada & { actividadId?: string; paradaId?: string },
  fotos: Uint8Array[],
  repos: Repos,
  ahora: Date = new Date(),
): Promise<Result<{ id: string }>> {
  const c = await contexto(actor, "crear", repos);
  if (!c.ok) return c;
  if (fotos.length > MAX_FOTOS) {
    return err(new DomainError("VALIDATION", "fotos_maximo"));
  }
  if (entrada.fechaObservacion > hoyEn(c.value.empresa.zonaHoraria, ahora)) {
    return err(new DomainError("VALIDATION", "fecha_futura"));
  }
  const tipos = revisarImagenes(fotos);
  if (!tipos.ok) return tipos;
  const rutas = await subirTodas(repos, c.value.empresaId, fotos, tipos.value);
  if (!rutas.ok) return rutas;
  const { clave, ...datos } = entrada;
  return repos.trabajos.crear(datos, rutas.value, clave);
}

export async function editarBacklog(
  actor: Actor | null,
  entrada: EditarBacklogEntrada,
  repos: Repos,
): Promise<Result<void>> {
  const c = await contexto(actor, "editar", repos);
  if (!c.ok) return c;
  const b = await repos.lector.obtener(entrada.id);
  if (!b) return noEncontrado();
  const regla = puedeEditar(
    b.estado,
    c.value.actor.rol,
    b.creadoPorId === c.value.actor.id,
    c.value.empresa,
  );
  if (!regla.permitido)
    return err(new DomainError("FORBIDDEN", "no autorizado"));
  if (regla.exigeMotivo && (entrada.motivo?.length ?? 0) < 5) {
    return err(new DomainError("VALIDATION", "nota_obligatoria"));
  }
  const { id, version, motivo, ...datos } = entrada;
  return repos.trabajos.editar(
    id,
    version,
    datos,
    regla.exigeMotivo ? motivo : null,
  );
}

// 2. Supervisor o planificador abre la OT y asigna al responsable: EN_PROCESO.
export async function abrirOrdenTrabajo(
  actor: Actor | null,
  entrada: AbrirOtEntrada,
  repos: Repos,
): Promise<Result<void>> {
  const c = await contexto(actor, "editar", repos);
  if (!c.ok) return c;
  const b = await repos.lector.obtener(entrada.backlogId);
  if (!b) return noEncontrado();
  const t = transicionar(b.estado, "ABRIR_OT", c.value.actor.rol, {
    esPropio: false,
    planificadorPuedeValidar: c.value.empresa.planificadorPuedeValidar,
  });
  if (!t.ok) return t;
  return repos.trabajos.abrirOt(b.id, entrada.responsableId, entrada.clave);
}

// 3. Repuestos para la OT abierta. El técnico solo en su OT.
export async function crearRequisicion(
  actor: Actor | null,
  entrada: RequisicionEntrada,
  repos: Repos,
): Promise<Result<void>> {
  const c = await contexto(actor, "crear", repos);
  if (!c.ok) return c;
  const b = await repos.lector.obtener(entrada.backlogId);
  if (!b) return noEncontrado();
  if (!b.ot?.abierta) return err(new DomainError("VALIDATION", "sin_ot"));
  const a = c.value.actor;
  if (a.rol === "TECNICO" && b.ot.responsableId !== a.personaId) {
    return err(new DomainError("FORBIDDEN", "no_responsable"));
  }
  const { descripcion, cantidad, unidad, clave } = entrada;
  return repos.trabajos.crearRequisicion(
    b.ot.id,
    { descripcion, cantidad, unidad },
    clave,
  );
}

export async function cambiarEstadoRequisicion(
  actor: Actor | null,
  entrada: EstadoRequisicionEntrada,
  repos: Repos,
): Promise<Result<void>> {
  const c = await contexto(actor, "editar", repos);
  if (!c.ok) return c;
  const rol = c.value.actor.rol;
  if (rol !== "PLANIFICADOR" && rol !== "SUPERVISOR") {
    return err(new DomainError("FORBIDDEN", "no autorizado"));
  }
  return repos.trabajos.cambiarRequisicion(entrada.id, entrada.estado);
}

// 4. Cierre con RM: fecha, horómetro, notas, fotos "después" y firma precargada → PENDIENTE_VALIDACION.
export async function cerrarReporte(
  actor: Actor | null,
  entrada: CerrarReporteEntrada,
  fotos: Uint8Array[],
  repos: Repos,
  ahora: Date = new Date(),
): Promise<Result<void>> {
  const c = await contexto(actor, "editar", repos);
  if (!c.ok) return c;
  const a = c.value.actor;
  const [b, firma] = await Promise.all([
    repos.lector.obtener(entrada.backlogId),
    repos.lector.miFirma(),
  ]);
  if (!b) return noEncontrado();
  const regla = puedeCerrar(
    {
      id: a.id,
      rol: a.rol,
      personaId: a.personaId,
      tieneFirma: firma !== null,
    },
    {
      estado: b.estado,
      ot: b.ot && { responsableId: b.ot.responsableId, abierta: b.ot.abierta },
      fotosDespues: b.fotos.filter((f) => f.rol === "DESPUES").length,
    },
    c.value.empresa,
    fotos.length,
  );
  if (!regla.ok) return regla;
  if (entrada.fecha > hoyEn(c.value.empresa.zonaHoraria, ahora)) {
    return err(new DomainError("VALIDATION", "fecha_futura"));
  }
  if (entrada.fecha < b.fechaObservacion) {
    return err(new DomainError("VALIDATION", "fecha_antes_observacion"));
  }
  const tipos = revisarImagenes(fotos);
  if (!tipos.ok) return tipos;
  const rutas = await subirTodas(repos, c.value.empresaId, fotos, tipos.value);
  if (!rutas.ok) return rutas;
  return repos.trabajos.cerrar(
    b.id,
    {
      fecha: entrada.fecha,
      horometro: entrada.horometro,
      notas: entrada.notas,
    },
    rutas.value,
    entrada.clave,
  );
}

// 5. Aprobar (con firma del validador) o devolver con observación.
export async function validarTrabajo(
  actor: Actor | null,
  entrada: ValidarEntrada,
  repos: Repos,
): Promise<Result<void>> {
  const c = await contexto(actor, "editar", repos);
  if (!c.ok) return c;
  const a = c.value.actor;
  const [b, firma] = await Promise.all([
    repos.lector.obtener(entrada.backlogId),
    repos.lector.miFirma(),
  ]);
  if (!b) return noEncontrado();
  const aprobar = entrada.decision === "APROBAR";
  const t = transicionar(b.estado, aprobar ? "APROBAR" : "DEVOLVER", a.rol, {
    esPropio: b.cerradoPorId === a.id,
    planificadorPuedeValidar: c.value.empresa.planificadorPuedeValidar,
  });
  if (!t.ok) return t;
  if (aprobar && firma === null) {
    return err(new DomainError("VALIDATION", "sin_firma"));
  }
  return repos.trabajos.validar(
    b.id,
    aprobar,
    entrada.nota || null,
    entrada.clave,
  );
}

// Reabrir un completado: las firmas quedan en el historial pero dejan de valer.
export async function reabrirTrabajo(
  actor: Actor | null,
  entrada: ReabrirEntrada,
  repos: Repos,
): Promise<Result<void>> {
  const c = await contexto(actor, "editar", repos);
  if (!c.ok) return c;
  const b = await repos.lector.obtener(entrada.backlogId);
  if (!b) return noEncontrado();
  const t = transicionar(b.estado, "REABRIR", c.value.actor.rol, {
    esPropio: false,
    planificadorPuedeValidar: c.value.empresa.planificadorPuedeValidar,
  });
  if (!t.ok) return t;
  return repos.trabajos.reabrir(b.id, entrada.nota, entrada.clave);
}

// Firma precargada: imagen PNG o JPG de la firma real; cada cierre y validación la copia.
export async function guardarMiFirma(
  actor: Actor | null,
  bytes: Uint8Array,
  repos: Repos,
): Promise<Result<void>> {
  const c = await contexto(actor, "crear", repos);
  if (!c.ok) return c;
  const tipo = revisarImagenes([bytes], ["image/png", "image/jpeg"], MIN_FIRMA);
  if (!tipo.ok) return tipo;
  const ruta = await repos.trabajos.subirImagen(
    c.value.empresaId,
    "firmas",
    bytes,
    tipo.value[0],
  );
  if (!ruta.ok) return ruta;
  return repos.trabajos.guardarFirma(ruta.value);
}

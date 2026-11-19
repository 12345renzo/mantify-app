import {
  LIMITES_IMPORTACION,
  pareceXlsx,
} from "@/modules/equipos/domain/importacion";
import {
  empresaDeTrabajo,
  exigirPermiso,
} from "@/modules/identidad/application/acceso";
import { programa } from "@/modules/preventivos/domain/preventivo-estado";
import {
  crearBacklog,
  revisarImagenes,
} from "@/modules/trabajos/application/casos-uso";
import type { Actor } from "@/shared/kernel/actor";
import { DomainError } from "@/shared/kernel/errors";
import {
  diasEntre,
  hoyEn,
  sumarDias,
  type FechaISO,
} from "@/shared/kernel/fechas";
import { err, ok, type Result } from "@/shared/kernel/result";
import { crearPdf } from "@/shared/exportar/pdf";
import { crearXlsx } from "@/shared/exportar/xlsx";
import { ahoraEn, fechaDe, type FechaHora } from "../domain/duracion";
import { prepararImportacion, type ErrorFila } from "../domain/importacion";
import { rankingFallas, type FilaRanking } from "../domain/ranking-fallas";
import { MAX_FOTOS_PARADA, revisarParada } from "../domain/revision-parada";
import { hojasMensual, pdfDiario } from "./reportes";
import type {
  BacklogHallazgoEntrada,
  CerrarEntrada,
  IniciarEntrada,
} from "./esquemas";
import type {
  FiltroReporte,
  OpcionesParada,
  Parada,
  ParadaDetalle,
  ReposParadas,
} from "./repositorios";

export const MAX_DIAS_REPORTE = 366;

const noEncontrada = () =>
  err(new DomainError("NOT_FOUND", "parada no existe"));

async function contexto(
  actor: Actor | null,
  accion: "leer" | "crear" | "editar",
  repos: Pick<ReposParadas, "trabajos">,
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

// Rango de fechas válido y acotado (la base vuelve a limitarlo).
function rango(f: FiltroReporte): Result<FiltroReporte> {
  const dias = diasEntre(f.desde, f.hasta);
  return dias < 0 || dias > MAX_DIAS_REPORTE
    ? err(new DomainError("VALIDATION", "rango_no_valido"))
    : ok(f);
}

export async function reporteParadas(
  actor: Actor | null,
  filtro: FiltroReporte,
  repos: Pick<ReposParadas, "lector">,
): Promise<Result<Parada[]>> {
  const permiso = exigirPermiso(actor, "leer", "trabajos");
  if (!permiso.ok) return permiso;
  const empresa = empresaDeTrabajo(permiso.value, null);
  if (!empresa.ok) return empresa;
  const r = rango(filtro);
  if (!r.ok) return r;
  return ok(await repos.lector.reporte(r.value));
}

export async function rankingParadas(
  actor: Actor | null,
  periodo: { desde: FechaISO; hasta: FechaISO },
  repos: Pick<ReposParadas, "lector">,
): Promise<Result<FilaRanking[]>> {
  const r = await reporteParadas(actor, periodo, repos);
  if (!r.ok) return r;
  return ok(rankingFallas(r.value, periodo));
}

export async function opcionesParada(
  actor: Actor | null,
  repos: Pick<ReposParadas, "lector">,
): Promise<Result<OpcionesParada>> {
  const permiso = exigirPermiso(actor, "crear", "trabajos");
  if (!permiso.ok) return permiso;
  const empresa = empresaDeTrabajo(permiso.value, null);
  if (!empresa.ok) return empresa;
  return ok(await repos.lector.opciones(empresa.value));
}

export type VistaParada = {
  parada: ParadaDetalle;
  cierra: boolean;
  creaBacklog: boolean;
  ahora: FechaHora;
  hoy: FechaISO;
};

export async function verParada(
  actor: Actor | null,
  id: string,
  repos: ReposParadas,
  ahora: Date = new Date(),
): Promise<Result<VistaParada | null>> {
  const c = await contexto(actor, "leer", repos);
  if (!c.ok) return c;
  const p = await repos.lector.obtener(id);
  if (!p) return ok(null);
  const escribe = exigirPermiso(c.value.actor, "editar", "trabajos").ok;
  return ok({
    parada: p,
    cierra: escribe && p.estado === "ABIERTA",
    creaBacklog: escribe && p.hallazgo !== null && p.backlog === null,
    ahora: ahoraEn(c.value.empresa.zonaHoraria, ahora),
    hoy: hoyEn(c.value.empresa.zonaHoraria, ahora),
  });
}

// Otras paradas del equipo que podrían cruzarse: las abiertas y las del último mes.
async function otrasDelEquipo(
  repos: Pick<ReposParadas, "lector">,
  equipoId: string,
  desde: FechaHora,
  hoy: FechaISO,
) {
  const lista = await repos.lector.reporte({
    desde: sumarDias(fechaDe(desde), -31),
    hasta: hoy,
    abiertas: true,
    equipoId,
  });
  return lista.map((o) => ({
    id: o.id,
    equipoId: o.equipoId,
    motivo: o.motivoCodigo,
    inicio: o.inicio,
    fin: o.fin,
  }));
}

// Lo que bloquea se devuelve como error; el cruce sin confirmar, como "cruce" (la pantalla pide confirmarlo).
function aplicarRevision(
  avisos: ReturnType<typeof revisarParada>,
  confirmarCruce: boolean,
): Result<void> {
  const bloquea = avisos.find((a) => a.bloquea);
  if (bloquea) {
    return err(new DomainError("VALIDATION", bloquea.codigo.toLowerCase()));
  }
  if (avisos.some((a) => a.codigo === "CRUCE") && !confirmarCruce) {
    return err(new DomainError("VALIDATION", "cruce"));
  }
  return ok(undefined);
}

async function subirFotos(
  repos: ReposParadas,
  empresaId: string,
  fotos: Uint8Array[],
): Promise<Result<string[]>> {
  const tipos = revisarImagenes(fotos);
  if (!tipos.ok) return tipos;
  // shortcut: si la base rechaza después de subir, las fotos quedan huérfanas (igual que en backlogs).
  const rutas: string[] = [];
  for (const [i, bytes] of fotos.entries()) {
    const r = await repos.trabajos.trabajos.subirImagen(
      empresaId,
      "paradas",
      bytes,
      tipos.value[i],
    );
    if (!r.ok) return r;
    rutas.push(r.value);
  }
  return ok(rutas);
}

// Inicio: el equipo queda en mantenimiento.
export async function iniciarParada(
  actor: Actor | null,
  entrada: IniciarEntrada,
  fotos: Uint8Array[],
  repos: ReposParadas,
  ahora: Date = new Date(),
): Promise<Result<{ id: string }>> {
  const c = await contexto(actor, "crear", repos);
  if (!c.ok) return c;
  const zona = c.value.empresa.zonaHoraria;
  if (entrada.inicio > ahoraEn(zona, ahora)) {
    return err(new DomainError("VALIDATION", "fecha_futura"));
  }
  if (fotos.length > MAX_FOTOS_PARADA) {
    return err(new DomainError("VALIDATION", "fotos_maximo"));
  }
  const opciones = await repos.lector.opciones(c.value.empresaId);
  const motivo = opciones.motivos.find((m) => m.id === entrada.motivoId);
  if (!motivo) return err(new DomainError("VALIDATION", "motivo_no_valido"));
  const otras = await otrasDelEquipo(
    repos,
    entrada.equipoId,
    entrada.inicio,
    hoyEn(zona, ahora),
  );
  const revision = aplicarRevision(
    revisarParada(
      {
        equipoId: entrada.equipoId,
        motivo: motivo.codigo,
        inicio: entrada.inicio,
        fin: null,
        horometroInicio: entrada.horometroInicio,
        horometroFin: null,
      },
      otras,
    ),
    entrada.confirmarCruce,
  );
  if (!revision.ok) return revision;
  const rutas = await subirFotos(repos, c.value.empresaId, fotos);
  if (!rutas.ok) return rutas;
  const { clave, confirmarCruce, ...datos } = entrada;
  return repos.paradas.iniciar(datos, rutas.value, confirmarCruce, clave);
}

// Cierre: salida posterior, horómetro que no baja, sin duplicados; el cruce se confirma.
export async function cerrarParada(
  actor: Actor | null,
  entrada: CerrarEntrada,
  fotos: Uint8Array[],
  repos: ReposParadas,
  ahora: Date = new Date(),
): Promise<Result<void>> {
  const c = await contexto(actor, "editar", repos);
  if (!c.ok) return c;
  const zona = c.value.empresa.zonaHoraria;
  const p = await repos.lector.obtener(entrada.paradaId);
  if (!p) return noEncontrada();
  if (p.estado !== "ABIERTA") {
    return err(new DomainError("CONFLICT", "estado_cambio"));
  }
  if (entrada.fin > ahoraEn(zona, ahora)) {
    return err(new DomainError("VALIDATION", "fecha_futura"));
  }
  if (p.fotos.length + fotos.length > MAX_FOTOS_PARADA) {
    return err(new DomainError("VALIDATION", "fotos_maximo"));
  }
  const otras = await otrasDelEquipo(
    repos,
    p.equipoId,
    p.inicio,
    hoyEn(zona, ahora),
  );
  const revision = aplicarRevision(
    revisarParada(
      {
        id: p.id,
        equipoId: p.equipoId,
        motivo: p.motivoCodigo,
        inicio: p.inicio,
        fin: entrada.fin,
        horometroInicio: p.horometroInicio,
        horometroFin: entrada.horometroFin,
      },
      otras,
    ),
    entrada.confirmarCruce,
  );
  if (!revision.ok) return revision;
  const rutas = await subirFotos(repos, c.value.empresaId, fotos);
  if (!rutas.ok) return rutas;
  const { paradaId, clave, confirmarCruce, ...datos } = entrada;
  return repos.paradas.cerrar(
    paradaId,
    datos,
    rutas.value,
    confirmarCruce,
    clave,
  );
}

// El hallazgo pasa a la bandeja de trabajos como backlog con origen PARADA (uno por parada: clave = id).
export async function backlogDesdeHallazgo(
  actor: Actor | null,
  entrada: BacklogHallazgoEntrada,
  repos: ReposParadas,
  ahora: Date = new Date(),
): Promise<Result<{ id: string }>> {
  const c = await contexto(actor, "crear", repos);
  if (!c.ok) return c;
  const p = await repos.lector.obtener(entrada.paradaId);
  if (!p) return noEncontrada();
  if (!p.hallazgo || p.backlog) {
    return err(new DomainError("VALIDATION", "parada_no_valida"));
  }
  return crearBacklog(
    actor,
    {
      equipoId: p.equipoId,
      sistemaId: null,
      componente: entrada.componente,
      criticidad: entrada.criticidad,
      descripcion: `${p.hallazgo} (${p.codigo})`.slice(0, 1000),
      fechaObservacion: fechaDe(p.fin ?? p.inicio),
      fechaProgramada: hoyEn(c.value.empresa.zonaHoraria, ahora),
      costoEstimado: 0,
      clave: p.id,
      paradaId: p.id,
    },
    [],
    repos.trabajos,
    ahora,
  );
}

export type ResumenImportacion = {
  creadas: number;
  // Ya importadas antes (mismo ID de importación): no se duplican.
  repetidas: number;
  conCruce: number;
  backlogs: number;
  errores: ErrorFila[];
};

const MOTIVO_BASE = {
  EQUIPO: "No hay un equipo con ese código. Impórtalo primero en Equipos.",
  MOTIVO: "No hay un motivo de parada activo con ese código o nombre.",
  AREA: "No hay un área activa con ese nombre y tipo.",
  DUPLICADO: "Ya hay una parada del mismo equipo, motivo y hora.",
  DATOS: "Algún dato no es válido para guardar.",
} as const;

// Paradas cerradas de un Excel (historial). El ID de importación evita duplicar al subir el mismo archivo.
export async function importarParadas(
  actor: Actor | null,
  bytes: Uint8Array,
  repos: ReposParadas,
): Promise<Result<ResumenImportacion>> {
  const c = await contexto(actor, "crear", repos, true);
  if (!c.ok) return c;
  if (bytes.length > LIMITES_IMPORTACION.bytes) {
    return err(new DomainError("VALIDATION", "ARCHIVO_GRANDE"));
  }
  if (!pareceXlsx(bytes)) return err(new DomainError("VALIDATION", "NO_XLSX"));
  const filas = await repos.excel.leer(bytes);
  if (!filas.ok) return filas;
  const prep = prepararImportacion(filas.value, LIMITES_IMPORTACION.filas);
  if (!prep.ok) return err(new DomainError("VALIDATION", prep.error));
  const resumen: ResumenImportacion = {
    creadas: 0,
    repetidas: 0,
    conCruce: 0,
    backlogs: 0,
    errores: [...prep.errores],
  };
  if (prep.validas.length) {
    const r = await repos.paradas.importar(prep.validas);
    if (!r.ok) return r;
    for (const x of r.value) {
      if ("error" in x) {
        resumen.errores.push({ fila: x.fila, motivo: MOTIVO_BASE[x.error] });
      } else if (x.accion === "OMITIDO") resumen.repetidas++;
      else {
        resumen.creadas++;
        if (x.cruce) resumen.conCruce++;
        if (x.backlog) resumen.backlogs++;
      }
    }
  }
  resumen.errores.sort((a, b) => a.fila - b.fila);
  return ok(resumen);
}

export type Archivo = { nombre: string; tipo: string; bytes: Uint8Array };

// PDF del día: las mismas filas que la tabla del reporte diario. El tope de filas lo pone la base (5000),
// así la generación (síncrona, sin red) siempre termina en poco tiempo.
export async function exportarDiario(
  actor: Actor | null,
  fecha: FechaISO,
  repos: Pick<ReposParadas, "lector">,
): Promise<Result<Archivo>> {
  const r = await reporteParadas(actor, { desde: fecha, hasta: fecha }, repos);
  if (!r.ok) return r;
  const empresa = await repos.lector.nombreEmpresa(actor!.empresaId!);
  return ok({
    nombre: `paradas-${fecha}.pdf`,
    tipo: "application/pdf",
    bytes: crearPdf(pdfDiario(empresa, fecha, r.value)),
  });
}

export async function exportarMensual(
  actor: Actor | null,
  mes: string,
  repos: Pick<ReposParadas, "lector">,
): Promise<Result<Archivo>> {
  const [anio, m] = mes.split("-").map(Number);
  const ultimo = new Date(Date.UTC(anio, m, 0)).getUTCDate();
  const r = await reporteParadas(
    actor,
    { desde: `${mes}-01`, hasta: `${mes}-${String(ultimo).padStart(2, "0")}` },
    repos,
  );
  if (!r.ok) return r;
  return ok({
    nombre: `paradas-${mes}.xlsx`,
    tipo: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    bytes: crearXlsx(hojasMensual(mes, r.value)),
  });
}

import { exigirPermiso } from "@/modules/identidad/application/acceso";
import { puede } from "@/modules/identidad/domain/permisos";
import type { Actor } from "@/shared/kernel/actor";
import { DomainError } from "@/shared/kernel/errors";
import { diasEntre, hoyEn, type FechaISO } from "@/shared/kernel/fechas";
import { err, ok, type Result } from "@/shared/kernel/result";
import { costoPorHora, proyeccion } from "../domain/costos";
import { posicionesDePlantilla } from "../domain/posiciones";
import {
  cocada,
  desgasteIrregular,
  diferencia,
  MARGEN_MEDICION,
  ordenarPorSalud,
  saludCubierta,
  umbralesEfectivos,
  type Umbrales,
} from "../domain/salud";
import type {
  DesmontarEntrada,
  MedirEntrada,
  MontarEntrada,
  NeumaticoEntrada,
  RecaparEntrada,
  RotarEntrada,
  UmbralesEntrada,
} from "./esquemas";
import type {
  FilaNeumatico,
  Neumatico,
  ReposNeumaticos,
  UmbralGuardado,
} from "./repositorios";

const invalido = (motivo: string) => err(new DomainError("VALIDATION", motivo));

async function contexto(
  actor: Actor | null,
  accion: "leer" | "crear" | "editar",
  repos: Pick<ReposNeumaticos, "lector">,
  recurso: "neumaticos" | "umbrales_neumaticos" = "neumaticos",
) {
  const permiso = exigirPermiso(actor, accion, recurso);
  if (!permiso.ok) return permiso;
  const empresaId = permiso.value.empresaId;
  if (!empresaId) {
    return err(new DomainError("FORBIDDEN", "usuario sin empresa"));
  }
  const empresa = await repos.lector.empresa(empresaId);
  return ok({ actor: permiso.value, empresaId, empresa });
}

function umbralesDe(
  guardados: UmbralGuardado[],
  equipoId: string,
  categoriaId: string,
): Umbrales | null {
  const solo = (u: UmbralGuardado | undefined): Umbrales | null =>
    u
      ? {
          cocadaMinima: u.cocadaMinima,
          cocadaAlerta: u.cocadaAlerta,
          diasSinMedir: u.diasSinMedir,
          diferenciaMaxima: u.diferenciaMaxima,
        }
      : null;
  return umbralesEfectivos(
    solo(guardados.find((u) => u.equipoId === equipoId)),
    solo(guardados.find((u) => u.categoriaId === categoriaId)),
  );
}

// Salud, cocada y costo no se guardan: se calculan al leer.
export function evaluar(
  n: Neumatico,
  guardados: UmbralGuardado[],
  hoy: FechaISO,
): FilaNeumatico {
  const m = n.montaje;
  const med = n.ultimaMedicion;
  // Lo más reciente del ciclo manda: la medición o, si se montó después, la cocada del montaje.
  const usaMedicion = med !== null && (!m || med.fecha >= m.montadoEn);
  const cocadaActual = usaMedicion
    ? cocada(med.puntos)
    : (m?.cocadaMontaje ?? n.cocadaNueva);
  const referencia = usaMedicion ? med.fecha : (m?.montadoEn ?? null);
  const umbrales = m ? umbralesDe(guardados, m.equipoId, m.categoriaId) : null;
  const dif = usaMedicion ? diferencia(med.puntos) : null;
  const diasSinMedir = referencia ? diasEntre(referencia, hoy) : null;
  const horas =
    n.horasAcumuladas +
    (m ? Math.max(0, m.equipoHorometro - m.horometroMontaje) : 0);
  const costoTotal =
    n.costo === null ? null : n.costo + (n.costoRecapados ?? 0);
  return {
    ...n,
    cocadaActual,
    diferencia: dif,
    salud: m ? saludCubierta(cocadaActual, umbrales, diasSinMedir ?? 0) : null,
    irregular: m ? desgasteIrregular(dif, umbrales) : false,
    diasSinMedir,
    umbrales,
    costoPorHora: costoPorHora(costoTotal, horas),
  };
}

export async function listarNeumaticos(
  actor: Actor | null,
  repos: ReposNeumaticos,
  ahora: Date = new Date(),
) {
  const c = await contexto(actor, "leer", repos);
  if (!c.ok) return c;
  const hoy = hoyEn(c.value.empresa.zonaHoraria, ahora);
  const [lista, umbrales, equipos, categorias] = await Promise.all([
    repos.lector.neumaticos(),
    repos.lector.umbrales(),
    repos.lector.equipos(),
    repos.lector.categorias(),
  ]);
  const filas = lista.map((n) => evaluar(n, umbrales, hoy));
  const montadas = ordenarPorSalud(
    filas.filter(
      (
        f,
      ): f is FilaNeumatico & { salud: NonNullable<FilaNeumatico["salud"]> } =>
        f.salud !== null,
    ),
  );
  return ok({
    filas: [...montadas, ...filas.filter((f) => f.salud === null)],
    umbrales,
    equipos,
    categorias,
    hoy,
    veCostos: puede(c.value.actor.rol, "leer", "costos_neumaticos"),
  });
}

export async function verEquipoNeumaticos(
  actor: Actor | null,
  equipoId: string,
  repos: ReposNeumaticos,
  ahora: Date = new Date(),
) {
  const c = await contexto(actor, "leer", repos);
  if (!c.ok) return c;
  const hoy = hoyEn(c.value.empresa.zonaHoraria, ahora);
  const [equipos, posiciones, lista, umbrales, motivos, plantillas] =
    await Promise.all([
      repos.lector.equipos(),
      repos.lector.posiciones(equipoId),
      repos.lector.neumaticos(),
      repos.lector.umbrales(),
      repos.lector.motivos(),
      repos.lector.plantillas(),
    ]);
  const equipo = equipos.find((e) => e.id === equipoId);
  if (!equipo) return err(new DomainError("NOT_FOUND", "equipo no existe"));
  const filas = lista.map((n) => evaluar(n, umbrales, hoy));
  return ok({
    equipo,
    posiciones,
    montadas: filas.filter((f) => f.montaje?.equipoId === equipoId),
    stock: filas.filter((f) => f.estado === "STOCK"),
    motivos,
    plantillas,
    hoy,
  });
}

export async function verNeumatico(
  actor: Actor | null,
  id: string,
  repos: ReposNeumaticos,
  ahora: Date = new Date(),
) {
  const c = await contexto(actor, "leer", repos);
  if (!c.ok) return c;
  const hoy = hoyEn(c.value.empresa.zonaHoraria, ahora);
  const [[n], umbrales, eventos, mediciones] = await Promise.all([
    repos.lector.neumaticos(id),
    repos.lector.umbrales(),
    repos.lector.eventos(id),
    repos.lector.mediciones(id),
  ]);
  if (!n) return err(new DomainError("NOT_FOUND", "neumatico no existe"));
  const fila = evaluar(n, umbrales, hoy);
  // La proyección es del plan Pro: solo el ciclo actual y con umbrales.
  const esPro = c.value.empresa.esPro;
  const pro =
    esPro && fila.umbrales
      ? proyeccion(
          mediciones
            .filter((m) => m.recapado === n.recapados)
            .map((m) => ({ horometro: m.horometro, cocada: cocada(m.puntos) })),
          fila.umbrales.cocadaMinima,
        )
      : null;
  return ok({
    fila,
    eventos,
    mediciones,
    esPro,
    proyeccion: pro,
    veCostos: puede(c.value.actor.rol, "leer", "costos_neumaticos"),
  });
}

export async function guardarNeumatico(
  actor: Actor | null,
  entrada: NeumaticoEntrada,
  repos: ReposNeumaticos,
): Promise<Result<string>> {
  const c = await contexto(actor, "editar", repos);
  if (!c.ok) return c;
  return repos.neumaticos.guardar(entrada);
}

export async function definirPosiciones(
  actor: Actor | null,
  entrada: { equipoId: string; layout: string },
  repos: ReposNeumaticos,
): Promise<Result<void>> {
  const c = await contexto(actor, "editar", repos);
  if (!c.ok) return c;
  const posiciones = posicionesDePlantilla(entrada.layout);
  if (!posiciones.ok) return posiciones;
  return repos.neumaticos.definirPosiciones(
    entrada.equipoId,
    posiciones.value.map(({ codigo, eje }) => ({ codigo, eje })),
  );
}

// Solo el planificador; quitar los del equipo vuelve a los de su categoría.
export async function guardarUmbrales(
  actor: Actor | null,
  entrada: UmbralesEntrada,
  repos: ReposNeumaticos,
): Promise<Result<void>> {
  const c = await contexto(actor, "editar", repos, "umbrales_neumaticos");
  if (!c.ok) return c;
  return repos.neumaticos.guardarUmbrales(entrada.destino, entrada.datos);
}

async function operar<E extends { fecha: FechaISO }>(
  actor: Actor | null,
  entrada: E,
  repos: ReposNeumaticos,
  ahora: Date,
  accion: "crear" | "editar",
  hacer: (e: E) => Promise<Result<void>>,
): Promise<Result<void>> {
  const c = await contexto(actor, accion, repos);
  if (!c.ok) return c;
  if (entrada.fecha > hoyEn(c.value.empresa.zonaHoraria, ahora)) {
    return invalido("fecha_futura");
  }
  return hacer(entrada);
}

export const montarNeumatico = (
  actor: Actor | null,
  entrada: MontarEntrada,
  repos: ReposNeumaticos,
  ahora: Date = new Date(),
) =>
  operar(actor, entrada, repos, ahora, "crear", (e) =>
    repos.neumaticos.montar(e),
  );

export const desmontarNeumatico = (
  actor: Actor | null,
  entrada: DesmontarEntrada,
  repos: ReposNeumaticos,
  ahora: Date = new Date(),
) =>
  operar(actor, entrada, repos, ahora, "crear", (e) =>
    repos.neumaticos.desmontar(e),
  );

export const rotarNeumaticos = (
  actor: Actor | null,
  entrada: RotarEntrada,
  repos: ReposNeumaticos,
  ahora: Date = new Date(),
) =>
  operar(actor, entrada, repos, ahora, "crear", (e) =>
    repos.neumaticos.rotar(e),
  );

export async function recaparNeumatico(
  actor: Actor | null,
  entrada: RecaparEntrada,
  repos: ReposNeumaticos,
): Promise<Result<void>> {
  const c = await contexto(actor, "editar", repos);
  if (!c.ok) return c;
  return repos.neumaticos.recapar(entrada);
}

// Rango físico: de 0 a la cocada nueva + 5 mm. La base lo repite.
export async function medirNeumaticos(
  actor: Actor | null,
  entrada: MedirEntrada,
  repos: ReposNeumaticos,
  ahora: Date = new Date(),
): Promise<Result<void>> {
  return operar(actor, entrada, repos, ahora, "crear", async (e) => {
    const lista = await repos.lector.neumaticos();
    const porId = new Map(lista.map((n) => [n.id, n]));
    for (const m of e.mediciones) {
      const n = porId.get(m.neumaticoId);
      if (!n || n.montaje?.equipoId !== e.equipoId) {
        return invalido("neumatico_no_montado");
      }
      const max = n.cocadaNueva + MARGEN_MEDICION;
      if ([m.interno, m.centro, m.externo].some((v) => v > max)) {
        return invalido("medicion_fuera_de_rango");
      }
    }
    return repos.neumaticos.medir(e);
  });
}

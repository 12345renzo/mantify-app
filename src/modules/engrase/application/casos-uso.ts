import { exigirPermiso } from "@/modules/identidad/application/acceso";
import type { Actor } from "@/shared/kernel/actor";
import { DomainError } from "@/shared/kernel/errors";
import { hoyEn } from "@/shared/kernel/fechas";
import { err, ok, type Result } from "@/shared/kernel/result";
import {
  calcularEstado,
  esRegistroCompleto,
  ordenarPorEstado,
  puntosEfectivos,
  validarHorometroEngrase,
  type Plantilla,
  type Punto,
} from "../domain/estado-engrase";
import type { AvisoEntrada, PlanEntrada, RegistroEntrada } from "./esquemas";
import type {
  EmpresaEngrase,
  EquipoEngrase,
  FilaEngrase,
  ListadoEngrase,
  RegistroEngrase,
  ReposEngrase,
} from "./repositorios";

const invalido = (motivo: string) => err(new DomainError("VALIDATION", motivo));

async function contexto(
  actor: Actor | null,
  accion: "leer" | "crear" | "editar",
  repos: Pick<ReposEngrase, "lector">,
) {
  const permiso = exigirPermiso(actor, accion, "engrase");
  if (!permiso.ok) return permiso;
  const empresaId = permiso.value.empresaId;
  if (!empresaId) {
    return err(new DomainError("FORBIDDEN", "usuario sin empresa"));
  }
  const empresa = await repos.lector.empresa(empresaId);
  return ok({ actor: permiso.value, empresaId, empresa });
}

function armarFilas(
  equipos: EquipoEngrase[],
  propios: (Punto & { equipoId: string })[],
  plantillas: Plantilla[],
  empresa: EmpresaEngrase,
  hoy: string,
): FilaEngrase[] {
  return equipos.map((e) => {
    const suyos = propios.filter((p) => p.equipoId === e.id);
    return {
      ...e,
      ...calcularEstado(
        e.plan,
        e.ultimoCompleto,
        e.horometro,
        hoy,
        empresa.aviso,
      ),
      puntos: puntosEfectivos(suyos, plantillas, e.categoriaId),
      puntosPropios: suyos.length > 0,
    };
  });
}

// El estado no se guarda: se calcula al leer con el "hoy" de la empresa.
export async function listarEngrase(
  actor: Actor | null,
  repos: ReposEngrase,
  ahora: Date = new Date(),
): Promise<Result<ListadoEngrase>> {
  const c = await contexto(actor, "leer", repos);
  if (!c.ok) return c;
  const { empresa } = c.value;
  const hoy = hoyEn(empresa.zonaHoraria, ahora);
  const [equipos, propios, plantillas, grasas] = await Promise.all([
    repos.lector.equipos(),
    repos.lector.puntos(),
    repos.lector.plantillas(),
    repos.lector.grasas(),
  ]);
  const filas = armarFilas(equipos, propios, plantillas, empresa, hoy);
  return ok({
    filas: ordenarPorEstado(filas),
    grasas,
    aviso: empresa.aviso,
    hoy,
  });
}

export async function verEngrase(
  actor: Actor | null,
  equipoId: string,
  repos: ReposEngrase,
  ahora: Date = new Date(),
): Promise<
  Result<ListadoEngrase & { fila: FilaEngrase; registros: RegistroEngrase[] }>
> {
  const c = await contexto(actor, "leer", repos);
  if (!c.ok) return c;
  const { empresa } = c.value;
  const hoy = hoyEn(empresa.zonaHoraria, ahora);
  const [equipos, propios, plantillas, grasas, registros] = await Promise.all([
    repos.lector.equipos(equipoId),
    repos.lector.puntos(equipoId),
    repos.lector.plantillas(),
    repos.lector.grasas(),
    repos.lector.registros(equipoId),
  ]);
  const [fila] = armarFilas(equipos, propios, plantillas, empresa, hoy);
  if (!fila) return err(new DomainError("NOT_FOUND", "equipo no existe"));
  return ok({
    fila,
    filas: [fila],
    grasas,
    aviso: empresa.aviso,
    hoy,
    registros,
  });
}

export async function guardarPlanEngrase(
  actor: Actor | null,
  entrada: PlanEntrada,
  repos: ReposEngrase,
): Promise<Result<void>> {
  const c = await contexto(actor, "editar", repos);
  if (!c.ok) return c;
  return repos.engrase.guardarPlan(entrada);
}

// La app valida para dar un mensaje claro; la base repite todo en registrar_engrase.
export async function registrarEngrase(
  actor: Actor | null,
  entrada: RegistroEntrada,
  repos: ReposEngrase,
  ahora: Date = new Date(),
): Promise<Result<void>> {
  const c = await contexto(actor, "crear", repos);
  if (!c.ok) return c;
  const [equipo] = await repos.lector.equipos(entrada.equipoId);
  if (!equipo) return err(new DomainError("NOT_FOUND", "equipo no existe"));

  const [propios, plantillas] = await Promise.all([
    repos.lector.puntos(equipo.id),
    repos.lector.plantillas(),
  ]);
  const puntos = puntosEfectivos(propios, plantillas, equipo.categoriaId);
  if (puntos.length === 0) return invalido("sin_puntos");
  const ids = new Set(puntos.map((p) => p.id));
  const marcados = new Set(entrada.engrasados);
  if ([...marcados].some((id) => !ids.has(id)))
    return invalido("punto_no_valido");
  if (
    !esRegistroCompleto(puntos.length, marcados.size) &&
    (entrada.observacion?.length ?? 0) < 3
  ) {
    return invalido("observacion_obligatoria");
  }

  if (entrada.fecha > hoyEn(c.value.empresa.zonaHoraria, ahora)) {
    return invalido("fecha_futura");
  }
  const ultimo = equipo.ultimoRegistro;
  if (ultimo && entrada.fecha < ultimo.fecha) return invalido("fecha_anterior");
  const horometro = validarHorometroEngrase(
    entrada.horometro,
    ultimo?.horometro ?? null,
    equipo.horometro,
  );
  if (!horometro.ok) return horometro;

  return repos.engrase.registrar({ ...entrada, engrasados: [...marcados] });
}

// Solo el planificador, y solo el de su propia empresa (la base la toma de la sesión).
export async function configurarAvisoEngrase(
  actor: Actor | null,
  entrada: AvisoEntrada,
  repos: ReposEngrase,
): Promise<Result<void>> {
  const permiso = exigirPermiso(actor, "editar", "aviso_engrase");
  if (!permiso.ok) return permiso;
  return repos.engrase.configurarAviso(entrada);
}

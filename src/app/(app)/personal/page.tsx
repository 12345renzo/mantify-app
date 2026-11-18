import type { Metadata } from "next";
import { Suspense } from "react";
import { exigirAccesoEnPagina } from "@/modules/acceso/infrastructure/sesion";
import { verPersonal } from "@/modules/identidad/application/consultas";
import {
  ETIQUETA_ROL,
  esRol,
  puede,
  rolesQuePuedeGestionar,
} from "@/modules/identidad/domain/permisos";
import { hayCupo } from "@/modules/identidad/domain/reglas-persona-cuenta";
import { reposIdentidad } from "@/modules/identidad/infrastructure";
import { BotonPersona } from "@/modules/identidad/ui/boton-persona";
import { boton, tarjeta } from "@/shared/ui/estilos";
import { Paginacion, paginar, type ParamsUrl } from "@/shared/ui/paginacion";
import { formatoFechaHora } from "@/shared/ui/formato";
import { IconoPersonas } from "@/shared/ui/iconos";
import { ModalCuenta } from "@/modules/identidad/ui/modal-cuenta";
import { Encabezado, Esqueleto } from "../encabezado";
import {
  asignarPersonaAction,
  crearCuentaAction,
  darBajaAction,
  reactivarAction,
} from "./actions";
import { ModalEditarPersona, ModalRolCuenta } from "./modales-edicion";
import { ModalPersona } from "./modal-persona";

export const metadata: Metadata = { title: "Personal y cuentas" };

export default function PersonalPage({ searchParams }: PageProps<"/personal">) {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col gap-6">
          <Esqueleto alto="h-16" />
          <Esqueleto alto="h-24" />
          <Esqueleto alto="h-64" />
        </div>
      }
    >
      <Contenido searchParams={searchParams} />
    </Suspense>
  );
}

const etiquetaRol = (rol: string) => (esRol(rol) ? ETIQUETA_ROL[rol] : rol);

async function Contenido({
  searchParams,
}: {
  searchParams: Promise<ParamsUrl>;
}) {
  const params = await searchParams;
  const actor = await exigirAccesoEnPagina({
    accion: "leer",
    recurso: "cuentas",
  });
  const { lector } = await reposIdentidad();
  const r = await verPersonal(actor, null, lector);
  if (!r.ok) throw r.error;
  if (!r.value) throw new Error("Empresa no encontrada");
  const { empresa, cupo, personas, cuentas } = r.value;
  const pagCuentas = paginar(cuentas, params.cuentas);
  const pagPersonas = paginar(personas, params.personal);

  const gestiona = puede(actor.rol, "crear", "cuentas");
  const rolesGestionables: readonly string[] = rolesQuePuedeGestionar(
    actor.rol,
  );
  const rolPorCuenta = new Map(cuentas.map((c) => [c.id, c.rol]));
  const conCupo = hayCupo(cupo);
  const libres = cuentas.filter((c) => !c.persona).length;
  const pct = cupo.maximo
    ? Math.min(100, (cupo.usados / cupo.maximo) * 100)
    : 0;
  const personasLibres = personas
    .filter((p) => p.activa && !p.cuentaId)
    .map((p) => ({ id: p.id, nombre: `${p.apellidos}, ${p.nombres}` }));

  return (
    <>
      <Encabezado
        icono={IconoPersonas}
        color="var(--mod-personas)"
        titulo="Personal y cuentas"
        descripcion={empresa.nombre}
        acciones={
          gestiona && (
            <>
              <ModalPersona />
              {conCupo ? (
                <ModalCuenta
                  textoDisparador="Nueva cuenta"
                  titulo="Nueva cuenta"
                  descripcion="Da acceso a Mantify a una persona. La contraseña se genera y se muestra una sola vez."
                  accion={crearCuentaAction}
                  modo={{
                    tipo: "crear",
                    roles: rolesQuePuedeGestionar(actor.rol).map((rol) => ({
                      valor: rol,
                      etiqueta: ETIQUETA_ROL[rol],
                    })),
                  }}
                  personasLibres={personasLibres}
                  textoBoton="Crear cuenta"
                />
              ) : (
                <span
                  className={`${boton.primario} cursor-not-allowed opacity-50`}
                  title="Sin cupo en tu plan"
                >
                  Sin cupo
                </span>
              )}
            </>
          )
        }
      />

      <section
        className="grano relative mb-6 overflow-hidden rounded-[var(--radius-panel)] border border-[var(--fuerte-border)] p-5 text-[var(--fuerte-fg)] shadow-[var(--shadow-pop)] sm:p-6"
        style={{
          backgroundImage:
            "linear-gradient(140deg, var(--fuerte-1) 0%, var(--fuerte-2) 60%, var(--fuerte-3) 100%)",
        }}
      >
        <div
          className="reticula pointer-events-none absolute inset-0 text-[var(--fuerte-fg)] opacity-[0.05]"
          style={{
            maskImage:
              "radial-gradient(ellipse at 20% 0%, black 5%, transparent 68%)",
          }}
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -top-24 right-0 size-64 rounded-full opacity-50 blur-2xl"
          style={{
            background:
              "radial-gradient(circle, color-mix(in srgb, var(--fuerte-accent) 20%, transparent), transparent 70%)",
          }}
          aria-hidden="true"
        />

        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-[9.5px] font-semibold tracking-[0.16em] text-[var(--fuerte-muted)] uppercase">
              <IconoPersonas
                width={13}
                height={13}
                className="text-[var(--fuerte-accent)]"
              />
              Cuentas de tu plan
            </p>
            <p className="cifra mt-2 text-4xl leading-none font-semibold">
              {cupo.usados}
              <span className="ml-1.5 text-base font-normal text-[var(--fuerte-muted)]">
                {cupo.maximo ? `de ${cupo.maximo}` : "· sin límite"}
              </span>
            </p>
            <p className="mt-2 font-mono text-[10px] tracking-[0.08em] text-[var(--fuerte-muted)] uppercase">
              {cupo.maximo
                ? `${Math.max(0, cupo.maximo - cupo.usados)} disponibles`
                : "Accesos ilimitados en este plan"}
            </p>
          </div>

          {libres > 0 && (
            <p className="max-w-xs rounded-xl border border-[var(--fuerte-warn-border)] bg-[var(--fuerte-warn-bg)] px-3 py-2 text-xs leading-relaxed text-[var(--fuerte-warn-fg)]">
              {libres} {libres === 1 ? "cuenta libre" : "cuentas libres"}:
              asígnalas a una persona en lugar de crear otra.
            </p>
          )}
        </div>

        {cupo.maximo && (
          <div className="relative mt-5">
            <div
              className="h-2 overflow-hidden rounded-full bg-[var(--fuerte-track)]"
              aria-hidden="true"
            >
              <div
                className="h-full rounded-full transition-[width] duration-500"
                style={{
                  width: `${pct}%`,
                  backgroundImage: conCupo
                    ? "linear-gradient(90deg, var(--fuerte-bar-1), var(--fuerte-bar-2))"
                    : "linear-gradient(90deg, var(--fuerte-bar-warn-1), var(--fuerte-bar-warn-2))",
                  boxShadow:
                    "0 0 14px color-mix(in srgb, var(--fuerte-bar-2) 35%, transparent)",
                }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between font-mono text-[9.5px] tracking-[0.08em] text-[var(--fuerte-muted)] uppercase">
              <span>{Math.round(pct)}% del cupo</span>
              <span>Cuentas · Membresía</span>
            </div>
          </div>
        )}
      </section>

      <section className={`${tarjeta} mb-6 overflow-hidden`}>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-base font-semibold tracking-[-0.02em]">
              Cuentas
            </h2>
            <p className="mt-0.5 text-sm text-muted">
              Accesos a Mantify. Una cuenta sin persona no puede entrar.
            </p>
          </div>
          <span className="rounded-full border border-border bg-surface-2/60 px-2.5 py-1 font-mono text-[10px] text-muted tabular-nums">
            {cuentas.length}
          </span>
        </div>
        {cuentas.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-muted">
            Todavía no hay cuentas.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[44rem] text-sm">
              <thead className="bg-surface-2/70 text-left">
                <tr>
                  {[
                    "Correo",
                    "Rol",
                    "Persona",
                    "Último ingreso",
                    "Acciones",
                  ].map((th, i) => (
                    <th
                      key={th}
                      className={`px-5 py-3 text-[10px] font-semibold tracking-[0.13em] text-muted uppercase ${
                        i === 4 ? "text-right" : ""
                      }`}
                    >
                      {th}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pagCuentas.items.map((c) => (
                  <tr
                    key={c.id}
                    className={`transition-colors hover:bg-surface-2/50 ${c.persona ? "" : "bg-warn-soft/35"}`}
                  >
                    <td className="px-5 py-3 font-medium">
                      {c.correo}
                      {c.id === actor.id && (
                        <span className="ml-2 rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[9px] text-muted uppercase">
                          tú
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-muted">
                      {etiquetaRol(c.rol)}
                    </td>
                    <td className="px-5 py-3">
                      {c.persona ? (
                        c.persona.nombre
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-warn-soft px-2.5 py-0.5 text-xs font-semibold text-warn">
                          <span className="size-1.5 rounded-full bg-warn" />
                          Sin persona · sin acceso
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 font-mono text-[11px] text-muted">
                      {c.ultimoAcceso
                        ? formatoFechaHora(c.ultimoAcceso)
                        : "Nunca"}
                    </td>
                    <td className="flex items-center justify-end gap-4 px-5 py-3">
                      {gestiona &&
                        c.id !== actor.id &&
                        rolesGestionables.includes(c.rol) && (
                          <ModalRolCuenta
                            cuentaId={c.id}
                            correo={c.correo}
                            rol={c.rol}
                            roles={rolesGestionables.map((valor) => ({
                              valor,
                              etiqueta: etiquetaRol(valor),
                            }))}
                          />
                        )}
                      {gestiona &&
                        !c.persona &&
                        rolesGestionables.includes(c.rol) && (
                          <ModalCuenta
                            estilo="enlace"
                            textoDisparador="Asignar personal"
                            titulo="Asignar cuenta"
                            descripcion={`Cuenta de ${etiquetaRol(c.rol)}, antes ${c.correo}. Recibe correo y contraseña nuevos; los anteriores dejan de servir.`}
                            accion={asignarPersonaAction}
                            modo={{ tipo: "asignar", cuentaId: c.id }}
                            personasLibres={personasLibres}
                            textoBoton="Asignar y generar contraseña"
                          />
                        )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Paginacion
          param="cuentas"
          params={params}
          pagina={pagCuentas.pagina}
          paginas={pagCuentas.paginas}
          total={pagCuentas.total}
        />
      </section>

      <section className={`${tarjeta} overflow-hidden`}>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-base font-semibold tracking-[-0.02em]">
              Personal
            </h2>
            <p className="mt-0.5 text-sm text-muted">
              Puede haber personas sin cuenta, como técnicos de cuadrilla.
            </p>
          </div>
          <span className="rounded-full border border-border bg-surface-2/60 px-2.5 py-1 font-mono text-[10px] text-muted tabular-nums">
            {personas.length}
          </span>
        </div>
        {personas.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-muted">
            Todavía no hay personas registradas.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[48rem] text-sm">
              <thead className="bg-surface-2/70 text-left">
                <tr>
                  {[
                    "Nombre",
                    "Documento",
                    "Cargo",
                    "Cuenta",
                    "Estado",
                    "Acciones",
                  ].map((th, i) => (
                    <th
                      key={th}
                      className={`px-5 py-3 text-[10px] font-semibold tracking-[0.13em] text-muted uppercase ${
                        i === 5 ? "text-right" : ""
                      }`}
                    >
                      {th}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pagPersonas.items.map((p) => {
                  const rolCuenta = p.cuentaId
                    ? rolPorCuenta.get(p.cuentaId)
                    : undefined;
                  const puedeGestionar =
                    gestiona &&
                    p.cuentaId !== actor.id &&
                    (!rolCuenta || rolesGestionables.includes(rolCuenta));
                  const datos = {
                    nombre: `${p.nombres} ${p.apellidos}`,
                    documento: p.documento,
                    cargo: p.cargo,
                  };
                  return (
                    <tr
                      key={p.id}
                      className={`transition-colors hover:bg-surface-2/50 ${p.activa ? "" : "text-muted"}`}
                    >
                      <td className="px-5 py-3 font-medium">
                        {p.apellidos}, {p.nombres}
                        {p.tipoVinculo === "CONTRATISTA" && (
                          <span className="ml-2 rounded border border-border bg-surface-2 px-1.5 py-0.5 font-mono text-[9px] font-semibold tracking-wide text-muted uppercase">
                            Contratista
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 font-mono text-[11px] tabular-nums">
                        {p.documento ?? "—"}
                      </td>
                      <td className="px-5 py-3 text-muted">{p.cargo ?? "—"}</td>
                      <td className="px-5 py-3 text-muted">
                        {rolCuenta ? etiquetaRol(rolCuenta) : "Sin cuenta"}
                      </td>
                      <td className="px-5 py-3">
                        {p.activa ? (
                          <span className="rounded-full bg-ok-soft px-2.5 py-0.5 text-xs font-semibold text-ok">
                            Activa
                          </span>
                        ) : (
                          <span className="rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-semibold text-muted">
                            De baja
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right">
                        {puedeGestionar && (
                          <div className="flex items-center justify-end gap-4">
                            <ModalEditarPersona
                              personaId={p.id}
                              valores={{
                                nombres: p.nombres,
                                apellidos: p.apellidos,
                                tipoDocumento: p.tipoDocumento ?? "",
                                numeroDocumento: p.numeroDocumento ?? "",
                                cargo: p.cargo ?? "",
                                telefono: p.telefono ?? "",
                                tipoVinculo: p.tipoVinculo ?? "",
                              }}
                            />
                            <BotonPersona
                              personaId={p.id}
                              datos={datos}
                              tipo={p.activa ? "baja" : "retorno"}
                              accion={
                                p.activa ? darBajaAction : reactivarAction
                              }
                            />
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <Paginacion
          param="personal"
          params={params}
          pagina={pagPersonas.pagina}
          paginas={pagPersonas.paginas}
          total={pagPersonas.total}
        />
      </section>
    </>
  );
}

import { exigirSuperadminEnPagina } from "@/modules/acceso/infrastructure/sesion";
import { verPersonal } from "@/modules/identidad/application/consultas";
import { ETIQUETA_ROL, esRol } from "@/modules/identidad/domain/permisos";
import { hayCupo } from "@/modules/identidad/domain/reglas-persona-cuenta";
import { reposIdentidad } from "@/modules/identidad/infrastructure";
import { AccionesCuenta } from "@/modules/identidad/ui/acciones-cuenta";
import { ModalCuenta } from "@/modules/identidad/ui/modal-cuenta";
import { tarjeta } from "@/shared/ui/estilos";
import { IconoPersonas } from "@/shared/ui/iconos";
import {
  asignarPersonaAction,
  crearCuentaAction,
  desactivarCuentaAction,
} from "../../personal/actions";

// El superadmin da de alta al planificador de la empresa; el planificador crea al resto de su equipo.
export async function CuentasEmpresa({ empresaId }: { empresaId: string }) {
  const actor = await exigirSuperadminEnPagina();
  const { lector } = await reposIdentidad();
  const r = await verPersonal(actor, empresaId, lector);
  if (!r.ok) throw r.error;
  if (!r.value) return null;
  const { cuentas, cupo, personas } = r.value;
  const tienePlanificador = cuentas.some(
    (c) => c.rol === "PLANIFICADOR" && c.activa && c.persona,
  );
  const conCupo = hayCupo(cupo);
  const personasLibres = personas
    .filter((p) => p.activa && !p.cuentaId)
    .map((p) => ({ id: p.id, nombre: `${p.apellidos}, ${p.nombres}` }));

  return (
    <section className={tarjeta}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <span
            className="grid size-9 place-items-center rounded-lg"
            style={{
              color: "var(--mod-personas)",
              backgroundColor:
                "color-mix(in srgb, var(--mod-personas) 13%, transparent)",
            }}
          >
            <IconoPersonas width={18} height={18} />
          </span>
          <div>
            <h2 className="text-base font-semibold tracking-[-0.02em]">
              Cuentas
            </h2>
            <p className="font-mono text-[9.5px] tracking-[0.12em] text-muted uppercase">
              Accesos de la empresa
            </p>
          </div>
        </div>
        <span className="rounded-full border border-border bg-surface-2/60 px-2.5 py-1 font-mono text-[10px] text-muted tabular-nums">
          {cupo.usados}
          {cupo.maximo ? ` / ${cupo.maximo}` : " / ∞"} usadas
        </span>
      </div>

      {cuentas.length > 0 && (
        <ul className="divide-y divide-border">
          {cuentas.map((c) => (
            <li
              key={c.id}
              className={`flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3 text-sm transition-colors hover:bg-surface-2/50 sm:px-6 ${c.activa ? "" : "text-muted"}`}
            >
              <span className="min-w-0 flex-1 truncate font-medium">
                {c.correo}
              </span>
              <span className="rounded-md border border-border bg-surface-2/60 px-2 py-0.5 text-xs text-muted">
                {esRol(c.rol) ? ETIQUETA_ROL[c.rol] : c.rol}
              </span>
              {c.activa ? (
                <span
                  className={`text-xs ${c.persona ? "text-muted" : "font-medium text-warn"}`}
                >
                  {c.persona?.nombre ?? "Sin persona"}
                </span>
              ) : (
                <span className="rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-semibold text-muted">
                  Inactiva
                </span>
              )}
              <span className="flex items-center gap-3">
                <AccionesCuenta
                  cuenta={c}
                  etiquetaRol={esRol(c.rol) ? ETIQUETA_ROL[c.rol] : c.rol}
                  personasLibres={personasLibres}
                  conCupo={conCupo}
                  acciones={{
                    asignar: asignarPersonaAction,
                    desactivar: desactivarCuentaAction,
                  }}
                />
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border p-5 sm:px-6">
        <p className="min-w-0 flex-1 text-sm leading-relaxed text-muted">
          {tienePlanificador
            ? "Normalmente el planificador crea las cuentas de su equipo."
            : "La empresa empieza con su planificador. Él crea luego las cuentas de su equipo."}
        </p>
        {conCupo ? (
          <ModalCuenta
            textoDisparador={
              tienePlanificador ? "Crear cuenta" : "Crear planificador"
            }
            titulo={
              tienePlanificador ? "Nueva cuenta" : "Crear el planificador"
            }
            descripcion="La contraseña se genera y se muestra una sola vez. Entrégasela a la persona."
            accion={crearCuentaAction}
            modo={{
              tipo: "crear",
              empresaId,
              roles: (
                ["PLANIFICADOR", "SUPERVISOR", "TECNICO", "GERENTE"] as const
              ).map((rol) => ({
                valor: rol,
                etiqueta: ETIQUETA_ROL[rol],
              })),
            }}
            personasLibres={personasLibres}
            textoBoton="Crear cuenta"
          />
        ) : (
          <p className="text-sm text-bad">
            La empresa llegó al límite de cuentas de su plan.
          </p>
        )}
      </div>
    </section>
  );
}

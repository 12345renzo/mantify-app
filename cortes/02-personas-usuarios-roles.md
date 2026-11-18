# Corte 2: Personas, usuarios y roles

## Resumen del corte anterior

Corte 1 entregó la plataforma: empresas con RUC, planes, membresías, pagos manuales, estado calculado de cada empresa y `empresa_activa()`. El superadmin puede crear empresas y registrar pagos. Todavía no hay usuarios de empresa.

## Estructura y arquitectura

Mismo esquema. En este corte se agrega:

```
src/modules/identidad/
  domain/        permisos.ts (matriz por rol), reglas-persona-cuenta.ts
  application/   crear-usuario.ts, primer-ingreso.ts, dar-de-baja-persona.ts, reemplazar-persona.ts
  infrastructure/ personas-repositorio.ts, usuarios-repositorio.ts, auth-supabase.ts
  ui/            administración de personal, pantalla de primer ingreso
src/app/(app)/administracion/   listado y alta de personal (planificador)
src/app/primer-ingreso/         cambio obligatorio de clave
supabase/migrations/            personas, usuarios, políticas RLS por rol
```

**Front:** el listado de personal es Server Component. El alta es Client Component con Zod. El primer ingreso bloquea el resto de la app hasta cambiar la clave (middleware de Next que revisa `debe_cambiar_clave`).

**Back:** la autenticación la hace Supabase Auth; `usuarios` guarda el rol y la persona. Los permisos se calculan en `domain/permisos.ts` y las políticas RLS los replican en la base.

## Alcance

**Tablas:** `personas`, `usuarios`.

**Roles:** `PLANIFICADOR`, `SUPERVISOR`, `TECNICO`, `GERENTE`, `SUPERADMIN`.

**Reglas:**
* Cada cuenta tiene exactamente una persona (`usuarios.persona_id` único).
* Una persona puede no tener cuenta (técnico de cuadrilla). Solo tienen cuenta quienes usan la app.
* `GERENTE` solo lee. No inserta ni actualiza nada.
* `TECNICO` no ve informes sin validación ni el estado de la flota.
* El planificador crea supervisores y técnicos con clave aleatoria y `debe_cambiar_clave = true`.
* Baja de personal: el usuario queda `INACTIVO`, deja de entrar, su historial se conserva. Se puede dar de alta una persona nueva en su lugar.
* Superadmin: `empresa_id` nulo, no pertenece a ninguna empresa.
* `planificador_puede_validar` viene de `empresas` (su uso se implementa en el corte 5).

**Dominio (puro, con pruebas):**
* `puede(rol, accion, recurso)`: matriz de permisos.
* `puedeValidar(usuario, empresa)`: aplica `planificador_puede_validar`.

## Pruebas

* **Unitarias:** matriz completa de permisos por rol. Cada acción prohibida para cada rol.
* **Integración:**
  * `GERENTE` no puede insertar ni actualizar (RLS).
  * `TECNICO` no lee informes sin validación.
  * Una persona no puede tener dos cuentas (restricción única).
  * Un usuario inactivo no puede iniciar sesión (verificado en la capa de auth).
* **Aislamiento:** un planificador de la empresa A no ve personas ni usuarios de la B.

## Criterios de aceptación

* El planificador crea un técnico; el técnico entra con clave aleatoria y debe cambiarla antes de ver otra pantalla.
* El gerente ve la flota (cuando exista) pero no puede modificar nada; probado con intentos directos.
* Dar de baja a una persona la deja sin acceso y conserva su historial.
* Un técnico de cuadrilla sin cuenta se puede crear como persona, pero no tiene acceso.


## Seguridad y robustez de este corte

* Bloqueo temporal tras varios intentos fallidos de inicio de sesión.
* Clave aleatoria de un solo uso con vencimiento; el cambio obligatorio no se puede saltar desde la URL.
* Dar de baja revoca todas las sesiones de la persona en el momento.
* El rol se lee de la base o de `app_metadata`, nunca del cliente.
* Respuestas de error de inicio de sesión genéricas, sin revelar si un correo existe.
* Prueba: el gerente no puede ejecutar ninguna server action de escritura, aunque conozca el identificador.

## Decisiones tomadas al implementar (17 nov 2026)

Reemplazan a lo de arriba donde no coincidan.

* **Sin migraciones ni CLI.** Las tablas y funciones se crean directo en Supabase. Pruebas de la base en `tests/integration/identidad.sql`, para el SQL editor.
* **Cuenta y persona separadas.** La cuenta (`usuarios`) es un acceso de la empresa; la persona se le asigna. El correo va en la cuenta, no en la persona. La contraseña solo vive en Supabase Auth.
* **Sin nombre de usuario.** Se entra con correo.
* **Baja de persona.** La persona queda en `BAJA` con su historial; su cuenta queda libre (sin persona) y sin acceso hasta asignarle otra persona, con correo y contraseña nuevos. Las sesiones de quien la usaba se cierran al instante.
* **No hay baja de cuentas.** Las cuentas solo pierden acceso por: no tener persona, o empresa inactiva o vencida (pasa sola al vencer la membresía y vuelve sola al pagar).
* **Alta de cuentas.** El superadmin crea al planificador desde el detalle de la empresa; el planificador crea supervisores, técnicos y gerentes. La contraseña la genera Mantify y se muestra una sola vez a quien crea la cuenta, que la entrega.
* **Contraseña asignada.** No es temporal ni bloquea: se muestra un aviso para cambiarla hasta que se cambie. La nueva debe tener 12 caracteres o más.
* **Cupo por plan.** Estándar 10 cuentas, Pro 25. Las cuentas libres también cuentan. Se revisa en la app y en la base (trigger con bloqueo de fila).
* **Sin tabla de roles.** Los 5 roles son fijos; los permisos viven en `domain/permisos.ts` y en RLS.
* **Pendiente para cortes siguientes:** "el técnico no lee informes sin validar" y "el gerente ve la flota" se prueban en la base cuando existan esas tablas (cortes 4 y 5). La matriz de permisos ya lo fija y está probada.

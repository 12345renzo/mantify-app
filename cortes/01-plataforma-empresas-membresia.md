# Corte 1: Plataforma, empresas y membresía

## Resumen del corte anterior

Corte 0 entregó el proyecto base: Next.js + TypeScript con la estructura de capas, Supabase local, Vitest, Playwright instalado, Zod y CI. Todavía no hay datos de negocio.

## Estructura y arquitectura

Mismo esquema del corte 0. En este corte se agrega:

```
src/modules/plataforma/
  domain/        estado-membresia.ts, ruc.ts, regla-nueva-membresia.ts
  application/   crear-empresa.ts, registrar-pago-manual.ts, activar-desactivar-empresa.ts
  infrastructure/ empresas-repositorio.ts, membresias-repositorio.ts (Supabase)
  ui/            panel del superadmin
src/app/(superadmin)/      pantallas del superadmin (server components + server actions)
supabase/migrations/       planes, empresas, membresias, pagos, avisos_membresia, vista v_empresas_estado, empresa_activa()
```

**Front:** el panel del superadmin son Server Components que leen empresas y estados. Los formularios de crear empresa y registrar pago son Client Components con validación Zod.

**Back:** las server actions validan y llaman al caso de uso. El caso de uso recibe repositorios por interfaz, así se prueba sin base.

## Alcance

**Tablas:** `planes`, `empresas`, `membresias`, `pagos` (solo `MANUAL`), `avisos_membresia`.

**Vista y función:**
* `v_empresas_estado`: estado calculado (`AL_DIA`, `POR_VENCER`, `EN_GRACIA`, `VENCIDA`, `INACTIVA`).
* `empresa_activa(p_empresa_id)`: verdadero si el estado es `AL_DIA`, `POR_VENCER` o `EN_GRACIA`. Las políticas RLS de datos de empresa la usan en los cortes siguientes.

**Superadmin:** crear empresa (con RUC), activar y desactivar, registrar pago manual, cambiar precio (con aviso previo).

**Reglas de negocio:**
* RUC de 11 dígitos y único.
* Membresía de 30 días desde la fecha de pago.
* 3 días de gracia (valor configurable por empresa, entre 0 y 30).
* Un solo periodo `VIGENTE` por empresa, sin solapes (restricción de exclusión).
* Desactivar por falta de pago: `estado = INACTIVA`, motivo `VENCIMIENTO`.
* La nueva membresía empieza según cuándo se paga: antes del vencimiento (día siguiente al fin), durante la gracia (día siguiente al vencimiento), después (día del pago).

**Dominio (puro, con pruebas):**
* `calcularEstadoMembresia(fechas, diasGracia, hoy)`.
* `validarRuc(texto)`.
* `calcularInicioNuevaMembresia(finActual, hoy, diasGracia)`.

## Pruebas

* **Unitarias:** cada estado con fechas en el límite (7 días restantes, día del vencimiento, último día de gracia, primer día vencido). Cada caso de la regla de inicio de membresía.
* **Integración (Supabase local):** `empresa_activa()` devuelve falso para empresas `INACTIVA`; la restricción de exclusión rechaza dos membresías `VIGENTE` solapadas; un RUC duplicado se rechaza; un RUC con letras o longitud distinta de 11 se rechaza.
* **Aislamiento:** el superadmin ve todas las empresas; ningún usuario de empresa ve la lista de empresas.

## Criterios de aceptación

* El superadmin crea una empresa con RUC válido y registra un pago manual.
* La empresa queda `AL_DIA` con la fecha de fin correcta.
* Al pasar el vencimiento, la empresa entra en gracia; al pasar la gracia, queda `VENCIDA`, y el superadmin puede desactivarla.
* Un pago durante la gracia empieza el día siguiente al vencimiento.


## Seguridad y robustez de este corte

* Sin MFA (decisión del corte 1). El superadmin entra con correo y contraseña; RLS y el rol firmado en el JWT protegen cada acción.
* Login: tras 3 intentos fallidos, el botón de entrar se bloquea 30 segundos y luego se habilita de nuevo. El contador vive solo en la memoria de la página (no en `localStorage`), así que recargar la página lo reinicia. Es un freno para la persona, no una barrera; la barrera real es el límite de intentos de Supabase Auth.
* El monto del pago se toma del plan en el servidor; el cliente no lo envía.
* Acciones del superadmin (crear, activar, desactivar, pagar) quedan en auditoría.
* RUC y nombres se validan con Zod y se usan solo con parámetros en consultas.
* No se guarda ningún dato de tarjeta. El pago es por transferencia.
* Prueba: un usuario de empresa no puede llamar a las acciones del superadmin ni con la URL directa.

# Tareas: Corte 8 — Engrase

Verificación base de cada tarea: `npm run typecheck && npm run lint && npm run format:check && npm test`.

## - [x] T1. Dominio y permisos (M)

Pruebas primero.

- Aceptación:
  - Los 5 estados y los 3 tipos de aviso, justo en el límite, antes y después (criterios 1 y 2).
  - Registro completo, horómetro del registro y puntos efectivos.
  - Recurso `engrase`: planificador y supervisor todo; técnico lee y registra; gerente lee; superadmin nada. Solo planificador configura el aviso.
- Verificar: base.
- Depende de: nada.
- Archivos: `modules/engrase/domain/estado-engrase.ts`, `identidad/domain/permisos.ts`, `tests/unit/engrase.test.ts`, `tests/unit/identidad-permisos.test.ts`.

## - [x] T2. Tablas, columnas y RLS (S)

- Aceptación:
  - 4 tablas con FKs compuestas, CHECK, `unique` y RLS de solo lectura por empresa.
  - `empresas.engrase_aviso_tipo/valor` con 20 % por defecto, también en las existentes.
  - `database.types.ts` actualizado.
- Verificar: `engrase.sql` (aislamiento, incompleto sin observación, sin escritura directa, valor por defecto); `plataforma.sql`; revisar `get_advisors`.
- Depende de: nada.
- Archivos: `tests/integration/engrase.sql`, `shared/supabase/database.types.ts`.

## - [x] T3. Lectura de estados (M)

- Aceptación:
  - `engrase_equipos()` devuelve a los 4 roles los equipos activos con `requiere_engrase` de su empresa (criterios 6 y 10).
  - El caso de uso calcula estado y restante con el "hoy" de la zona de la empresa.
- Verificar: base + `engrase.sql`.
- Depende de: T1, T2.
- Archivos: `application/{casos-uso,repositorios}.ts`, `infrastructure/{index,engrase-repositorio}.ts`.

## - [x] T4. Pantalla `/engrase` (M)

- Aceptación:
  - Conteo, filtro, búsqueda, orden y paginación.
  - Menú activo para los 4 roles de empresa; ruta protegida.
- Verificar: base + `npm run build`; en Firefox con planificador y técnico.
- Depende de: T3.
- Archivos: `app/(app)/engrase/page.tsx`, `modules/engrase/ui/formato.ts`, `app/(app)/navegacion.ts`, `src/proxy.ts`.

### Punto de control A

- [x] Base y build. Firefox: pendiente de E2E_CLAVE.

## - [x] T5. Plan de engrase (M)

- Aceptación:
  - `guardar_plan_engrase` crea y edita plan y puntos en una transacción.
  - Modal precargado con las plantillas; exige horas o días.
  - Técnico y gerente no ven el botón y la base los rechaza.
- Verificar: base + `engrase.sql`; en Firefox, el equipo pasa a "sin registro".
- Depende de: T4.
- Archivos: `application/{esquemas,casos-uso,repositorios}.ts`, `infrastructure/engrase-repositorio.ts`, `app/(app)/engrase/{actions.ts,modales-engrase.tsx,page.tsx}`.

## - [x] T6. Registrar engrase (L, la de más riesgo)

Se parte en dos pasos, cada uno verificado.

**6a. Base**

- Aceptación:
  - `registrar_engrase`: bloquea el equipo, valida fecha y horómetro, calcula `completo`, copia los puntos, no duplica por clave (criterios 4, 5, 9).
  - `lecturas_antes_insert` admite `ENGRASE` solo desde la función; el técnico no inserta lecturas directas.
  - Tras una corrección de horómetro, el equipo no queda bloqueado.
- Verificar: `engrase.sql`, `equipos.sql`, `trabajos.sql`, `preventivos.sql`, `paradas.sql`.
- Archivos: `tests/integration/engrase.sql`.

**6b. App**

- Aceptación:
  - Modal con puntos marcables; observación obligatoria si falta alguno.
  - Incompleto no cambia el estado; completo lo deja "al día" (criterio 3).
- Verificar: base + build; recorrido en Firefox como técnico.
- Archivos: `application/{esquemas,casos-uso,repositorios}.ts`, `infrastructure/engrase-repositorio.ts`, `app/(app)/engrase/{actions.ts,modales-engrase.tsx,page.tsx}`.

- Depende de: T5.

### Punto de control B

- [ ] Plan → incompleto → completo funciona en Firefox y las 5 pruebas SQL pasan. Tu revisión.

## - [x] T7. Historial por equipo (S)

- Aceptación:
  - Registros con puntos, observación y quién registró, para los 4 roles (reusar `nombres_trabajos()` si alcanza).
  - La lectura `ENGRASE` se ve bien en el historial de horómetro del equipo.
- Verificar: base + build; Firefox.
- Depende de: T6.
- Archivos: `app/(app)/engrase/[id]/page.tsx`, `application/casos-uso.ts`, `infrastructure/engrase-repositorio.ts`.

## - [x] T8. Aviso de engrase (M)

- Aceptación:
  - `configurar_aviso_engrase` solo planificador, solo su empresa, con rangos (criterio 8).
  - Botón en `/engrase` visible solo para el planificador, con ejemplo y advertencia.
  - Cambiarlo cambia los estados sin tocar registros (criterio 7).
- Verificar: base + `engrase.sql`; Firefox como planificador y supervisor.
- Depende de: T6.
- Archivos: `application/{esquemas,casos-uso}.ts`, `infrastructure/engrase-repositorio.ts`, `app/(app)/engrase/{actions.ts,modales-engrase.tsx,page.tsx}`.

## - [ ] T9. Cierre del corte (S)

- Aceptación:
  - E2E del recorrido de la spec en Firefox.
  - Los 11 criterios revisados uno por uno.
  - `SPEC.md` al día con lo construido.
- Verificar: base + `npm run build` + `E2E_CLAVE=... npm run test:e2e -- tests/e2e/engrase.spec.ts`.
- Depende de: T7, T8.
- Archivos: `tests/e2e/engrase.spec.ts`, `SPEC.md`.

### Punto de control C

- [ ] Tu prueba en el navegador. Commit solo cuando lo pidas.

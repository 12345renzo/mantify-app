# Tareas: Corte 9 — Neumáticos

Verificación base de cada tarea: `npm run typecheck && npm run lint && npm run format:check && npm test`.
Rutas relativas a `src/` salvo `tests/`.

## - [x] T1. Dominio y permisos (M)

Pruebas primero.

- Aceptación:
  - Salud en el límite de cada umbral, umbral de equipo sobre categoría, sin umbral, desgaste irregular (criterios 1, 2, 3).
  - Costo por hora (`null` sin horas o sin costo), proyección y plantilla a posiciones (criterio 6).
  - Recursos `neumaticos` y `umbrales_neumaticos` según el plan.
- Verificar: base.
- Depende de: nada.
- Archivos: `modules/neumaticos/domain/{salud,costos,posiciones}.ts`, `modules/identidad/domain/permisos.ts`, `tests/unit/{neumaticos,identidad-permisos}.test.ts`.

## - [x] T2. Tablas, índices y RLS (M)

- Aceptación:
  - 7 tablas con FKs compuestas, CHECK, índices únicos parciales y RLS; sin escritura directa; `neumaticos` sin lectura directa.
  - `database.types.ts` al día.
- Verificar: `neumaticos.sql` (dos montajes sobre la misma posición o cubierta fallan por fuera de las funciones; sin escritura directa); `get_advisors`.
- Depende de: nada.
- Archivos: `tests/integration/neumaticos.sql`, `shared/supabase/database.types.ts`.

## - [x] T3. Stock de cubiertas (L, en dos pasos)

**3a.** `guardar_neumatico` y `neumaticos_listado` (costo oculto al técnico). Verificar: `neumaticos.sql`.
**3b.** `/neumaticos` con pestañas Montadas / Stock / Recapado y baja, modal "Nueva cubierta", menú activo y ruta protegida. Verificar: base + build.

- Aceptación: cargar sin historial; código repetido y costo negativo rechazados; el técnico no ve costos (criterio 8).
- Depende de: T1, T2.
- Archivos 3b: `modules/neumaticos/{application,infrastructure,ui}`, `app/(app)/neumaticos/{page,actions,modales-neumatico}`, `app/(app)/navegacion.ts`, `proxy.ts`.

### Punto de control A

- [ ] Cargar una cubierta y verla en stock. Tu revisión.

## - [x] T4. Posiciones y mapa del equipo (M)

- Aceptación: `definir_posiciones` desde plantilla y a mano; no se quita una posición ocupada; mapa por eje; la empresa B no ve nada (criterio 11).
- Verificar: base + `neumaticos.sql` + build.
- Depende de: T3.
- Archivos: `application`, `infrastructure`, `app/(app)/neumaticos/{equipo/[id]/page,actions,modales-posiciones}`.

## - [x] T5. Umbrales y salud (M)

- Aceptación: `guardar_umbrales` solo planificador, por categoría o equipo (criterios 3 y 9); contadores y orden por salud en la lista.
- Verificar: base + `neumaticos.sql`.
- Depende de: T4.
- Archivos: `application`, `infrastructure`, `app/(app)/neumaticos/{page,actions,modales-umbrales}`.

## - [x] T6. Montar y desmontar (L, la de más riesgo)

**6a. Base:** `montar_neumatico`, `desmontar_neumatico`, `NEUMATICO` en `lecturas_antes_insert`, horas acumuladas, clave. Verificar: `neumaticos.sql`, `engrase.sql`, prueba de caminos del horómetro.
**6b. App:** modales en el mapa. Verificar: base + build.

- Aceptación: no se monta dos veces ni dos en una posición (criterio 4); reintento sin duplicar (criterio 10).
- Depende de: T5.
- Archivos 6b: `application`, `infrastructure`, `app/(app)/neumaticos/{equipo/[id]/page,actions,modales-operacion}`.

### Punto de control B

- [ ] Cargar → posiciones → umbrales → montar → desmontar. Tu revisión.

## - [x] T7. Medir (M)

- Aceptación: sesión con tres puntos por cubierta y presión opcional; fuera de rango rechazado; la salud cambia (criterios 1 y 2); aviso de desgaste irregular.
- Verificar: base + `neumaticos.sql` + build.
- Depende de: T6.
- Archivos: `application`, `infrastructure`, `app/(app)/neumaticos/{equipo/[id]/page,actions,modales-medicion}`.

## - [x] T8. Rotar y recapar (M)

- Aceptación: rotar intercambia o mueve (criterio 5); recapar suma recapado y costo y vuelve a stock (criterio 7).
- Verificar: base + `neumaticos.sql`.
- Depende de: T7.
- Archivos: `application`, `infrastructure`, `app/(app)/neumaticos/{actions,modales-operacion}` y las dos páginas.

## - [x] T9. Detalle de la cubierta (S)

- Aceptación: historial, mediciones, costo por hora o km (criterio 6); proyección solo con plan Pro; el técnico sin costos.
- Verificar: base + build.
- Depende de: T8.
- Archivos: `app/(app)/neumaticos/[id]/page.tsx`, `application`, `infrastructure`.

## - [ ] T10. Cierre (S)

- Aceptación: E2E en Firefox; los 12 criterios revisados; spec al día.
- Verificar: base + build + `E2E_CLAVE=... npm run test:e2e -- tests/e2e/neumaticos.spec.ts`.
- Depende de: T9.
- Archivos: `tests/e2e/neumaticos.spec.ts`, `SPEC-corte9-neumaticos.md`.

### Punto de control C

- [ ] Tu prueba en el navegador. Commit solo cuando lo pidas.

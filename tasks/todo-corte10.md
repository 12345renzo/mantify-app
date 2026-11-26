# Tareas: Corte 10 — Dashboard, bandeja y exportaciones

Verificación base de cada tarea: `npm run typecheck && npm run lint && npm run format:check && npm test`.
Rutas relativas a `src/` salvo `tests/`. Plan: `tasks/plan-corte10.md`.

## - [x] T1. Dominio puro (M)

Pruebas primero.

- Aceptación:
  - `ordenarBandeja`: devueltos primero, luego criticidad, luego atraso, desempate fijo por tipo y código; misma entrada, misma salida; con empates reales.
  - Una función pura por indicador (preventivos, backlogs por criticidad, flota, OT, trabajos por técnico, horas de trabajo), con datos conocidos.
  - Recursos `reportes` y `respaldo_empresa` en `permisos.ts` según el plan.
- Hecho (2026-11-26): `reportes/domain/{orden-bandeja,indicadores}.ts`, 13 pruebas en `tests/unit/reportes.test.ts`. `reportes` ya existía (leer = exportar); se agregó solo `respaldo_empresa` (planificador y superadmin). Los indicadores reusan la regla de cada módulo (`situacion` de preventivos, estados de engrase, salud de neumáticos), así T2 devuelve filas ligeras y no conteos.
- Verificar: base.
- Depende de: nada.
- Archivos: `modules/reportes/domain/{orden-bandeja,indicadores}.ts`, `modules/identidad/domain/permisos.ts`, `tests/unit/{reportes,identidad-permisos}.test.ts`.

## - [x] T2. Funciones de lectura en la base (M)

- Aceptación:
  - `dashboard_resumen(p_mes)`, `dashboard_tecnico()` y `bandeja_pendientes()`, `security definer`, empresa y rol de la sesión.
  - Cada conteo coincide con la consulta directa al módulo; el técnico solo ve lo suyo; una empresa no ve a la otra.
  - `database.types.ts` al día.
- Verificar: `tests/integration/reportes.sql` (paridad por bloque, técnico, aislamiento); `get_advisors`.
- Depende de: nada (puede ir junto a T1).
- Archivos: `tests/integration/reportes.sql`, `shared/supabase/database.types.ts`.
- Hecho (2026-11-26): una sola función `dashboard_datos(p_desde, p_hasta)` (jsonb con backlogs, OT, preventivos, reprogramados, equipos y paradas) en lugar de tres: el dominio saca de ahí indicadores y bandeja. Engrase y neumáticos reusan sus casos de uso. `reportes.sql`: 15 puntos ok (paridad, técnico, aislamiento, gerente, rango, superadmin).

## - [x] T3. Dashboard y bandeja en `/inicio` (L, en dos pasos)

**3a.** Planificador, supervisor y gerente: tarjetas de los 9 bloques (el gerente solo flota), cola de validaciones del supervisor, enlaces con filtro a cada módulo. Reusa `paradas_reporte`, `engrase_equipos`, `neumaticos_listado`.
**3b.** Bandeja ordenada con `ordenarBandeja` y vista del técnico (sus OT/RM y accesos rápidos según `puede()`). `no-store` en `/inicio`.

- Aceptación: criterios 1, 2 y 3 de la spec; el superadmin sigue redirigido a `/panel`.
- Verificar: base + build; revisar a mano en Firefox con los 4 roles.
- Depende de: T1, T2.
- Archivos: `modules/reportes/{application,infrastructure,ui}/*`, `app/(app)/inicio/page.tsx`.
- Hecho (2026-11-26): `obtenerDashboard` por rol (GESTION / GERENTE / TECNICO), `armarBandeja` en el dominio (parada abierta y cubierta por cambiar = ALTA), `no-store` en `next.config.ts` para `/inicio` y `/reportes` (verificado con curl). Probado en Firefox con planificador, supervisor y técnico.

### Punto de control A

- [ ] Dashboard y bandeja probados con los 4 roles antes de seguir con exportaciones.

## - [x] T4. Excel por módulo, PDF de la OT y `/reportes` (L, en dos pasos)

**4a.** Límite de frecuencia, ruta de descarga con `no-store`, página `/reportes` (activa la entrada del menú) y Excel de trabajos, preventivos, equipos, engrase y neumáticos con `shared/exportar/xlsx.ts`; enlaces a los reportes de paradas del corte 7. Tope de 5000 filas.
**4b.** PDF de cada OT (datos, RM, historial, firmas como texto) y botón en `/trabajos/[id]`.

- Aceptación: criterio 4; el técnico no exporta; el Excel de neumáticos trae costos solo si el rol los ve; la tercera descarga seguida se corta.
- Verificar: base + `reportes.test.ts` (PDF y Excel contienen las mismas filas que la consulta) + build.
- Depende de: T3.
- Archivos: `modules/reportes/application/{exportar-excel-modulo,exportar-orden-pdf,limite-frecuencia}.ts`, `modules/reportes/infrastructure/generadores-*.ts`, `app/api/reportes/*`, `app/(app)/reportes/page.tsx`, `app/(app)/trabajos/[id]/page.tsx`.
- Hecho (2026-11-26): Excel de 5 módulos con el caso de uso de listado de cada uno; PDF de la OT con firmas como texto; `/reportes` en el menú (planificador, supervisor, gerente) y en `proxy.ts`; 429 en la cuarta descarga seguida. Verificado en Firefox: filas iguales al módulo, `no-store`, técnico 403.

## - [x] T5. JSON de la empresa para el planificador (M)

- Aceptación:
  - `exportar_empresa(p_empresa)` con lista explícita de tablas y columnas, sin hashes ni secretos.
  - Solo el planificador de su empresa (y el superadmin); el JSON de A no contiene ninguna fila de B.
  - Una prueba compara la lista con las tablas que tienen `empresa_id`, para que una tabla nueva no pase sin decidirse.
- Verificar: `reportes.sql` (aislamiento, campos prohibidos, cobertura de tablas) + unitaria del armado.
- Depende de: T4.
- Archivos: `modules/reportes/application/exportar-json-empresa.ts`, `app/api/reportes/empresa/route.ts`, `tests/integration/reportes.sql`.
- Hecho (2026-11-26): `_tablas_respaldo()` (lista de las 49 tablas con `empresa_id`, por nivel) y `exportar_empresa(p_empresa, p_completo)`; el caso de uso quedó en `application/exportar.ts`. `reportes.sql` puntos 5–7 ok (aislamiento, sin secretos, permisos, cobertura de tablas).

## - [x] T6. Respaldo por empresa para el superadmin (M)

- Aceptación:
  - Botón en `/empresas/[id]`; pide reescribir la contraseña; descarga directa; deja registro (quién, cuándo, qué empresa) en `eventos_auditoria`.
  - Solo el superadmin; el planificador y el resto reciben `FORBIDDEN`.
  - Incluye empresa, membresías, pagos y auditoría; no contiene filas de otra empresa.
  - E2E `tests/e2e/reportes-respaldo.spec.ts` en Firefox con la cuenta del superadmin (`E2E_SUPERADMIN`, `E2E_CLAVE_SUPERADMIN`): una clave mala no descarga; la buena descarga un JSON solo de esa empresa y deja su registro en auditoría; el planificador no ve el botón.
- Verificar: `reportes.sql` + unitarias (reautenticación fallida no descarga y no audita como éxito) + E2E + build.
- Depende de: T5.
- Archivos: `tests/e2e/{claves,reportes-respaldo.spec}.ts` (`claves.ts` lee también al superadmin), `modules/identidad/{application/repositorios,infrastructure/auth-supabase}.ts` (reintroducir `verificarClave`), `modules/reportes/application/exportar-respaldo.ts`, `app/api/reportes/respaldo/route.ts`, `app/(app)/empresas/[id]/*`.

## - [x] T7. Cierre (S)

- Aceptación: E2E en Firefox con los números del dashboard contra los del módulo, la bandeja y el técnico sin costos; los 6 criterios de la spec revisados; spec y `mantify-estado-cortes` al día.
- Verificar: base + build + `set -a; source .env; set +a; npx playwright test tests/e2e/reportes.spec.ts`.
- Depende de: T6.
- Archivos: `tests/e2e/reportes.spec.ts`, `SPEC-corte10-dashboard-exportaciones.md`.

### Punto de control B

- [ ] Tu prueba en el navegador. Commit solo cuando lo pidas.

# Spec: Mantify — Corte 10: Dashboard, bandeja y exportaciones — V1

Estado: **construida** (2026-11-26), falta tu prueba en el navegador y el commit. Plan: `tasks/plan-corte10.md`; tareas: `tasks/todo-corte10.md`.
`SPEC.md` (corte 8) y `SPEC-corte9-neumaticos.md` no se tocan. Donde esta spec difiere del corte 10, manda esta (sección 11).

## 1. Objetivo

Que cada rol vea al entrar lo que le toca atender, y que el planificador saque sus datos de Mantify (PDF, Excel, JSON). El corte **no crea datos propios**: lee de los cortes 1 a 9.

| Rol          | Dashboard (en `/inicio`)                                                      | Bandeja         | Exporta                           |
| ------------ | ----------------------------------------------------------------------------- | --------------- | --------------------------------- |
| Planificador | Los 9 bloques de la sección 3.1                                               | Toda la empresa | PDF, Excel por módulo, JSON       |
| Supervisor   | Lo mismo + cola de validaciones                                               | Toda la empresa | PDF, Excel por módulo             |
| Técnico      | Sus trabajos pendientes y acciones rápidas                                    | Solo lo suyo    | Nada                              |
| Gerente      | Estado de la flota (solo lectura)                                             | No              | PDF y Excel por módulo (solo lee) |
| Superadmin   | No ve dashboard (sigue en `/panel`); descarga el **respaldo** de cada empresa | No              | Respaldo por empresa              |

## 2. Lo que ya existe (cortes 1 a 9)

| Pieza                                                                                                                            | Dónde                      | Uso en el corte 10                                            |
| -------------------------------------------------------------------------------------------------------------------------------- | -------------------------- | ------------------------------------------------------------- |
| `src/shared/exportar/pdf.ts` (tabla A4, sin dependencias, texto legible sin comprimir) y `xlsx.ts`                               | corte 7                    | Base de todos los PDF y Excel nuevos. **No soporta imágenes** |
| Reporte diario PDF y Excel mensual de paradas (`/api/paradas/diario`, `/mensual`), `descargar.ts`                                | corte 7                    | **Ya hechos.** Solo se enlazan desde `/reportes`              |
| `paradas_reporte` (ranking de fallas, rango ≤ 366 días, máx. 5000 filas)                                                         | corte 7                    | Bloque 2 del dashboard                                        |
| `engrase_equipos()`, `neumaticos_listado()`, `neumaticos_equipos()`, `equipos_para_*`                                            | cortes 6 a 9               | Bloques 7 y 8; se reusan, no se reescriben                    |
| `eventos_auditoria` (`usuario_id`, `tabla`, `registro_id`, `accion`, `datos_*`, `creado_en`)                                     | corte 5                    | Registro de cada descarga de respaldo                         |
| `equipos.estado_movilizacion` (MOVILIZADO/DESMOVILIZADO/PENDIENTE) y `estado_operativo` (OPERATIVO/INOPERATIVO/EN_MANTENIMIENTO) | corte 4                    | Bloque 4 (flota)                                              |
| Bucket privado `archivos`                                                                                                        | corte 5                    | No se usa para el respaldo (ver 11.4)                         |
| `puede(rol, accion, recurso)`, `Modal`, `paginacion`, `hoyEn`, `Encabezado`, `Esqueleto`                                         | compartidos                | Reusar                                                        |
| Entrada "Reportes" del menú (`corte: 10`, `IconoReporte`, `--mod-reportes`) y `/inicio` con `Modulos`                            | `navegacion.ts`, `inicio/` | Se activa `/reportes`; el dashboard va en `/inicio`           |

No existe `src/modules/panel` ni ruta `(superadmin)`. `/panel` ya es la pantalla del superadmin.

## 3. Alcance

### 3.1 Dashboard (Server Components, una tarjeta por indicador)

Para el planificador, en este orden. **Período: el mes en curso** donde aplique.

1. **Preventivos:** vencidos, por vencer (alerta), ejecutados en el mes, reprogramados en el mes.
2. **Equipos con más fallas:** top 5 del ranking de paradas del mes.
3. **Backlogs pendientes** por criticidad.
4. **Flota:** movilizados, desmovilizados, pendientes y operativos.
5. **OT:** pendientes, vencidas, cerradas en el mes.
6. **Trabajos por técnico:** cada técnico y cuántos tiene en cada estado.
7. **Engrases:** al día, por vencer, vencidos.
8. **Neumáticos:** contador por salud (CAMBIAR/ALERTA/MEDIR/OK).
9. **Horas de trabajo:** ver pregunta abierta 1.

Cada tarjeta enlaza a su módulo con el filtro aplicado. **Un número del dashboard es el mismo que el del detalle del módulo.**
Supervisor: lo mismo + la cola de validaciones (backlogs y preventivos por validar). Técnico: sus OT/RM abiertas y accesos rápidos solo a lo que `puede()` le deja (iniciar parada, medir neumáticos, registrar engrase). Gerente: solo el bloque 4.

### 3.2 Bandeja de pendientes

Una lista única, en `/inicio`, de: paradas abiertas, validaciones, backlogs, preventivos, engrases y neumáticos. Cada ítem: tipo, código, equipo, criticidad, días de atraso, si fue devuelto, enlace.
Visibilidad por rol: planificador y supervisor ven toda la empresa; el técnico solo lo asignado a él; el gerente no la ve.

### 3.3 Exportaciones (`/reportes`)

| Salida               | Quién                             | Detalle                                                                                       |
| -------------------- | --------------------------------- | --------------------------------------------------------------------------------------------- |
| PDF de cada OT       | Planificador, supervisor, gerente | Botón en `/trabajos/[id]`. Datos, RM, historial y **firmas como texto** (quién y cuándo)      |
| PDF reporte diario   | Igual                             | Ya existe (corte 7); se enlaza                                                                |
| Excel por módulo     | Igual                             | Trabajos, preventivos, equipos, engrase, neumáticos (paradas ya existe). Tope 5000 filas      |
| JSON de la empresa   | **Solo planificador**             | Todos los datos de su empresa, sin archivos binarios (solo sus rutas), sin hashes ni secretos |
| Respaldo por empresa | **Solo superadmin**               | El mismo JSON + empresa, membresías, pagos y auditoría. Botón en `/empresas/[id]`             |

### 3.4 Datos y funciones (en la base, directo con `execute_sql`, sin migraciones)

Sin tablas nuevas. Todas son **funciones** `security definer` con revisión de empresa y rol, como en los cortes 5 a 9:

| Función                       | Roles                                           | Devuelve                                                                                |
| ----------------------------- | ----------------------------------------------- | --------------------------------------------------------------------------------------- |
| `dashboard_resumen(p_mes)`    | Planificador, supervisor, gerente               | Conteos de los bloques 1, 3, 4, 5, 6 y cola de validaciones, de la empresa de la sesión |
| `dashboard_tecnico()`         | Técnico                                         | Solo sus OT/RM abiertas                                                                 |
| `bandeja_pendientes()`        | Planificador, supervisor, técnico               | Ítems crudos para ordenar en el dominio; el técnico solo ve los suyos                   |
| `exportar_empresa(p_empresa)` | Planificador (la suya), superadmin (cualquiera) | JSON con las filas de cada tabla, filtradas por empresa                                 |

Los bloques 2, 7 y 8 reusan `paradas_reporte`, `engrase_equipos` y `neumaticos_listado`.
Costos de neumáticos: el JSON y el Excel de neumáticos los incluyen solo para planificador, supervisor y gerente.

### 3.5 Reglas de dominio (puras, con pruebas)

- **`ordenarBandeja(items)`:** devueltos primero → criticidad (ALTA > MEDIA > BAJA; sin criticidad, al final) → más días de atraso → desempate fijo por tipo y luego por código. Mismo resultado para la misma entrada, siempre.
- **Indicadores:** una función pura por bloque, que recibe datos ya leídos y devuelve el número (sin tocar la base).
- **`aplanarJsonEmpresa`:** nunca incluye `empresa_id` ajeno (prueba de aislamiento, sección 7).

## 4. Tech stack

El actual, **sin dependencias nuevas**: Next 16.4.6, React 19.3, TypeScript estricto, Supabase (Postgres 17), Zod 4, Tailwind 4, Vitest 5, Playwright 1.65. Antes de escribir código de Next, leer la guía en `node_modules/next/dist/docs/`.

## 5. Comandos

```bash
npm run typecheck
npm run lint
npm run format:check
npm test
npm run build && npx next start -p 3100
set -a; source .env; set +a; npx playwright test tests/e2e/reportes.spec.ts
```

## 6. Estructura

```
src/modules/reportes/                 # no "panel": ese nombre es el del superadmin
  domain/          orden-bandeja.ts, indicadores.ts
  application/     obtener-dashboard.ts, obtener-bandeja.ts, exportar-orden-pdf.ts,
                   exportar-excel-modulo.ts, exportar-json-empresa.ts, limite-frecuencia.ts
  infrastructure/  lector-dashboard.ts, generadores-pdf.ts, generadores-excel.ts
  ui/              tarjetas-indicadores.tsx, bandeja.tsx, botones-exportar.tsx
src/app/(app)/inicio/                 # dashboard y bandeja
src/app/(app)/reportes/page.tsx       # exportaciones
src/app/api/reportes/                 # rutas de descarga (PDF, Excel, JSON, respaldo)
tests/unit/reportes.test.ts           tests/integration/reportes.sql
tests/e2e/reportes.spec.ts
```

## 7. Pruebas

- **Unitarias:** `ordenarBandeja` con empates (mismo nivel, mismo atraso, mismo tipo); cada indicador con datos conocidos; el generador de PDF y de Excel con filas conocidas.
- **Integración SQL:** cada función de la base devuelve el mismo número que la consulta directa al módulo; el técnico solo ve lo suyo; `exportar_empresa` de A no contiene ninguna fila de B.
- **Exportación:** el PDF y el Excel contienen las mismas filas que la consulta (el PDF no está comprimido, así que se lee).
- **Seguridad:** el respaldo solo lo descarga el superadmin, con la clave reescrita; deja registro en `eventos_auditoria`; el límite de frecuencia corta la tercera descarga seguida.
- **E2E (Firefox):** los números del dashboard coinciden con los del módulo; la bandeja muestra primero lo devuelto; el técnico no ve costos.

## 8. Seguridad (de `cortes/10`)

- Respaldo: pide reescribir la contraseña, registra quién y cuándo en `eventos_auditoria`.
- Todas las funciones filtran por la empresa de la sesión; ninguna agrega datos entre empresas.
- Páginas y descargas con datos sensibles: `Cache-Control: no-store`.
- Límite de frecuencia en exportaciones pesadas (JSON, respaldo, Excel): 3 por minuto por cuenta.

## 9. Límites

**Siempre:** filtrar por empresa en la base; probar el aislamiento; reusar `shared/exportar`; texto en español de Perú, sin tecnicismos.
**Preguntar antes:** agregar dependencias (p. ej. una librería de PDF con imágenes); tablas nuevas; cambiar el formato de los reportes del corte 7.
**Nunca:** una vista o función que mezcle empresas; incluir contraseñas, hashes o tokens en un JSON; descargar el respaldo sin reautenticar; borrar o reescribir los reportes del corte 7.

## 10. Criterios de éxito

1. Cada número del dashboard coincide con el detalle de su módulo (probado en SQL y en E2E).
2. La bandeja muestra primero lo devuelto y luego lo más crítico, siempre en el mismo orden.
3. El técnico solo ve lo suyo y ningún costo.
4. El PDF de una OT, el Excel de cada módulo y el JSON de la empresa se descargan y traen las mismas filas que la pantalla.
5. El JSON de una empresa y el respaldo del superadmin no contienen ninguna fila de otra empresa.
6. El respaldo exige la clave, queda en auditoría y respeta el límite de frecuencia.

## 11. Diferencias con `cortes/10` (para que las apruebes)

1. **Módulo `reportes`, no `panel`:** `/panel` y su carpeta ya son del superadmin.
2. **Ruta del respaldo:** `src/app/(app)/empresas/[id]/`, no `(superadmin)/…/respaldo/` (esa carpeta no existe). Se le agrega un botón a esa pantalla.
3. **Funciones en vez de vistas:** el proyecto ya usa funciones `security definer` con revisión de rol. Una vista sobre tablas con RLS le mostraría al técnico menos filas, pero no controlaría columnas ni roles. Sin carpeta `supabase/migrations/`.
4. **Respaldo sin URL firmada ni almacenamiento:** el servidor arma el JSON y lo devuelve directo en la descarga. Cumple lo que pide el corte (vida corta, nada queda guardado) sin crear archivos que borrar. Si prefieres el bucket con URL firmada, se puede, pero es más código.
5. **Reporte diario PDF ya existe** (corte 7): no se reescribe.
6. **Firmas en el PDF de la OT como texto**, porque `pdf.ts` no admite imágenes (ver pregunta 2).

## 12. Diferido (V2)

- Selector de mes en el dashboard (V1 usa el mes en curso).
- Firmas dibujadas dentro del PDF de la OT (exige soporte de imágenes en `pdf.ts`).
- Gráficos; el dashboard es de números y listas.
- Restaurar un respaldo (V1 solo descarga).
- Respaldo automático programado.
- Avisos y correos (corte 11).

## 13. Decisiones aprobadas

1. **Horas de trabajo:** suma de `duracion_horas` de las paradas cerradas en el mes, por equipo y total.
2. **Firmas en el PDF de la OT:** como texto ("Firmado por X el día Y"). Dibujadas, en V2.
3. **Gerente** exporta PDF y Excel (solo lee).
4. **Respaldo del superadmin:** descarga directa, sin guardar nada en el servidor ni URL firmada.
5. **Límite de frecuencia:** 3 descargas pesadas por minuto por cuenta, en memoria (como el login).
6. **Trabajos del técnico:** el estado de cada OT que tiene a su cargo.

## 14. Construido (2026-11-26)

Diferencias con lo planeado, todas dentro del alcance:

- **Una sola función de lectura**, `dashboard_datos(p_desde, p_hasta)`, en vez de tres: devuelve filas ligeras (backlogs, OT, preventivos, reprogramados, equipos, paradas) y el dominio saca de ahí los indicadores y la bandeja con la regla de cada módulo. Engrase, neumáticos y el ranking reusan sus casos de uso.
- **Bandeja:** una parada abierta y una cubierta por cambiar cuentan como criticidad ALTA; lo demás sin criticidad propia va por atraso.
- **Respaldo:** `_tablas_respaldo()` lista las 49 tablas con `empresa_id` (nivel EMPRESA o SUPERADMIN) y `exportar_empresa(p_empresa, p_completo)` arma el JSON; con `p_completo` deja un registro `RESPALDO` en `eventos_auditoria` (se amplió su CHECK). Ruta `POST /api/reportes/respaldo` con revisión de origen; botón en `/empresas/[id]`.
- **Permisos:** `reportes` ya existía (leer = exportar); se agregó `respaldo_empresa`. Se reintrodujo `verificarClave` para pedir la contraseña.
- **`no-store`** para `/inicio` y `/reportes` en `next.config.ts`; las descargas ya lo traían.

| Criterio                                        | Cómo se comprobó                                                                                                                          |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Números = detalle del módulo                 | `reportes.sql` (paridad por lista) + E2E `reportes.spec.ts` (engrase, neumáticos, preventivos y cola de validación contra sus contadores) |
| 2. Bandeja: devuelto y crítico primero          | Unitarias de `ordenarBandeja` y `armarBandeja` + E2E                                                                                      |
| 3. Técnico solo lo suyo, sin costos             | `reportes.sql` punto 3 + E2E                                                                                                              |
| 4. PDF de OT, Excel y JSON con las mismas filas | Unitarias de las hojas y del PDF + prueba en Firefox (filas iguales, `no-store`, 403 al técnico)                                          |
| 5. JSON y respaldo sin datos de otra empresa    | `reportes.sql` puntos 5 y 7 + E2E `reportes-respaldo.spec.ts`                                                                             |
| 6. Respaldo con clave, auditoría y límite       | Unitarias + E2E + registro `RESPALDO` verificado en la base                                                                               |

Pruebas: 1138 unitarias, `tests/integration/reportes.sql` (25 puntos ok), E2E `reportes.spec.ts` y `reportes-respaldo.spec.ts` en Firefox.

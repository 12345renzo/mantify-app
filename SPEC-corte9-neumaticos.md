# Spec: Mantify — Corte 9: Neumáticos — V1

Estado: **aprobada; construida salvo el E2E en Firefox** (2026-11-25), con todas las propuestas de la sección 13. Base: `cortes/09-neumaticos.md` y `cortes/ESTANDARES.md`.
`SPEC.md` (corte 8) no se toca. Donde esta spec difiere del corte 9, manda esta (sección 11).

## 1. Objetivo

Saber qué cubierta está en qué posición, cuánto le queda y cuánto cuesta por hora.

| Rol (propuesta) | Qué hace                                                                             |
| --------------- | ------------------------------------------------------------------------------------ |
| Planificador    | Todo: cargar cubiertas, posiciones, operaciones, mediciones y **umbrales** (solo él) |
| Supervisor      | Cargar cubiertas, posiciones, operaciones y mediciones                               |
| Técnico         | Montar, rotar, desmontar y medir. No ve costos                                       |
| Gerente         | Solo lee, con costos                                                                 |
| Superadmin      | Nada                                                                                 |

## 2. Lo que ya existe (cortes 1 a 8)

| Pieza                                                                                           | Dónde                                    | Uso en el corte 9                                                               |
| ----------------------------------------------------------------------------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------- |
| Catálogo `motivos_retiro_neumatico`                                                             | corte 3                                  | Motivo al desmontar                                                             |
| Catálogo `plantillas_disposicion_neumatico` (5 presets; una línea por eje, posiciones con `\|`) | corte 3, `catalogos/domain/catalogos.ts` | Origen de las posiciones                                                        |
| `categorias_equipo` (HORAS / KILOMETROS)                                                        | corte 3                                  | Umbrales por categoría; etiqueta h o km                                         |
| `lecturas_horometro` ya admite origen `NEUMATICO`; etiqueta en Equipos                          | corte 4                                  | Falta permitirlo en `lecturas_antes_insert` para el técnico                     |
| Planes `ESTANDAR` y `PRO`                                                                       | corte 1                                  | La proyección es solo Pro (no hay todavía ningún bloqueo por plan en el código) |
| Funciones `security definer`, clave de idempotencia, `_acceso_trabajo()`                        | cortes 5 a 8                             | Mismo patrón                                                                    |
| Lectura de equipos para el técnico (`engrase_equipos()`)                                        | corte 8                                  | Mismo patrón                                                                    |
| `puede(rol, accion, recurso)`, `Modal`, `paginacion`, `parsearHorometro`, `hoyEn`               | compartidos                              | Reusar                                                                          |
| Entrada "Neumáticos" en el menú (`corte: 9`), `IconoNeumatico`, `--mod-neumaticos`              | `navegacion.ts`                          | Se activa con `href`                                                            |

No existe ninguna tabla, función ni módulo de neumáticos.

## 3. Alcance

### 3.1 Datos

| Tabla                         | Campos propios (además de `empresa_id` y auditoría)                                                                                                                                  | Reglas                                                                                                                   |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| `neumaticos`                  | `codigo`, `marca`, `modelo?`, `medida`, `cocada_nueva` (mm), `costo?`, `estado` (`STOCK`/`MONTADO`/`RECAPADO`/`BAJA`), `recapados`, `costo_recapados`, `horas_acumuladas`, `version` | `codigo` único por empresa; cocada > 0 y ≤ 150; costo ≥ 0 con tope                                                       |
| `posiciones_neumatico`        | `equipo_id`, `codigo`, `eje`, `orden`, `activo`                                                                                                                                      | `codigo` único por equipo activo; sin borrado; no se desactiva con cubierta montada                                      |
| `instalaciones_neumatico`     | `neumatico_id`, `posicion_id`, `montado_en`, `horometro_montaje`, `cocada_montaje`, `desmontado_en?`, `horometro_desmontaje?`, `motivo_id?`, `destino?`                              | **Índice único parcial** `(neumatico_id) where desmontado_en is null` y otro `(posicion_id) where desmontado_en is null` |
| `sesiones_medicion_neumatico` | `equipo_id`, `fecha`, `horometro`, `clave`                                                                                                                                           | Solo inserciones                                                                                                         |
| `mediciones_neumatico`        | `sesion_id`, `neumatico_id`, `posicion_id`, `interno`, `centro`, `externo`, `presion?`                                                                                               | Solo inserciones; 0 a `cocada_nueva + 5` mm; presión 0 a 200 psi                                                         |
| `eventos_neumatico`           | `neumatico_id`, `tipo` (carga, montaje, rotación, desmontaje, recapado, baja), `equipo_id?`, `posicion`, `horometro?`, `detalle`, `clave`                                            | Solo inserciones; historial y `unique (empresa_id, clave, neumatico_id)`                                                 |
| `parametros_neumatico`        | `categoria_id?` o `equipo_id?`, `cocada_minima`, `cocada_alerta`, `dias_sin_medir`, `diferencia_maxima`                                                                              | Exactamente uno de categoría o equipo; único por cada uno; `cocada_alerta > cocada_minima`                               |

RLS activa en las 7 tablas, solo lectura. Toda escritura por funciones.
La base la creo con `execute_sql`, sin migraciones.

**Costos:** el técnico no los ve. Como la RLS filtra filas y no columnas, `neumaticos` no se lee directo: se lee por función, que devuelve el costo en `null` al técnico.

**Funciones:**

| Función                                     | Roles                             | Hace                                                                       |
| ------------------------------------------- | --------------------------------- | -------------------------------------------------------------------------- |
| `guardar_neumatico`                         | Planificador, supervisor          | Carga o edita una cubierta, sin historial previo                           |
| `definir_posiciones(equipo, posiciones)`    | Planificador, supervisor          | Aplica una plantilla o ajusta a mano                                       |
| `montar_neumatico`                          | Planificador, supervisor, técnico | Bloquea posición y cubierta; exige `STOCK` y posición libre                |
| `rotar_neumaticos`                          | Los mismos                        | Intercambia dos posiciones del mismo equipo, o mueve a una libre           |
| `desmontar_neumatico`                       | Los mismos                        | Motivo y destino; suma las horas trabajadas                                |
| `recapar_neumatico`                         | Planificador, supervisor          | De `RECAPADO` a `STOCK`: +1 recapado, su costo y la cocada nueva           |
| `medir_neumaticos`                          | Planificador, supervisor, técnico | Una sesión con varias cubiertas del equipo, en una transacción             |
| `guardar_umbrales`                          | **Solo planificador**             | Por categoría o por equipo; quitar el del equipo vuelve al de la categoría |
| `neumaticos_listado` / `neumaticos_equipos` | Los 4 roles                       | Lecturas; costos ocultos al técnico                                        |

Todas las escrituras: transacción y bloqueo de fila; las operaciones y mediciones llevan clave de idempotencia.
Si el horómetro enviado es mayor que el actual, inserta una lectura `NEUMATICO`.

### 3.2 Reglas de dominio (puras)

- **Cocada** = el menor de los tres puntos. **Diferencia** = mayor − menor.
- **Cocada actual** = última medición del ciclo; si no hay, la de montaje o la nueva.
- **Umbrales efectivos:** los del equipo si existen; si no, los de la categoría; si no hay ninguno → `SIN_UMBRAL`.
- **`saludCubierta`**, en este orden:
  1. cocada ≤ mínima → `CAMBIAR`
  2. cocada ≤ alerta → `ALERTA`
  3. días desde la última medición (o el montaje) ≥ `dias_sin_medir` → `MEDIR`
  4. si no → `OK`
- **Desgaste irregular:** diferencia ≥ `diferencia_maxima`; es un aviso aparte, no cambia la salud.
- **`costoPorHora(costoTotal, horas)`:** `costo + costo_recapados` entre horas acumuladas más las del montaje actual. Sin costo o sin horas → `null`, nunca cero. En equipos de km, es costo por km.
- **`proyeccion(mediciones)`:** desgaste por hora entre la primera y la última medición del ciclo actual, y horas que faltan para la mínima. Menos de 2 mediciones o sin desgaste → `null`.

La salud no se guarda; se calcula al leer.

### 3.3 Pantallas

- `/neumaticos`: contador por salud (clic filtra), lista de cubiertas montadas (cambiar → alerta → medir → OK) y pestañas **Montadas / Stock / Recapado y baja**. Botones **Nueva cubierta** y **Umbrales** (este solo lo ve el planificador).
- `/neumaticos/equipo/[id]`: mapa de posiciones por eje y botones **Posiciones**, **Medir**, **Montar**, **Rotar**, **Desmontar**.
- `/neumaticos/[id]`: datos, historial, mediciones, costo por hora y, si el plan es Pro, la proyección.
- Formularios en modales; botones según el rol; `/neumaticos` protegida en `src/proxy.ts`.

Boceto del mapa:

```
VOL-01 · horómetro 1262 h                    [Posiciones] [Medir]

Eje 1     DEL-I  [C-014 · 9 mm  OK]        DEL-D  [C-015 · 5 mm  Alerta]
Eje 2     P1-IE  [C-020 · 3 mm  Cambiar]   P1-DE  [libre  + Montar]
```

## 4. Tech stack

El actual, sin dependencias nuevas: Next 16.4.6, React 19.3, TypeScript estricto, Supabase (Postgres 17), Zod 4, Tailwind 4, Vitest 5, Playwright 1.65. Antes de escribir código de Next, leer la guía en `node_modules/next/dist/docs/`.

## 5. Comandos

```bash
npm run typecheck
npm run lint
npm run format:check
npm test
npm run build && npx next start -p 3100
E2E_CLAVE=... npm run test:e2e -- tests/e2e/neumaticos.spec.ts
```

## 6. Estructura

```
src/modules/neumaticos/
  domain/        salud.ts (cocada, salud, umbrales, irregular), costos.ts (costo por hora, proyección),
                 posiciones.ts (de plantilla a posiciones)
  application/   casos-uso.ts, esquemas.ts, repositorios.ts
  infrastructure/index.ts, neumaticos-repositorio.ts
  ui/formato.ts
src/app/(app)/neumaticos/   page.tsx, [id]/page.tsx, equipo/[id]/page.tsx, actions.ts, modales-*.tsx
tests/unit/neumaticos.test.ts
tests/integration/neumaticos.sql
tests/e2e/neumaticos.spec.ts
```

Misma forma que `engrase`.

## 7. Estilo de código

Como el resto: dominio puro, nombres en español, `Result`/`DomainError`, comentarios solo para el porqué.

```ts
// Sin horas no hay costo por hora: null, nunca cero.
export function costoPorHora(
  costo: number | null,
  horas: number,
): number | null {
  return costo === null || horas <= 0 ? null : costo / horas;
}
```

## 8. Pruebas

**Unitarias** (primero): cada salud justo en el límite, un paso antes y después; umbral de equipo sobre el de categoría; sin umbral; cocada = mínimo; costo sin horas o sin costo = `null`; proyección con 0, 1 y 2+ mediciones; plantilla a posiciones; permisos por rol.

**Integración** (`neumaticos.sql`, se revierte todo):

- Una cubierta no puede estar en dos lugares ni una posición tener dos, **también insertando por fuera de las funciones** (índices parciales).
- Rotar con destino ocupado intercambia las dos; con destino libre, mueve.
- Misma clave dos veces: una sola operación.
- Medición fuera de rango, costo negativo: rechazados.
- Empresa B no ve ni toca nada de A; cada rol; empresa inactiva; sin sesión.
- Técnico no ve costos, no carga cubiertas y no cambia umbrales.
- Técnico sube el horómetro al montar, pero no inserta una lectura `NEUMATICO` directa.

La concurrencia real (dos sesiones a la vez) no se puede simular en el SQL editor: se cubre con el índice parcial y el bloqueo de fila.

**E2E** (Firefox): umbrales → cargar 2 cubiertas → montar → medir hasta "cambiar" → rotar → desmontar → recapar.

## 9. Criterios de aceptación

1. Con mínima 3 mm y alerta 6 mm: cocada 3 → **cambiar**, 3.1 → **alerta**, 6 → **alerta**, 6.1 → **OK**.
2. Puntos 8 / 5 / 9 → cocada **5**.
3. Un equipo con umbrales propios usa esos y no los de su categoría.
4. Una cubierta no se puede montar dos veces, ni dos en la misma posición.
5. Rotar sobre una posición ocupada intercambia las dos cubiertas.
6. Costo 1200 y 400 h → **3.00** por hora; sin horas → "—", no 0.
7. Recapar suma 1 recapado y su costo, y la cubierta vuelve a stock.
8. El técnico no ve ningún costo, tampoco llamando a la base.
9. Solo el planificador ve y cambia los umbrales.
10. Reintentar un envío no duplica la operación.
11. Nada de la empresa A es visible o modificable desde la B.
12. `typecheck`, `lint`, `format:check`, `test`, `build`, `neumaticos.sql` y recorrido en Firefox pasan.

## 10. Límites

**Siempre:** validar con Zod en el servidor y otra vez en la base; RLS en toda tabla nueva; probar con otra empresa y cada rol; no tocar datos reales.

**Preguntar antes:** tocar tablas o funciones de cortes anteriores (el único cambio previsto es agregar `NEUMATICO` en `lecturas_antes_insert`); agregar dependencias; commit o push.

**Nunca:** migraciones o CLI de Supabase; seeds; clave de servicio en acciones de usuario; saltar o borrar pruebas.

## 11. Diferencias con el corte 9

| Corte 9 dice                                                | Esta spec                       | Motivo                                                                          |
| ----------------------------------------------------------- | ------------------------------- | ------------------------------------------------------------------------------- |
| Tabla `disposicion_equipo`                                  | No se crea                      | Las posiciones del equipo ya son su disposición; la plantilla solo las precarga |
| Un archivo por operación y tres repositorios                | `casos-uso.ts` y un repositorio | Como está el código                                                             |
| `supabase/migrations/`                                      | `execute_sql`                   | Forma de trabajo acordada                                                       |
| `saludCubierta(cocada, umbrales, diasSinMedir, diferencia)` | La diferencia se evalúa aparte  | "Desgaste irregular se avisa aparte"                                            |

## 12. Diferido

- Carga masiva de cubiertas desde Excel.
- Fotos de cubiertas o mediciones.
- Rotar entre equipos distintos (hoy: desmontar y montar).
- Anular una operación (se corrige con otra operación).
- PDF o Excel (corte 10) y avisos (corte 11).

## 13. Decisiones aprobadas

Aprobadas tal como se propusieron.

1. **Roles:** ¿el técnico monta, rota, desmonta y mide, y no ve costos? Propuesta: sí.
2. **Umbrales sin configurar:** ¿la cubierta sale "sin umbral" hasta que el planificador los ponga por categoría, o quieres valores por defecto? Propuesta: "sin umbral".
3. **Moneda de los costos:** ¿soles o dólares? Propuesta: soles (`empresas.moneda` es la de tu cobro, no sirve aquí).
4. **Proyección (Pro):** ¿se muestra solo a empresas con plan Pro en este corte? Propuesta: sí.
5. **Equipos de km:** ¿las "horas" de neumáticos son km para ellos? Propuesta: sí, según la categoría.
6. **Presión:** ¿en psi? Propuesta: sí, opcional.

## 14. Construido (2026-11-25)

- 7 tablas, 2 índices únicos parciales de montaje, RLS de solo lectura; `neumaticos` sin lectura directa (costos).
- Funciones: `neumaticos_listado`, `neumaticos_equipos`, `guardar_neumatico`, `definir_posiciones`, `guardar_umbrales`, `montar_neumatico`, `desmontar_neumatico`, `rotar_neumaticos`, `recapar_neumatico`, `medir_neumaticos`; ayudantes internos `_neum_*` sin permiso para usuarios.
- `lecturas_antes_insert` admite `NEUMATICO` (solo con la marca interna).
- Quitar umbrales los desactiva (no se borra nada). Las posiciones se definen como texto, una línea por eje, igual que la plantilla del catálogo.
- Recursos de permisos: `neumaticos`, `costos_neumaticos` (planificador, supervisor y gerente) y `umbrales_neumaticos` (solo planificador).
- Encontrado y **no corregido** (es de cortes anteriores): en `lecturas_antes_insert`, si la marca `mantify.desde_rm` nunca se fijó en la transacción, `current_setting(..., true)` es nulo y la comprobación deja pasar. Hoy no se puede explotar (la RLS bloquea al técnico y las funciones ponen la marca). Arreglo de una línea: `coalesce(current_setting('mantify.desde_rm', true), '') = 'si'`.

## 15. Antes de empezar

- El corte 8 está commiteado (`4347e2d corte8`).

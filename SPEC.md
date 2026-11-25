# Spec: Mantify — Corte 8: Engrase — V1

Estado: **aprobada**. Base: `cortes/08-engrase.md` y `cortes/ESTANDARES.md`.
Donde este documento difiere del corte 8, manda este (ver "Diferencias con el corte 8").

## 1. Objetivo

Saber qué equipos necesitan engrase y dejar registro de lo que se engrasó.

| Rol | Qué hace |
| --- | --- |
| Planificador | Define el plan por equipo; registra engrases; **único que cambia el aviso de su empresa** |
| Supervisor | Define el plan por equipo; registra engrases |
| Técnico | Ve el estado de engrase y registra engrases |
| Gerente | Solo lee |
| Superadmin | Nada: no tiene pantalla ni acción de engrase; la empresa nace con el aviso por defecto |

## 2. Lo que ya existe (cortes 1 a 7)

| Pieza | Dónde | Uso en el corte 8 |
| --- | --- | --- |
| `equipos.requiere_engrase` y su casilla en el formulario | corte 4, `equipos/modales-equipo.tsx` | Filtro del listado. **No** se crea `marcar-no-requiere-engrase.ts` |
| Catálogo `tipos_grasa` | corte 3 | Grasa del plan y del registro |
| Catálogo `plantillas_puntos_engrase` (categoría opcional) | corte 3 | Puntos propuestos |
| `lecturas_horometro.origen_tipo` ya admite `ENGRASE` | corte 4 | Hay que permitirlo al técnico en el trigger `lecturas_antes_insert` |
| `categorias_equipo.tipo_medidor` (HORAS / KILOMETROS) | corte 3 | Etiqueta "h" o "km" |
| Motivo de parada `ENGRASE`; `generaEngrase` marcado como pendiente | corte 7 | Ver Diferido |
| Permisos `puede(rol, accion, recurso)` | `identidad/domain/permisos.ts` | Recurso nuevo `engrase` |
| `equipos_para_preventivos()` (el técnico no puede leer `equipos`) | corte 6 | Mismo patrón para engrase |
| Escrituras por funciones `security definer` con clave de idempotencia | cortes 5 a 7 | Mismo patrón |
| `hoyEn(zona)`, `diasEntre`, `sumarDias` | `shared/kernel` | Cálculo de vencimiento |
| `parsearHorometro`, `HOROMETRO_MAX` | `equipos/domain/horometro.ts` | Validación |
| `Modal`, paginación, `IconoGota`, `--mod-engrase` | `shared/ui` | Pantalla |
| Entrada "Engrase" en el menú con `corte: 8` | `app/(app)/navegacion.ts` | Se activa con `href` |

No existe ninguna tabla, función ni módulo de engrase.

## 3. Alcance

### 3.1 Datos

| Tabla | Campos propios (además de `empresa_id` y auditoría) | Reglas |
| --- | --- | --- |
| `planes_engrase` | `equipo_id`, `cada_horas?`, `cada_dias?`, `tipo_grasa_id` | Uno por equipo; al menos una frecuencia; horas > 0 y ≤ 100000; días 1 a 3650 |
| `puntos_engrase` | `equipo_id`, `descripcion`, `orden`, `activo` | 1 a 200 caracteres; sin borrado, se desactivan |
| `registros_engrase` | `equipo_id`, `fecha`, `horometro`, `tipo_grasa_id`, `completo`, `observacion?`, `clave` | Solo inserciones; `unique (empresa_id, clave)`; CHECK `completo or observacion de 3 caracteres o más`; observación máx. 500 |
| `registros_engrase_puntos` | `registro_id`, `descripcion`, `orden`, `engrasado` | Solo inserciones; guarda **copia del texto**, así el historial no cambia al editar puntos |
| `empresas` | `engrase_aviso_tipo` (`PORCENTAJE`/`HORAS`/`DIAS`), `engrase_aviso_valor` | `not null`, por defecto PORCENTAJE 20 (también las empresas existentes); porcentaje 1 a 100, horas 1 a 100000, días 1 a 3650; enteros |

FKs compuestas `(x_id, empresa_id)` como en el resto. Se crea con `execute_sql` (sin migraciones) y se actualiza `database.types.ts`.

**RLS:** activa en las 4 tablas. Leen los 4 roles de empresa de su propia empresa. **Sin políticas de escritura**: todo pasa por funciones.

**Funciones** (`security definer`, `search_path = ''`, revisan empresa activa, rol y equipo):

| Función | Roles | Hace |
| --- | --- | --- |
| `guardar_plan_engrase(p_equipo, p_datos)` | Planificador, supervisor | Crea o edita el plan y sus puntos en una transacción |
| `registrar_engrase(p_equipo, p_datos, p_clave)` | Planificador, supervisor, técnico | Bloquea el equipo, valida, calcula `completo`, inserta registro y puntos, sube el horómetro si es mayor |
| `configurar_aviso_engrase(p_tipo, p_valor)` | **Solo planificador** | Cambia esas dos columnas, y solo de su propia empresa (la toma de la sesión, no recibe `empresa_id`) |
| `engrase_equipos()` | Los 4 roles | Una consulta: equipos activos con `requiere_engrase`, lectura actual, plan y último registro completo |

### 3.2 Reglas de dominio (puras)

**Puntos de un equipo:** si tiene puntos propios activos, esos. Si no, las plantillas activas de su categoría más las generales (sin categoría). Al crear el plan, el formulario se precarga con las plantillas y se pueden agregar, quitar o cambiar puntos.

**Estado** — `calcularEstado(plan, ultimoCompleto, lectura, hoy, umbral)`, en este orden:

1. Sin plan → `SIN_PLAN`.
2. Sin registro completo → `SIN_REGISTRO`.
3. `restanteHoras = ultimo.horometro + cada_horas − lectura`; `restanteDias = días desde hoy hasta (ultimo.fecha + cada_dias)`.
4. Cualquier restante ≤ 0 → `VENCIDO` (lo que venza primero).
5. Cualquier restante ≤ margen → `POR_VENCER`.
6. Si no → `AL_DIA`.

Margen según el umbral:

| Tipo | Margen en horas | Margen en días |
| --- | --- | --- |
| PORCENTAJE | `cada_horas × v/100` | `cada_dias × v/100` |
| HORAS | `v` | no avisa por días |
| DIAS | no avisa por horas | `v` |

El estado no se guarda; se calcula al leer. "Hoy" sale del servidor en la zona de la empresa.

**Registro completo:** `esRegistroCompleto(total, engrasados)` = `total > 0 && engrasados === total`. La base lo calcula; el cliente nunca lo envía. Solo un registro completo reinicia el vencimiento. "Último" = mayor `(fecha, creado_en)`.

**Horómetro del registro:** número entre 0 y `HOROMETRO_MAX`, con hasta 2 decimales, no menor que el del último engrase del equipo (completo o no). Si el planificador corrigió el horómetro a la baja después de ese engrase, esa comparación se omite, para no bloquear el equipo. Si es mayor que el horómetro actual, se inserta una lectura `ENGRASE`.

**Fecha del registro:** no futura y no anterior a la del último engrase del equipo.

**Equipo:** eliminado o con `requiere_engrase = false` no aparece ni acepta registros.

### 3.3 Pantallas

- `/engrase` (Server Component): conteo por estado, filtro por estado y búsqueda por código en la URL, orden vencido → por vencer → sin registro → al día → sin plan, paginado. Columnas: equipo, estado, restante (horas/km y días), último engrase.
- Botón **Registrar engrase** (modal, Client Component): fecha, horómetro, tipo de grasa (precargado del plan), puntos marcables, observación obligatoria si falta alguno.
- Botón **Plan** (modal): frecuencia, grasa y puntos.
- Botón **Aviso de engrase** (modal) en `/engrase`: **solo lo ve el planificador**; para los demás roles no aparece.
  - Muestra el valor actual de su empresa: tipo (porcentaje del intervalo, horas fijas, días fijos) y cantidad.
  - Ayuda con ejemplo: "Plan de 250 h con 20 %: avisa cuando faltan 50 h".
  - Con HORAS o DIAS advierte que los planes sin esa medida no saldrán "por vencer".
  - Al guardar, los estados se recalculan. En los equipos de km, "horas" significa km y la etiqueta lo dice.
- Historial por equipo: `/engrase/[id]`, con registros, puntos marcados y quién registró.
- Botones según permiso; el gerente solo ve.
- Sin plan o sin puntos disponibles, el modal lo dice y no deja guardar un registro vacío.
- Se agrega `/engrase` a la protección de `src/proxy.ts`.

Registrar sin plan está permitido si hay puntos (plantillas); el estado sigue en "sin plan".

## 4. Tech stack

El actual, sin dependencias nuevas: Next 16.4.6 (`cacheComponents`), React 19.3, TypeScript estricto, Supabase (Postgres 17), Zod 4, Tailwind 4, Vitest 5, Playwright 1.65. Antes de escribir código de Next, leer la guía en `node_modules/next/dist/docs/`.

## 5. Comandos

```bash
npm run dev
npm run typecheck
npm run lint
npm run format:check
npm test
npm run build && npx next start -p 3100
E2E_CLAVE=... npm run test:e2e -- tests/e2e/engrase.spec.ts
```

## 6. Estructura

```
src/modules/engrase/
  domain/estado-engrase.ts      estado, margen del umbral, registro completo, horómetro, puntos efectivos
  application/casos-uso.ts      listar, historial, guardar plan, registrar, leer y configurar aviso
  application/esquemas.ts       Zod
  application/repositorios.ts   interfaces
  infrastructure/index.ts, engrase-repositorio.ts
  ui/formato.ts
src/app/(app)/engrase/          page.tsx, [id]/page.tsx, actions.ts, modales-engrase.tsx
tests/unit/engrase.test.ts
tests/integration/engrase.sql
tests/e2e/engrase.spec.ts
```

Se sigue la forma de `preventivos` (un `casos-uso.ts` por módulo), no un archivo por caso de uso.

## 7. Estilo de código

Como el resto: dominio puro, nombres en español, errores con `Result`/`DomainError`, comentarios solo para el porqué.

```ts
// Lo que venza primero manda; solo un registro completo cuenta como "último".
export function esRegistroCompleto(total: number, engrasados: number): boolean {
  return total > 0 && engrasados === total;
}
```

Cada server action: `obtenerActor()` → `schema.safeParse` → caso de uso con `exigirPermiso` → repositorio → `refresh()`, con mensajes por `mensajeError`.

## 8. Pruebas

**Unitarias** (primero, antes de la implementación):
- Los 5 estados; cada umbral justo en el límite, un paso antes y un paso después.
- PORCENTAJE, HORAS y DIAS; plan solo horas, solo días y ambos.
- Registro completo, incompleto y sin puntos.
- Horómetro menor, igual, mayor y no numérico.
- Puntos propios frente a plantillas.
- Permisos del recurso `engrase` por rol; el aviso, solo planificador.

**Integración** (`tests/integration/engrase.sql`, bloque `do $$` que revierte todo):
- Incompleto sin observación rechazado.
- `update` y `delete` sobre registros y puntos rechazados para todos los roles.
- Misma clave dos veces: un solo registro.
- Empresa B no ve ni escribe nada de A.
- Supervisor, técnico, gerente y superadmin no cambian el aviso; técnico no cambia planes; gerente no escribe nada.
- Empresa nueva y existente quedan con PORCENTAJE 20; cambiar el de A no toca el de B.
- Valor fuera de rango o tipo desconocido: rechazado.
- Técnico registra y sube el horómetro; no puede insertar una lectura `ENGRASE` directa.
- Equipo sin `requiere_engrase` o eliminado: rechazado y fuera del listado.
- Empresa inactiva y sin sesión: rechazadas.

**E2E** (Firefox): plan → registro incompleto (no queda al día) → registro completo (al día) → planificador cambia el aviso en `/engrase` y cambia el estado → supervisor y técnico no ven el botón.

## 9. Criterios de aceptación

1. Con `cada_horas = 250` y último completo en 1000: con lectura 1199 y aviso 20 % está **al día**; en 1200 **por vencer**; en 1250 **vencido**.
2. Con `cada_dias = 10`: el día 8 después del último completo pasa a **por vencer** (20 %) y el día 10 a **vencido**.
3. Un registro incompleto no cambia el estado ni el restante.
4. Un registro incompleto sin observación se rechaza en la pantalla, en el servidor y en la base.
5. Un horómetro menor que el del último engrase se rechaza con un mensaje claro.
6. Un equipo con `requiere_engrase = false` no aparece en `/engrase`.
7. Cambiar el umbral cambia los estados al recargar, sin tocar datos guardados.
8. Solo el planificador ve el botón de aviso en `/engrase` y lo cambia, solo el de su empresa; supervisor, técnico, gerente y superadmin no pueden, tampoco llamando a la base. El técnico no cambia planes.
9. Reintentar un envío no duplica el registro.
10. Nada de la empresa A es visible o modificable desde la B.
11. `typecheck`, `lint`, `format:check`, `test` y `build` pasan; `engrase.sql` todo "ok"; recorrido en Firefox.

## 10. Límites

**Siempre**
- Validar en el servidor con Zod y volver a validar en la base.
- RLS activa en toda tabla nueva; probar con otra empresa y con cada rol.
- Probar en Firefox con la empresa de prueba, sin tocar datos reales.

**Preguntar antes**
- Cambios en tablas o funciones de cortes anteriores fuera de los dos previstos (columnas en `empresas`, `ENGRASE` en `lecturas_antes_insert`).
- Agregar dependencias.
- Commit o push.

**Nunca**
- Migraciones o CLI de Supabase; seeds o datos iniciales (el valor por defecto del umbral es la única excepción propuesta).
- Clave de servicio en acciones de usuario.
- Quitar o saltar pruebas existentes.

## 11. Diferencias con el corte 8

| Corte 8 dice | Esta spec | Motivo |
| --- | --- | --- |
| `marcar-no-requiere-engrase.ts` | No se crea | Ya se hace al editar el equipo |
| `supabase/migrations/` | `execute_sql` | Forma de trabajo acordada |
| Un archivo por caso de uso | `casos-uso.ts` | Como está el código |
| `calcularEstado(plan, ultimo, lectura, umbral)` | Agrega `hoy` | Dominio puro: no lee el reloj |
| El umbral lo editan planificador o supervisor | Solo el planificador, con un botón en `/engrase` | Decisión tuya |
| `importar-plan-engrase.ts` | Diferido | Está en la estructura pero no en el alcance, las pruebas ni los criterios |

## 12. Diferido

- Importar planes de engrase desde Excel o CSV.
- Engrase generado desde una parada con motivo `ENGRASE` (importación y cierre).
- Anular o corregir un registro (hoy: se hace otro registro; el horómetro se corrige en Equipos).
- Frecuencia por categoría (plan heredado sin crear uno por equipo).
- Fotos en el engrase; PDF o Excel de engrase (corte 10); avisos (corte 11).

## 13. Decisiones

**Confirmadas por ti**
- El aviso es por empresa y solo lo cambia el planificador, con un botón en `/engrase` que los demás no ven.
- El superadmin no lo gestiona; solo existe el valor por defecto.

**Aprobadas**
1. Cumplida justo la frecuencia, ya está **vencido** (en preventivos el mismo día todavía no).
2. Sin plan se puede registrar con los puntos de plantilla.
3. Se mantienen los tres tipos de aviso, como pide el corte 8.
4. Sin importación de planes en este corte.
5. Los equipos desmovilizados salen en el listado.

## 14. Antes de empezar

- `cortes/README.md` pide cerrar el corte anterior. Según las notas del 2026-11-19, los cortes 6 y 7 no tenían E2E corrido ni prueba tuya; hay commits posteriores, pero no verifiqué su estado.
- El árbol de trabajo tiene cambios de membresía sin commit. Conviene commitearlos antes de empezar.

## 15. Sugerencias para cortes anteriores (fuera de este corte)

- `ESTANDARES.md` §12 exige `defineAction`/`defineRoute` y una prueba que lo verifique; no encontré ninguno en `src/`. Hay que implementarlo o ajustar el estándar.
- Ese mismo apartado pide límite de frecuencia por acción; revisar qué existe fuera del login.

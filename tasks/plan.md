# Plan de implementación: Corte 8 — Engrase

Spec de origen: `SPEC.md` (aprobada). Tareas: `tasks/todo.md`.

## Resumen

Módulo `engrase` con la forma de `preventivos`: dominio puro, funciones SQL para escribir, y pantallas `/engrase` y `/engrase/[id]`. Se avanza por cortes verticales: primero ver, luego definir el plan, registrar, historial y aviso.

## Dependencias

```
T1 dominio y permisos ─┐
T2 tablas y RLS ───────┴─ T3 lectura ── T4 pantalla ── T5 plan ── T6 registrar ──┬─ T7 historial
                                                                                 └─ T8 aviso ── T9 cierre
```

T1 y T2 pueden ir en paralelo. El resto es secuencial porque comparte repositorio y acciones.

## Decisiones de arquitectura

- El estado se calcula en el dominio al leer; la base no lo guarda.
- Las 4 tablas no tienen políticas de escritura; se escribe por funciones `security definer`.
- Una sola consulta (`engrase_equipos()`) alimenta el listado; filtro, orden y paginación se hacen en el servidor de la app, porque el estado no existe en la base.
  Límite conocido: sirve para cientos de equipos; con miles habría que calcular el estado en SQL.
- `registro completo` lo calcula la base. Los puntos efectivos se vuelven a leer en la base: el cliente solo dice cuáles marcó.
- La base se crea con `execute_sql`; cada tarea agrega sus casos a `tests/integration/engrase.sql`.
- Antes de escribir páginas o acciones, leer la guía de Next en `node_modules/next/dist/docs/` (AGENTS.md).

## Riesgos

| Riesgo                                                                                         | Impacto | Cómo se cubre                                                                                                       |
| ---------------------------------------------------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------- |
| Cambiar `lecturas_antes_insert` rompe backlog, preventivo, parada o la corrección de horómetro | Alto    | Cambiar solo la lista de orígenes; volver a correr `trabajos.sql`, `preventivos.sql`, `paradas.sql` y `equipos.sql` |
| Columnas nuevas en `empresas` afectan altas de empresa                                         | Medio   | Con `default`; correr `plataforma.sql` y las unitarias de plataforma                                                |
| El MCP cancela SQL que contiene `delete`                                                       | Medio   | La prueba de "no se puede borrar" la corres tú en el SQL editor                                                     |
| E2E sin `E2E_CLAVE`                                                                            | Medio   | Pedírtela antes de T9; sin ella queda escrito y sin correr, y se dice                                               |
| La base es la real                                                                             | Alto    | Pruebas SQL que revierten todo; E2E solo en la empresa de prueba                                                    |

## Estado previo

- Los cambios de membresía ya están commiteados (`36d57bc menbresia`).
- Falta confirmar que los cortes 6 y 7 estén cerrados (`cortes/README.md` lo pide).

## Preguntas abiertas

Ninguna de diseño. Solo `E2E_CLAVE` y el estado de los cortes 6 y 7.

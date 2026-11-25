# Plan de implementación: Corte 9 — Neumáticos

Spec de origen: `SPEC-corte9-neumaticos.md` (aprobada). Tareas: `tasks/todo.md`.
El plan del corte 8 está en git (`4347e2d`).

## Resumen

Módulo `neumaticos` con la forma de `engrase`. Cortes verticales: stock → posiciones y mapa → umbrales y salud → montar y desmontar → medir → rotar y recapar → detalle y costos.

## Dependencias

```
T1 dominio y permisos ─┐
T2 tablas y RLS ───────┴─ T3 stock ─ T4 posiciones y mapa ─ T5 umbrales ─ T6 montar/desmontar ─ T7 medir ─ T8 rotar/recapar ─ T9 detalle ─ T10 cierre
```

T1 y T2 pueden ir en paralelo; el resto es secuencial.

## Decisiones

- Salud, cocada, costo y proyección se calculan en el dominio al leer; no se guardan.
- Permisos: `neumaticos` (`leer`; `crear` = operar: montar, rotar, desmontar, medir; `editar` = cargar, posiciones, recapar) y `umbrales_neumaticos` (solo planificador). El técnico tiene `leer` y `crear`.
- Los valores de umbrales se leen con los 4 roles porque la salud los necesita; solo el planificador ve el botón y puede cambiarlos.
- Costos: `neumaticos` no se lee directo; la función de lectura devuelve `null` al técnico. Los eventos nunca guardan costos.
- Idempotencia: `eventos_neumatico` es única por `(empresa_id, clave, neumatico_id)`, porque rotar genera dos eventos con la misma clave.
- Rotar cierra las dos instalaciones y abre dos nuevas en la misma transacción; así los índices parciales no chocan y queda el historial.
- Cada medición guarda el número de recapado: la proyección y la cocada actual usan solo el ciclo vigente.
- Cocada actual = el dato más reciente del ciclo (medición o montaje); si no hay, la nueva.
- La base se crea con `execute_sql`; cada tarea agrega sus casos a `tests/integration/neumaticos.sql`.
- Antes de escribir páginas o acciones, leer la guía de Next en `node_modules/next/dist/docs/`.

## Riesgos

| Riesgo                                                                          | Impacto | Cómo se cubre                                                                          |
| ------------------------------------------------------------------------------- | ------- | -------------------------------------------------------------------------------------- |
| Cambiar `lecturas_antes_insert` rompe horómetro, paradas, preventivos o engrase | Alto    | Solo agregar `NEUMATICO`; repetir la prueba corta de todos los caminos y `engrase.sql` |
| Una cubierta o posición duplicada por carrera                                   | Alto    | Índices únicos parciales y `for update`                                                |
| El técnico ve costos por otra vía (tabla, evento, respuesta)                    | Alto    | Sin `select` directo a `neumaticos`; prueba específica                                 |
| El MCP cancela SQL con `delete`                                                 | Medio   | Las pruebas no usan `delete`; "no se puede borrar" lo corres tú                        |
| E2E sin `E2E_CLAVE`                                                             | Medio   | Pedirla antes de T10; sin ella queda escrito y sin correr                              |
| La base es la real                                                              | Alto    | Pruebas SQL que revierten todo; E2E solo en la empresa de prueba                       |

## Preguntas abiertas

Ninguna de diseño.

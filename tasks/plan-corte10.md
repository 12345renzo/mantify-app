# Plan de implementación: Corte 10 — Dashboard, bandeja y exportaciones

Spec de origen: `SPEC-corte10-dashboard-exportaciones.md` (aprobada). Tareas: `tasks/todo-corte10.md`.
`tasks/plan.md` y `tasks/todo.md` siguen siendo los del corte 9 (le falta su T10); no se tocan.

## Resumen

Módulo `reportes` sin tablas propias. Cortes verticales: dominio puro → funciones de lectura en la base → dashboard y bandeja → exportaciones (Excel, PDF de OT) → JSON de la empresa → respaldo del superadmin → cierre.

## Dependencias

```
T1 dominio ─┐
T2 base ────┴─ T3 dashboard y bandeja ─ T4 Excel y PDF de OT ─ T5 JSON de empresa ─ T6 respaldo superadmin ─ T7 cierre
```

T1 y T2 pueden ir en paralelo; el resto es secuencial (T4 a T6 reusan el límite de frecuencia y la ruta de descarga de T4).

## Decisiones

- Todo número del dashboard sale de una función SQL de la base (`dashboard_resumen`, `dashboard_tecnico`, `bandeja_pendientes`) que filtra por la empresa de la sesión; la app solo ordena y presenta. Los bloques 2, 7 y 8 reusan `paradas_reporte`, `engrase_equipos`, `neumaticos_listado`.
- Cada indicador y `ordenarBandeja` son funciones puras en `domain/`; la prueba de paridad compara la función SQL con la consulta directa al módulo.
- Permisos: `reportes` ya existía (`leer` = ver y exportar: planificador, supervisor, gerente); se agrega `respaldo_empresa` (solo planificador, JSON de su empresa); el respaldo del superadmin es una ruta solo para él.
- Descargas por rutas `GET /api/reportes/...` con `Cache-Control: no-store`, el patrón de `src/app/api/paradas/descargar.ts`.
- Límite de frecuencia en memoria (3 por minuto por cuenta). Limitación aceptada: se reinicia con el servidor y no se comparte entre instancias; se mejora si la app corre en más de un servidor.
- El JSON de una empresa lo arma `exportar_empresa(p_empresa)` en la base, con una lista explícita de tablas y columnas (sin hashes, tokens ni secretos). Una tabla nueva no entra al respaldo hasta que se agrega a esa lista; la prueba de T5 compara la lista con las tablas con `empresa_id`.
- E2E del respaldo: `tests/e2e/claves.ts` pasa a leer también `E2E_SUPERADMIN` y `E2E_CLAVE_SUPERADMIN` (ya están en `.env`); el test se salta si faltan.
- Respaldo del superadmin: reescribir la contraseña (se reintroduce `verificarClave` en `ServicioAuth`, que se quitó al simplificar el cambio de clave) y registrar en `eventos_auditoria` antes de entregar el archivo.
- La base se crea con `execute_sql`; cada tarea agrega sus casos a `tests/integration/reportes.sql`, que termina en `RAISE EXCEPTION` y no deja datos.
- Antes de escribir páginas o rutas, leer la guía de Next en `node_modules/next/dist/docs/`.

## Riesgos

| Riesgo                                                                        | Impacto | Cómo se cubre                                                                                                            |
| ----------------------------------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------ |
| El dashboard mezcla datos de otra empresa                                     | Alto    | Funciones con empresa de la sesión; prueba con dos empresas en `reportes.sql`                                            |
| Un número del dashboard no coincide con el módulo                             | Alto    | Prueba de paridad por bloque (SQL) y E2E que compara la tarjeta con la lista                                             |
| El JSON o el respaldo se llevan datos de otra empresa o secretos              | Alto    | Lista explícita de columnas; prueba de aislamiento y de campos prohibidos                                                |
| El técnico ve costos o trabajos ajenos                                        | Alto    | `dashboard_tecnico` y `bandeja_pendientes` filtran por la persona; prueba específica                                     |
| Respaldo o Excel pesado saturan el servidor                                   | Medio   | Tope de 5000 filas por tabla, límite de frecuencia, descarga en una sola respuesta                                       |
| El E2E del respaldo usa la cuenta real del superadmin                         | Medio   | Solo descarga y no cambia datos; correo y clave en `.env` (`E2E_SUPERADMIN`, `E2E_CLAVE_SUPERADMIN`), nunca en el código |
| Los 3 E2E viejos que fallan (engrase, paradas, preventivos) tapan regresiones | Medio   | Los de este corte no dependen de ellos; arreglarlos queda como pendiente aparte                                          |
| La base es la real                                                            | Alto    | Pruebas SQL que revierten todo; E2E solo en la empresa de prueba                                                         |

## Preguntas abiertas

Ninguna.

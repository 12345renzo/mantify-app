# Corte 6: Preventivos

## Resumen del corte anterior

Corte 5 entregó backlogs con su flujo completo: técnico crea, OT, RM, validación del supervisor, firmas, historial y códigos secuenciales. Ya funciona el ciclo de trabajo correctivo. Todavía no hay mantenimiento programado.

## Estructura y arquitectura

Mismo esquema. Se reutiliza el módulo de trabajos del corte 5 para el paso a backlog.

```
src/modules/preventivos/
  domain/        vencimiento.ts (alerta 7 días y horómetro), duracion.ts (cruce de medianoche),
                 actividad-observada.ts, plan-recurrencia.ts
  application/   programar-preventivo.ts, importar-preventivos.ts, ejecutar-preventivo.ts,
                 validar-preventivo.ts, devolver-preventivo.ts, generar-backlog-desde-observacion.ts
  infrastructure/ preventivos-repositorio.ts, planes-repositorio.ts
  ui/            calendario o lista de vencimientos, formulario de ejecución
src/app/(app)/preventivos/
supabase/migrations/   planes_preventivos, preventivos, actividades, repuestos, personal, firmas, historial
```

**Front:** la lista de vencimientos es Server Component con los indicadores. El formulario de ejecución es Client Component con las actividades (OK, OBSERVADO, NO APLICA).

**Back:** la alerta y el vencimiento son funciones puras que se evalúan al leer, no tareas guardadas. El backlog desde una observación llama al caso de uso del corte 5.

## Alcance

**Tablas:** `planes_preventivos`, `preventivos`, `preventivo_actividades`, `preventivo_repuestos`, `preventivo_personal`, `preventivo_firmas`, `preventivo_archivos`, `preventivo_historial_estados`.

**Programación:**
* Equipo, plan, tipo (PM1 a PM4), fecha, horómetro programado, responsable o tercero (con nombre), actividades desde plantilla.
* Importación CSV: si existe el mismo equipo, plan y fecha, se omite.

**Alerta:**
* 7 días antes de la fecha, o cuando el horómetro se acerca al programado.
* El sistema avisa. No crea el preventivo solo.

**Vencido:** `PROGRAMADO` con fecha pasada. No es un estado guardado. Se reprograma la semana siguiente.

**Ejecución:**
* Hora de inicio y fin. Si la fin es menor que la inicio, se suman 24 horas.
* Turno (día o noche) queda registrado.
* Una actividad `OBSERVADO` exige observación y puede generar un backlog con origen `PREVENTIVO`.

**Validación:** el supervisor aprueba o devuelve. Si devuelve, el técnico completa la observación.

**Tiempo de parada:** cada tipo (PM1 a PM4) tiene duración estándar del corte 3.

**Dominio (puro, con pruebas):**
* `estaVencido(preventivo, hoy)`.
* `enAlerta(fechaProgramada, hoy, diasAnticipacion)`.
* `duracionHoras(inicio, fin)`: suma 24 horas al cruzar medianoche.

## Pruebas

* **Unitarias:**
  * Vencimiento exacto en el día límite.
  * Alerta a 7 días, a 8 días y a 6 días.
  * Duración con cruce de medianoche y sin cruce.
  * Actividad observada sin observación rechazada.
* **Integración:**
  * Un preventivo `COMPLETADO` exige validación.
  * `UNIQUE` de equipo, plan y fecha impide duplicar en la importación.
  * El backlog generado queda con `origen = PREVENTIVO` y `preventivo_id`.
* **Aislamiento:** un plan de la empresa A no se aplica a equipos de la B.

## Criterios de aceptación

* La alerta aparece 7 días antes y no antes.
* Un preventivo ejecutado con cruce de medianoche calcula la duración correcta.
* Una actividad observada genera un backlog que aparece en la bandeja de trabajos.
* Importar el mismo CSV dos veces no duplica preventivos.


## Seguridad y robustez de este corte

* Importación CSV con límite de filas y tamaño, y neutralización de fórmulas.
* Fechas y horas se toman del servidor para el cálculo de vencimiento; el reloj del cliente no decide nada.
* Ejecución e importación con clave de idempotencia para evitar duplicados por reintento.
* Prueba: CSV con fórmulas, fechas imposibles y duplicados queda con errores por fila, sin escribir basura.

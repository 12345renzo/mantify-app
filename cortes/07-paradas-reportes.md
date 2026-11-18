# Corte 7: Paradas, reportes e importación

## Resumen del corte anterior

Corte 6 entregó preventivos con alerta a 7 días, ejecución con cálculo de duración, actividades observadas que generan backlog, y validación del supervisor. El mantenimiento programado ya funciona. Todavía no se registran paradas ni hay reportes.

## Estructura y arquitectura

Mismo esquema.

```
src/modules/paradas/
  domain/        revision-parada.ts (salida posterior, horómetro, duplicados, cruces),
                 duracion.ts, ranking-fallas.ts, reglas-motivo.ts (MCI no planificado)
  application/   iniciar-parada.ts, cerrar-parada.ts, crear-backlog-desde-parada.ts,
                 importar-paradas.ts, generar-reporte-diario.ts, generar-reporte-mensual.ts
  infrastructure/ paradas-repositorio.ts, exportador-pdf.ts, exportador-excel.ts
  ui/            inicio y cierre de parada, reporte diario con filtros
src/app/(app)/paradas/
supabase/migrations/   paradas, parada_archivos, índices de cruces y duplicados
```

**Front:** el reporte diario es Server Component con filtros en la URL. El inicio y cierre de parada son Client Components.

**Back:** la revisión al cerrar es una función pura. La exportación PDF y Excel se genera en el servidor con una ruta dedicada.

## Alcance

**Tablas:** `paradas`, `parada_archivos` (máximo 5 fotos).

**Flujo:**
1. Inicio: equipo, motivo, fecha y hora de parada, horómetro, responsable. El equipo queda "en mantenimiento".
2. Cierre: hora de salida, horómetro de salida, descripción de la tarea, área de demora y área de parada.
3. Revisión al cerrar: salida posterior a la parada, horómetro no baja, no hay duplicados (mismo equipo, hora y motivo). Los cruces con otra parada se avisan y se pueden confirmar.
4. Motivo: MCI siempre no planificado.
5. Derivados: hallazgo genera backlog; motivo ENGRASE genera engrase (corte 8).

**Reportes:**
* Diario: intervenciones de un día, con búsqueda y filtros, exportable a PDF.
* Mensual: Excel con el formato de la empresa.

**Ranking de fallas:** equipos con más paradas no planificadas en el periodo. Reemplaza cualquier advertencia por duración.

**Importación Excel:** crea equipos, paradas, backlogs y engrases que falten. Identificador de importación único por empresa (`id_importacion`) para no duplicar.

**Dominio (puro, con pruebas):**
* `revisarCierre(parada, otrasParadas)`: devuelve la lista de advertencias.
* `duracionHoras(inicio, fin)`.
* `rankingFallas(paradas, periodo)`: ordena por cantidad, con criterio fijo para empates.

## Pruebas

* **Unitarias:**
  * Cada regla de revisión por separado y combinada.
  * Ranking con empates y con equipos sin fallas.
  * Duración con fechas que cruzan días.
* **Integración:**
  * `UNIQUE (empresa_id, id_importacion)`: importar dos veces no duplica.
  * Una parada `CERRADA` exige fin, horómetro de fin y descripción.
* **Exportación:** el PDF y el Excel contienen las mismas filas que la consulta, verificadas por contenido.
* **Aislamiento:** el reporte de la empresa A nunca incluye paradas de la B.

## Criterios de aceptación

* El reporte diario de un día coincide con las paradas cargadas ese día.
* Importar el mismo Excel dos veces no duplica nada y avisa de observaciones repetidas.
* El ranking muestra los equipos con más paradas no planificadas del periodo.


## Seguridad y robustez de este corte

* Exportación a Excel con celdas neutralizadas contra inyección de fórmulas.
* PDF generado en el servidor con tiempo máximo; contenido escapado.
* Reportes con rango de fechas máximo, para que una consulta no sature la base.
* Importación de paradas con límite de filas y de tamaño, y clave de idempotencia por fila (`id_importacion`).
* Prueba: el reporte de la empresa A nunca incluye filas de B, aunque se manipule el filtro de la URL.

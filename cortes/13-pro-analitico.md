# Corte 13: Pro analítico

## Resumen del corte anterior

Corte 12 entregó el funcionamiento sin señal del plan Pro: sincronización con ElectricSQL, cola de escrituras, control de conflictos por versión y cierre de sesión limpio. Las operaciones funcionan con o sin conexión. Todavía no hay indicadores avanzados.

## Estructura y arquitectura

Mismo esquema. Todos los cálculos son funciones puras sobre datos ya leídos.

```
src/modules/analitica/
  domain/        disponibilidad.ts, mttr.ts, mtbf.ts, pareto.ts, turnos.ts,
                 demora-repuestos.ts, promedio-horas.ts, plan-accion.ts
  application/   obtener-indicadores-pro.ts (verifica que la empresa tenga plan Pro)
  infrastructure/ vistas-analitica.ts (v_disponibilidad, v_mttr, v_mtbf, v_pareto_fallas)
  ui/            pantallas de indicadores Pro, con bloqueo visual para plan Estándar
src/app/(app)/analitica/
supabase/migrations/   v_disponibilidad, v_mttr, v_mtbf, v_pareto_fallas
```

**Front:** las pantallas son Server Components. Si la empresa es Estándar, se muestra el bloqueo y no los números.

**Back:** la verificación del plan se hace en el caso de uso, no solo en la pantalla. Las fórmulas viven en `domain/`, no en SQL, así se prueban con números conocidos y las vistas solo agregan datos.

## Alcance

**Indicadores:**
* **Disponibilidad mecánica** = (horas del periodo − horas de paradas no planificadas) ÷ horas del periodo.
* **MTTR** = suma de duraciones de paradas no planificadas ÷ número de paradas no planificadas.
* **MTBF** = tiempo de operación ÷ número de fallas.
* **Pareto** de causas de falla.
* **Demora por repuestos:** tiempo entre la requisición y la entrega (requiere datos de requisiciones del corte 5).
* **Análisis de turnos:** no disponibilidad por turno (día y noche).
* **Fecha sugerida de preventivo:** a partir del promedio de horas de trabajo del equipo.
* **Plan de acción:** lista de mejoras según el estado de la flota (regla simple, revisable por el planificador).
* **Proyección de neumáticos:** ya implementada en el corte 9; aquí solo se muestra en el panel Pro.

**Dominio (puro, con pruebas numéricas):** cada fórmula es una función.

## Pruebas

* **Unitarias numéricas:** cada indicador con un caso calculado a mano en una hoja de cálculo aparte. El resultado debe coincidir exactamente.
* **Casos borde:** periodo sin paradas (disponibilidad 100%), MTBF sin fallas, MTTR con una sola parada, Pareto con causas empatadas.
* **Integración:** cada vista devuelve el mismo número que la función de dominio con los mismos datos.
* **Plan:** una empresa Estándar no obtiene indicadores Pro aunque llame directamente al caso de uso.
* **Aislamiento:** los indicadores de la A no incluyen datos de la B.

## Criterios de aceptación

* Los indicadores de un periodo de prueba coinciden con el cálculo manual.
* Una empresa Estándar ve el bloqueo, y el servidor también rechaza la consulta.
* Los casos sin datos muestran "sin datos", no cero ni error.


## Seguridad y robustez de este corte

* Verificación del plan Pro en el servidor en cada consulta, no solo en la pantalla.
* Periodos máximos por consulta y límite de frecuencia, para proteger la base de consultas pesadas.
* Las vistas filtran por empresa; ninguna expone datos de otra.
* Prueba: una empresa Estándar que llama directo al caso de uso recibe error, no datos.

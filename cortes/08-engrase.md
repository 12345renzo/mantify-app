# Corte 8: Engrase

## Resumen del corte anterior

Corte 7 entregó paradas con revisión al cerrar, reporte diario y mensual exportables, ranking de fallas e importación sin duplicados. Ya hay un registro de paradas al que puede enlazarse un engrase. Todavía no hay control de lubricación.

## Estructura y arquitectura

Mismo esquema.

```
src/modules/engrase/
  domain/        estado-engrase.ts (sin plan, sin registro, al día, por vencer, vencido),
                 umbral.ts (porcentaje, horas o días), registro-completo.ts
  application/   crear-plan-engrase.ts, agregar-punto.ts, registrar-engrase.ts,
                 marcar-no-requiere-engrase.ts, importar-plan-engrase.ts
  infrastructure/ engrase-repositorio.ts (incluye consulta del último registro completo)
  ui/            listado de estados, formulario de engrase con puntos
src/app/(app)/engrase/
supabase/migrations/   planes_engrase, puntos_engrase, registros_engrase, registros_engrase_puntos
```

**Front:** el listado de estados es Server Component. El formulario de registro es Client Component con la lista de puntos marcables.

**Back:** el estado se calcula al leer con `estado-engrase.ts`. Lo que se guarda son solo los registros, no el estado.

## Alcance

**Tablas:** `planes_engrase`, `puntos_engrase`, `registros_engrase` (solo inserciones), `registros_engrase_puntos`.

**Plan:**
* Frecuencia en horas, en días, o ambas (lo que venza primero).
* Tipo de grasa desde catálogo.
* Puntos del plan. Si el equipo no tiene plan, se usan los puntos generales de su categoría. Se pueden agregar puntos por equipo.

**Registro:**
* El técnico marca los puntos engrasados.
* Si quedan puntos sin marcar, la observación es obligatoria.
* El horómetro no puede ser menor que el del último engrase del equipo.
* Solo los registros completos reinician el vencimiento.

**Estados:** sin plan, sin registro, al día, por vencer, vencido.

**Umbral de "por vencer":** configurable por empresa (`engrase_aviso_tipo` y `engrase_aviso_valor`): porcentaje del intervalo, horas fijas o días fijos.

**Equipos sin engrase:** `requiere_engrase = false` los saca del listado.

**Dominio (puro, con pruebas):**
* `calcularEstado(plan, ultimoCompleto, lectura, umbral)`.
* `esRegistroCompleto(puntosTotal, puntosEngrasados)`.
* `validarHorometro(nuevo, ultimo)`.

## Pruebas

* **Unitarias:**
  * Cada estado, con el umbral exactamente en el límite (por ejemplo 20% del intervalo).
  * Umbral en porcentaje, en horas y en días.
  * Registro incompleto no reinicia el vencimiento.
  * Horómetro menor rechazado.
* **Integración:**
  * Un registro incompleto sin notas es rechazado por la restricción.
  * Solo inserciones en `registros_engrase`.
* **Aislamiento:** los puntos y planes de la empresa A no aparecen para la B.

## Criterios de aceptación

* El estado de un equipo pasa a "vencido" en el momento exacto según su umbral.
* Un registro incompleto no marca al equipo como al día.
* Un equipo con `requiere_engrase = false` no aparece en el listado.


## Seguridad y robustez de este corte

* Horómetro y puntos validados en servidor con rangos; rechazo de valores negativos o no numéricos.
* Registros de engrase con clave de idempotencia para evitar duplicados por reintento de red.
* Los planes y umbrales solo los edita el planificador o el supervisor, verificado por RLS.
* Prueba: un técnico no puede cambiar el umbral de aviso de la empresa.

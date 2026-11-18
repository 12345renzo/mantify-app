# Corte 9: Neumáticos

## Resumen del corte anterior

Corte 8 entregó engrase con estados por equipo, umbral configurable y registros completos que reinician el vencimiento. El control de lubricación ya funciona. Todavía no hay control de cubiertas.

## Estructura y arquitectura

Mismo esquema.

```
src/modules/neumaticos/
  domain/        salud-cubierta.ts (cambiar, alerta, medir, OK), desgaste.ts (cocada, diferencia),
                 proyeccion.ts (solo Pro, pero se implementa aquí), costo-hora.ts, umbrales.ts
  application/   cargar-neumatico.ts, montar.ts, medir.ts, desmontar.ts, rotar.ts,
                 recapar.ts, definir-disposicion.ts, ajustar-umbrales.ts
  infrastructure/ neumaticos-repositorio.ts, instalaciones-repositorio.ts, mediciones-repositorio.ts
  ui/            mapa de posiciones por equipo, formulario de medición, lista de salud
src/app/(app)/neumaticos/
supabase/migrations/   neumaticos, posiciones, disposicion, instalaciones, sesiones, mediciones,
                       eventos, parametros, índices únicos parciales
```

**Front:** el mapa de posiciones y la lista de salud son Server Components. La medición es Client Component con los tres puntos por cubierta.

**Back:** los estados de salud y el costo por hora son funciones puras. La unicidad de montaje la garantizan índices únicos parciales en la base.

## Alcance

**Tablas:** `neumaticos`, `posiciones_neumatico`, `disposicion_equipo`, `instalaciones_neumatico`, `sesiones_medicion_neumatico`, `mediciones_neumatico`, `eventos_neumatico`, `parametros_neumatico`.

**Carga libre:** cubiertas con medida, marca, cocada inicial y costo, sin necesidad de historial previo.

**Posiciones:** cada equipo tiene sus posiciones desde plantilla, ajustables.

**Operaciones:**
* **Montar:** cubierta en stock a una posición libre, con horómetro y cocada.
* **Medir:** tres puntos (interno, centro, externo) en mm y presión opcional. La cocada es el punto más bajo.
* **Desmontar:** motivo y destino (stock, recapado o baja).
* **Rotar:** intercambia dos cubiertas. Si el destino está ocupado, cambian las dos.
* **Recapar:** vuelve a stock con un recapado más y su costo.

**Salud:**
* Cambiar: cocada en o por debajo del mínimo de su categoría.
* Alerta: cocada en o por debajo del umbral de alerta.
* Medir: sin medición reciente.
* OK: lo demás.
* Desgaste irregular se avisa aparte.

**Umbrales:** por categoría, con valores propios por equipo que los reemplazan.

**Proyección y costo por hora:** proyección (desgaste por hora, cuándo llega a cambio) es Pro. El costo por hora solo se calcula si hay horas y costo.

**Dominio (puro, con pruebas):**
* `saludCubierta(cocada, umbrales, diasSinMedir, diferencia)`.
* `costoPorHora(costoTotal, horasTrabajadas)`.
* `proyeccion(mediciones)` (Pro, pero se prueba aquí).

## Pruebas

* **Unitarias:**
  * Cada estado de salud en el límite de cada umbral.
  * Umbral de equipo sobrescribe el de categoría.
  * Costo por hora sin horas devuelve nulo, no cero.
  * Cocada como mínimo de los tres puntos.
* **Integración:**
  * Una cubierta no puede estar montada en dos lugares (índice único parcial).
  * Una posición no puede tener dos cubiertas.
  * Rotar con destino ocupado intercambia las dos.
* **Aislamiento:** la disposición de un equipo de la A no es visible para la B.

## Criterios de aceptación

* Una cubierta con cocada en el umbral aparece como "cambiar".
* Un equipo con umbrales propios usa esos valores, no los de su categoría.
* Una cubierta no se puede montar dos veces, ni dos cubiertas en la misma posición.


## Seguridad y robustez de este corte

* Mediciones con rango físico (0 a cocada inicial + 5 mm, presión dentro de un límite razonable) validado en servidor.
* Costos y horas con valores no negativos y límites de tamaño.
* Índices únicos parciales en la base que garantizan la integridad aunque falle la aplicación.
* Operaciones de montaje, rotación y desmontaje en transacción con bloqueo de posición.
* Prueba de concurrencia: dos montajes sobre la misma posición, uno solo queda.

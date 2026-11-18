# Corte 4: Equipos y horómetro

## Resumen del corte anterior

Corte 3 entregó los catálogos editables por empresa, con sus seeds iniciales (categorías, sistemas, motivos, áreas, grasas, plantillas). Ya existen todas las listas que usan los equipos y los trabajos. Todavía no hay equipos ni horómetro.

## Estructura y arquitectura

Mismo esquema. En este corte se agrega:

```
src/modules/equipos/
  domain/        horometro.ts (regla de solo subir), estado-movilizacion.ts, parser-excel-equipos.ts
  application/   crear-equipo.ts, registrar-lectura.ts, corregir-horometro.ts,
                 desmovilizar-equipo.ts, importar-equipos.ts
  infrastructure/ equipos-repositorio.ts, lecturas-repositorio.ts, excel-lector.ts
  ui/            flota, ficha del equipo (pestañas), formulario de horómetro
src/app/(app)/equipos/           listado, inactivos y ficha
supabase/migrations/             equipos, lecturas_horometro, trigger de horómetro
```

**Front:** la flota y la ficha son Server Components. El formulario de lectura de horómetro es Client Component. La importación sube el archivo a una server action.

**Back:** la regla del horómetro vive en `domain/horometro.ts` y se prueba sin base. La base la repite con un trigger, así una escritura directa tampoco puede bajarlo.

## Alcance

**Tablas:** `equipos`, `lecturas_horometro` (solo inserciones).

**Equipos:**
* Código único por empresa, normalizado a mayúsculas sin espacios.
* `estado_operativo`: `OPERATIVO`, `INOPERATIVO`, `EN_MANTENIMIENTO`.
* `estado_movilizacion`: `MOVILIZADO`, `DESMOVILIZADO`, `PENDIENTE`.
* `requiere_engrase`: si es `false`, sale del listado de engrase.
* Solo el planificador crea, edita o desmoviliza.

**Horómetro:**
* Solo sube. Una lectura menor se rechaza.
* Corrección a la baja: solo el planificador, con motivo, queda en auditoría y avisa para verificar en físico.
* La lectura puede venir de un trabajo, una parada, un engrase, una medición o una importación (`origen_tipo`).

**Baja:** `DESMOVILIZADO` saca el equipo de la lista activa y lo muestra en inactivos con su historial. No se borra.

**Importación Excel:** crea equipos nuevos y actualiza los existentes por código. Errores por fila, sin cortar la importación.

**Dominio (puro, con pruebas):**
* `validarLectura(actual, nueva, esCorreccion, motivo)`.
* `normalizarCodigo(texto)`.
* `parsearFilaEquipo(fila)`: devuelve el equipo o el error de esa fila.

## Pruebas

* **Unitarias:**
  * Horómetro igual, mayor, menor, menor con corrección y sin motivo.
  * Normalización de códigos.
  * Parser de Excel con filas vacías, duplicadas, con texto donde va número, y con columnas faltantes.
* **Integración:**
  * El trigger rechaza una escritura directa que baje `horometro_actual`.
  * `lecturas_horometro` no acepta actualizaciones ni borrados.
  * Importar el mismo archivo dos veces no duplica equipos.
* **Aislamiento:** un planificador de la A no ve equipos de la B; el código `EQ-001` puede existir en ambas.

## Criterios de aceptación

* El planificador crea un equipo y registra su horómetro inicial.
* Una lectura menor se rechaza con mensaje claro; una corrección con motivo queda registrada.
* Un equipo desmovilizado aparece en inactivos con su historial.
* La importación de un Excel con errores crea las filas válidas y reporta las que fallaron.


## Seguridad y robustez de este corte

* Importación de Excel con tamaño máximo de archivo y de filas. Lectura con una librería que no ejecuta macros.
* Neutralizar fórmulas (`=`, `+`, `-`, `@`) en cada celda leída y exportada.
* Valores numéricos con rango: horómetro entre 0 y un máximo razonable; rechazo de `NaN`, `Infinity` y notación científica extraña.
* Trigger en la base que impide bajar el horómetro, aunque se escriba directo.
* Pruebas con archivos maliciosos: fórmulas, filas enormes, celdas con HTML, caracteres de control.

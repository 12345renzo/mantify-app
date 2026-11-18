# Corte 3: Catálogos

## Resumen del corte anterior

Corte 2 entregó personas, usuarios, roles, matriz de permisos y primer ingreso. Ya se puede crear y dar de baja personal, y cada rol entra con sus permisos. Todavía no hay equipos ni datos operativos.

## Estructura y arquitectura

Mismo esquema. En este corte se agrega:

```
src/modules/catalogos/
  domain/        reglas de activación y unicidad de catálogos
  application/   listar-catalogo.ts, crear-elemento.ts, desactivar-elemento.ts
  infrastructure/ catalogos-repositorio.ts (un repositorio genérico por tabla)
  ui/            pantalla de catálogos editables
src/app/(app)/configuracion/catalogos/
supabase/migrations/   tablas de catálogo y seeds por empresa
supabase/seed/         valores iniciales de la sección 3 del documento
```

**Front:** pantalla única de catálogos con selector de tipo. Los formularios son Client Components con Zod.

**Back:** un solo caso de uso genérico por operación, parametrizado por el catálogo. Cada catálogo tiene su esquema Zod.

## Alcance

**Tablas:** `ubicaciones`, `categorias_equipo`, `sistemas_mantenimiento`, `motivos_parada`, `areas_responsables`, `motivos_retiro_neumatico`, `tipos_grasa`, `nombres_plan_preventivo`, `plantillas_actividades`, `plantillas_puntos_engrase`, `plantillas_disposicion_neumatico`.

**Seeds:** los valores de la sección 3 del documento. Cada empresa nueva recibe su copia; después la empresa edita la suya sin afectar a otras.

**Reglas:**
* Nombres únicos por empresa (restricciones de la base).
* Un catálogo no se borra si tiene uso; se desactiva.
* `motivos_parada`: MCI es no planificado; PM1 a PM4 son planificados; cada motivo tiene `duracion_estandar_horas` para PM1 a PM4.
* `categorias_equipo` tiene `tipo_medidor` (horas o kilómetros) y `nombre_flota` para importar desde Excel.

**Dominio:**
* `puedeDesactivar(elemento, enUso)`: solo si no está en uso.
* Validación de nombres (sin duplicados ignorando mayúsculas y tildes).

## Pruebas

* **Unitarias:** reglas de desactivación; normalización de nombres para comparar.
* **Integración:**
  * Los seeds cargan sin error.
  * Cada empresa nueva recibe todos los catálogos iniciales.
  * Dos empresas pueden tener el mismo nombre de catálogo sin chocar.
* **Aislamiento:** un planificador de la empresa A no ve ni edita catálogos de la B.

## Criterios de aceptación

* Una empresa nueva tiene todos sus catálogos con los valores iniciales.
* El planificador agrega una ubicación y la desactiva sin perder el historial que la usa.
* Editar un catálogo de una empresa no cambia el de otra.


## Seguridad y robustez de este corte

* Los nombres de catálogo se muestran escapados (React) y se validan en longitud y caracteres.
* Asignación masiva bloqueada: el esquema de cada catálogo solo acepta sus campos.
* Solo el planificador de la empresa edita catálogos; RLS lo verifica en la base.
* Prueba: intento de editar un catálogo de otra empresa por identificador devuelve error, no datos.

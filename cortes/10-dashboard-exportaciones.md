# Corte 10: Dashboard, bandeja y exportaciones

## Resumen del corte anterior

Corte 9 entregó neumáticos: cargas libres, montajes, mediciones, rotaciones, recapados, salud y costo por hora. Ya están todos los módulos operativos. Todavía no hay una vista que los junte ni exportaciones completas.

## Estructura y arquitectura

Mismo esquema. Este corte no tiene datos propios: lee de los módulos anteriores.

```
src/modules/panel/
  domain/        orden-bandeja.ts (urgencia), indicadores.ts (cálculos del dashboard)
  application/   obtener-dashboard.ts (por rol), obtener-bandeja.ts,
                 exportar-orden-pdf.ts, exportar-reporte-diario-pdf.ts, exportar-json-empresa.ts
  infrastructure/ consultas-agregadas.ts (vistas de la base), generadores-pdf.ts, generadores-excel.ts
  ui/            tarjetas de indicadores por rol, bandeja, botones de exportación
src/app/(app)/inicio/
src/app/(superadmin)/empresas/[id]/respaldo/   botón de respaldo por empresa
supabase/migrations/   vistas: v_backlogs_abiertos, v_backlogs_atrasados, v_pendientes_validacion,
                       v_preventivos_vencidos, v_estado_engrase, v_salud_neumaticos
```

**Front:** el dashboard es Server Component: cada tarjeta es un indicador leído en el servidor. Los botones de exportación llaman a una ruta que devuelve el archivo.

**Back:** las consultas agregadas viven en la base (vistas). La aplicación solo arma la respuesta por rol. La bandeja se ordena con una función pura.

## Alcance

**Dashboard del planificador, en este orden:**
1. Preventivos: vencidos, por vencer, ejecutados, reprogramados.
2. Equipos con más fallas (ranking del corte 7).
3. Backlogs pendientes por criticidad.
4. Estado de la flota: movilizados, desmovilizados, pendientes, operativos.
5. OT: pendientes, vencidas, cerradas.
6. Trabajos asignados a cada técnico y su estado.
7. Engrases.
8. Neumáticos.
9. Horas de trabajo.

**Por rol:**
* Supervisor: lo mismo, más la cola de validaciones.
* Técnico: sus trabajos pendientes y acciones rápidas.
* Gerente: estado de la flota, solo lectura.

**Bandeja de pendientes:** paradas abiertas, validaciones, backlogs, preventivos, engrases y neumáticos, ordenados por urgencia.

**Exportaciones:**
* PDF: reporte diario y cada OT.
* Excel: por módulo.
* JSON: respaldo completo de la empresa para el planificador.
* Respaldo de la base por empresa desde el superadmin (botón). Obligatorio mientras el plan Free no tenga respaldos automáticos.

**Dominio (puro, con pruebas):**
* `ordenarBandeja(items)`: devueltos primero, luego criticidad, luego atraso, con desempate fijo.
* Cada indicador como función de datos ya leídos.

## Pruebas

* **Unitarias:** orden de la bandeja con empates; cada indicador con un conjunto de datos conocido.
* **Integración:** cada vista devuelve el mismo número que la consulta directa al módulo.
* **Exportación:** el PDF y el Excel contienen las mismas filas que la consulta. El JSON de una empresa no contiene datos de otra (prueba de aislamiento obligatoria).
* **Respaldo del superadmin:** solo el superadmin puede descargarlo.

## Criterios de aceptación

* Los números del dashboard coinciden con el detalle de cada módulo.
* La bandeja muestra primero lo devuelto y lo más crítico.
* El respaldo de una empresa se descarga y no contiene datos de otra.


## Seguridad y robustez de este corte

* Respaldo de base por empresa: exige volver a escribir la contraseña (reautenticación) y deja registro en auditoría con quién y cuándo lo descargó.
* Archivo de respaldo con URL firmada de vida corta, borrado después de descargarse.
* Consultas del dashboard con filtro de empresa en la base; ninguna vista agrega datos entre empresas.
* Páginas con datos sensibles con `Cache-Control: no-store`.
* Límite de frecuencia en exportaciones pesadas, para evitar que una cuenta sature el servicio.
* Prueba: el respaldo de A no contiene ninguna fila de B.

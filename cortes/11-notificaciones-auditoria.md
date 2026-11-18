# Corte 11: Notificaciones y auditoría

## Resumen del corte anterior

Corte 10 entregó el dashboard por rol con sus indicadores, la bandeja ordenada, las exportaciones PDF, Excel y JSON, y el respaldo de la base por empresa desde el superadmin. El sistema ya muestra y exporta todo lo operativo. Todavía no avisa ni deja registro de auditoría.

## Estructura y arquitectura

Mismo esquema.

```
src/modules/auditoria/
  domain/        eventos-criticos.ts (qué se audita), plantillas-notificacion.ts
  application/   registrar-evento.ts, notificar.ts, enviar-avisos-membresia.ts
  infrastructure/ notificaciones-repositorio.ts, auditoria-repositorio.ts, correo.ts
  ui/            campanita de notificaciones, lista de notificaciones no leídas
src/app/api/jobs/avisos-membresia/   ruta que dispara los avisos (job diario)
supabase/migrations/   notificaciones, eventos_auditoria, trigger de auditoría
```

**Front:** la lista de notificaciones es Client Component con actualización al volver a la app. La vista de auditoría para el planificador es Server Component.

**Back:** la auditoría la escribe un trigger de base de datos, para que no dependa de que el código lo recuerde. Las notificaciones las crea el caso de uso que produce el evento.

## Alcance

**Tablas:** `notificaciones`, `eventos_auditoria`.

**Notificaciones:**
* Trabajo llega a validación.
* Trabajo devuelto.
* Vencimiento de membresía (7 días antes, día del vencimiento, bloqueo, reactivación).
* Conflicto de sincronización (solo cuando exista el corte 12).

**Correo de membresía:** se envía desde un job diario que revisa las membresías. Cada aviso se registra en `avisos_membresia` y no se repite (una vez por tipo y membresía).

**Auditoría:**
* Trigger en tablas críticas: backlogs, OT, RM, preventivos, paradas, membresías, pagos, equipos.
* Registra quién, qué, cuándo, valores anteriores y nuevos.
* Corrección después de cerrar queda como `CORRECCION`.
* Las filas no se pueden modificar ni borrar.

**Dominio (puro, con pruebas):**
* `debeAuditarse(tabla, accion)`.
* `plantillaNotificacion(tipo, datos)`.

## Pruebas

* **Unitarias:** qué eventos generan notificación y cuáles no; texto de cada plantilla.
* **Integración:**
  * El trigger registra un `UPDATE` y un `CORRECCION` con los valores correctos.
  * `eventos_auditoria` rechaza `UPDATE` y `DELETE`.
  * El aviso de membresía no se envía dos veces para la misma membresía y tipo.
* **Aislamiento:** un usuario de la A no ve notificaciones ni auditoría de la B.

## Criterios de aceptación

* Corregir un backlog cerrado deja una fila en auditoría con `CORRECCION`, quién lo hizo y los valores antes y después.
* El aviso de 7 días llega una sola vez.
* Un supervisor recibe la notificación cuando un trabajo llega a validación.


## Seguridad y robustez de este corte

* Correos sin datos sensibles: el texto dice que hay algo que revisar y el enlace lleva al sistema con inicio de sesión.
* Job de avisos protegido con secreto en cabecera y firma; no se ejecuta sin él.
* Auditoría de solo inserción: el rol de la aplicación no tiene permiso de UPDATE ni DELETE en `eventos_auditoria`.
* Avisos con clave única por membresía y tipo para que un reintento del job no reenvíe.
* Prueba: la auditoría no se puede alterar desde la aplicación ni con la clave de servicio de la app.

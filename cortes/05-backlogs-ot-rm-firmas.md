# Corte 5: Backlogs, OT, RM, RQ y firmas

## Resumen del corte anterior

Corte 4 entregó equipos con horómetro que solo sube, estados de movilización, equipos inactivos e importación de Excel. Ya existen los equipos sobre los que se abren los trabajos. Todavía no hay backlogs ni órdenes de trabajo.

## Estructura y arquitectura

Mismo esquema. Este es el corte más importante del dominio: la máquina de estados vive aquí.

```
src/modules/trabajos/
  domain/        backlog-estado.ts (transiciones), permisos-cierre.ts,
                 codigos.ts (formato BKL-, OT-AAAA-, RM-AAAA-, prefijo de requisición),
                 reglas-firma.ts, limite-fotos.ts
  application/   crear-backlog.ts, abrir-orden-trabajo.ts, cerrar-reporte.ts,
                 validar-trabajo.ts, devolver-trabajo.ts, reabrir-trabajo.ts,
                 crear-requisicion.ts, editar-tras-cierre.ts
  infrastructure/ backlogs-repositorio.ts, ordenes-repositorio.ts,
                  secuencias-repositorio.ts (función siguiente_codigo), firmas-storage.ts
  ui/            bandeja de trabajos, formulario de backlog, cierre de RM, validación
src/app/(app)/trabajos/          bandeja, detalle del backlog, OT, RM
supabase/migrations/             backlogs, historial, firmas, archivos, OT, RM, RQ, secuencias
```

**Front:** la bandeja y el detalle son Server Components. El formulario de backlog, el de cierre de RM y la firma son Client Components. La firma se dibuja en un canvas y se sube como archivo.

**Back:** cada transición es un caso de uso. Consulta el estado actual, aplica `backlog-estado.ts`, escribe la transición y el historial en una sola transacción.

## Alcance

**Tablas:** `backlogs`, `backlog_historial_estados`, `backlog_firmas`, `backlog_archivos`, `ordenes_trabajo`, `reportes_mantenimiento`, `requisiciones`, `archivos`, `secuencias_empresa`. Las firmas precargadas viven en `personas.firma_archivo_id`.

**Flujo:**
1. El técnico crea el backlog (`PENDIENTE`) con fotos "antes".
2. El supervisor o el planificador abre la OT (`OT-AAAA-NNN`) y asigna al técnico. El backlog pasa a `EN_PROCESO`.
3. Si hacen falta repuestos, se crea una requisición con el prefijo de la empresa.
4. El técnico llena el RM (`RM-AAAA-NNN`): fecha, horómetro, notas, fotos "después" (máximo 3), firma precargada. El backlog pasa a `PENDIENTE_VALIDACION`.
5. El supervisor aprueba (`COMPLETADO`, con su firma) o devuelve con observación obligatoria (vuelve a `EN_PROCESO`).

**Reglas:**
* Nadie valida su propio cierre. Excepción: el planificador, solo si `planificador_puede_validar = true`.
* Sin firma no se cierra.
* Sin OT no pasa a validación.
* El horómetro del RM actualiza el del equipo si es mayor (llama a la regla del corte 4).
* Reabrir un trabajo completado invalida las firmas (quedan en historial) y lo devuelve a `EN_PROCESO`.
* Editar después de cerrar: solo con autorización del supervisor; cada cambio queda en auditoría con `CORRECCION`.
* Bandeja: devueltos primero, luego criticidad, luego atraso.

**Dominio (puro, con pruebas exhaustivas):**
* `transicionar(estadoActual, evento, rol, esPropio)`: devuelve el nuevo estado o un error de dominio.
* `puedeCerrar(usuario, trabajo, empresa)`.
* `formatearCodigo(prefijo, numero, año)`.

## Pruebas

* **Unitarias (las más importantes del proyecto):**
  * Cada transición permitida y cada prohibida, para cada rol.
  * Auto-validación bloqueada, salvo planificador autorizado.
  * Cierre sin firma y sin OT rechazados.
  * Límite de 3 fotos "después".
* **Integración:**
  * `siguiente_codigo` no repite códigos con dos transacciones simultáneas.
  * `UNIQUE (backlog_id)` en OT: un backlog, una OT.
  * El trigger de historial registra cada cambio de estado.
  * Reabrir marca las firmas como no vigentes.
* **E2E (primera vez, Playwright):** técnico crea backlog → supervisor abre OT → técnico cierra RM → supervisor aprueba → queda `COMPLETADO` con historial completo.
* **Aislamiento:** la OT de la empresa A no se puede asociar a un backlog de la B.

## Criterios de aceptación

* El flujo completo funciona de principio a fin, con códigos secuenciales por empresa.
* Cada cambio de estado deja historial con quién y cuándo.
* No hay forma de cerrar sin firma ni de validar el propio cierre.
* Reabrir invalida las firmas y el historial las conserva.


## Seguridad y robustez de este corte

* Transiciones de estado en transacción con bloqueo de fila: dos cierres simultáneos no pueden aplicarse los dos.
* Cierre con clave de idempotencia: un reintento de red no duplica el cierre ni la firma.
* Firmas: solo imágenes PNG o JPG validadas por firma binaria, máximo 2 MB, almacenadas en bucket privado.
* Fotos con nombre aleatorio y URL firmada de vida corta.
* Límite de 3 fotos después validado en servidor y en base.
* Prueba de concurrencia: dos validaciones simultáneas del mismo backlog, una sola aplica.
* Prueba: cerrar un trabajo de otra empresa con su identificador es rechazado.

# Corte 12: Sin señal (Pro)

## Resumen del corte anterior

Corte 11 entregó notificaciones, avisos de membresía por correo y auditoría por trigger. El sistema funciona en línea de principio a fin y deja registro de quién cambió qué. Todavía no funciona sin conexión.

## Estructura y arquitectura

Mismo esquema. Este corte agrega una capa de sincronización que solo se activa en el plan Pro.

```
src/modules/sin-senal/
  domain/        conflictos.ts (regla de version), cola.ts (orden y reintentos)
  application/   encolar-escritura.ts, sincronizar-cola.ts, resolver-conflicto.ts, cerrar-sesion-local.ts
  infrastructure/ electric-cliente.ts (@electric-sql/client), cola-indexeddb.ts, ruta-sync.ts
  ui/            indicador de conexión, cola pendiente, lista de conflictos
src/app/api/sync/                ruta de Next.js que aplica cada escritura con las mismas validaciones
infra/electric/                  configuración del servicio ElectricSQL (Docker, Railway)
supabase/migrations/             publicación de replicación lógica para las tablas sincronizables
```

**Front:** el indicador de conexión y la cola son Client Components. Las lecturas de la base local se hacen con la sincronización de ElectricSQL, no con llamadas al servidor.

**Back:** el cliente nunca escribe directo a las tablas. Cada operación de la cola va a `/api/sync`, que llama al mismo caso de uso que la versión en línea. Así las reglas no se duplican.

**Servicio:** ElectricSQL autoalojado en Railway, conectado a Supabase Postgres por replicación lógica.

## Alcance

**Antes de empezar (obligatorio):**
* Revisar el archivo LICENSE de ElectricSQL en el repositorio oficial.
* Levantar Electric contra el Postgres de Supabase y verificar la replicación con una tabla de prueba.
* Si no conecta, este corte se replantea antes de codear.

**Qué se sincroniza:** solo tablas de operación y catálogos de la empresa. Nunca `planes`, `empresas`, `membresias`, `pagos`, `avisos_membresia`.

**Shapes por rol:** planificador y supervisor reciben todas las filas de su empresa; técnico recibe equipos, catálogos, backlogs y preventivos abiertos, y sus propias paradas y registros.

**Escrituras:**
* Solo inserción (sin conflicto): lecturas, registros de engrase, mediciones, historial, firmas, eventos de neumático, archivos. UUID generado en el dispositivo.
* Editables con versión: backlogs, preventivos, paradas, horómetro, estado de neumático. La escritura lleva la `version` que tenía al descargarse. El servidor aplica `WHERE id = :id AND version = :version`.

**Conflictos:** si la versión no coincide, la operación se rechaza y aparece en la lista de conflictos. Nunca se pierde en silencio.

**Códigos visibles:** el servidor los asigna al sincronizar. Offline se muestra un texto temporal que se reemplaza al confirmar.

**Archivos sin señal:** fotos y firmas se guardan en el dispositivo, se suben a Storage al haber señal, y luego se crea la fila en `archivos` y su enlace.

**Cierre de sesión:** borra la base local y la cola. Si quedan operaciones sin enviar, se advierte antes.

**Dominio (puro, con pruebas):**
* `puedeAplicarse(escritura, versionActual)`.
* `ordenarCola(operaciones)`: en orden de creación por entidad.
* `reintentar(intento)`: espera creciente con límite.

## Pruebas

* **Unitarias:** regla de versión; orden de la cola; política de reintentos.
* **Integración:**
  * Dos escrituras sobre la misma `version`: una se aplica y la otra se rechaza.
  * Una inserción offline con UUID generado en el cliente no choca con otra.
  * El shape del técnico no incluye paradas de otros técnicos.
* **E2E sin red (Playwright con red desconectada):**
  * Crear un backlog sin conexión, reconectar, verificar una sola sincronización.
  * Cerrar sesión con operaciones pendientes muestra la advertencia.
* **Aislamiento:** el shape de la empresa A nunca incluye filas de la B.

## Criterios de aceptación

* La cola se vacía al volver la señal, sin duplicar nada.
* Un conflicto se muestra al usuario y no se pierde.
* Cerrar sesión borra los datos locales de la empresa.
* El plan Estándar no expone esta funcionalidad.


## Seguridad y robustez de este corte

* Ruta `/api/sync` autenticada, con límite de tamaño por lote y límite de frecuencia por usuario.
* Protección contra repetición: cada operación lleva identificador y clave de idempotencia; reenviar no duplica.
* Datos locales cifrados en el dispositivo cuando sea posible, sin `localStorage` para datos de negocio, y borrados al cerrar sesión.
* Servicio ElectricSQL en Railway con red privada hacia la base, secretos en variables de Railway, sin puerto público innecesario.
* Shapes filtrados por empresa en el servidor; el cliente no puede pedir otra empresa cambiando el identificador.
* Prueba: una operación de la cola con versión vieja o de otra empresa es rechazada y registrada.
* Prueba de caída: si el servicio de sincronización se cae, la app sigue trabajando en local y no pierde la cola.

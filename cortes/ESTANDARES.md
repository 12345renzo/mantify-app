# Estándares de seguridad, robustez y calidad

Aplican a todos los cortes. Cada corte agrega al final su sección "Seguridad y robustez de este corte" con lo específico de ese corte.

## 1. Inyección y entrada de datos

* **SQL:** solo consultas parametrizadas (cliente de Supabase o funciones con parámetros). Prohibido concatenar texto en SQL. Una regla de revisión lo bloquea en CI.
* **Validación:** todo dato que entra (formularios, server actions, rutas, Excel, CSV, JSON de sincronización) pasa por un esquema Zod con tipos, longitudes, rangos y formatos. Se valida en el servidor aunque el cliente ya lo haya validado.
* **Asignación masiva:** los esquemas solo aceptan campos permitidos. Nunca se pasa el cuerpo de la petición tal cual a la base.
* **Salida:** React escapa por defecto. Prohibido `dangerouslySetInnerHTML` sin revisión. Los textos de usuario en PDF y correo se escapan.
* **Inyección de fórmulas en Excel/CSV:** cualquier celda que empiece con `=`, `+`, `-` o `@` se neutraliza antes de exportar o al leer.

## 2. Autenticación

* Supabase Auth con sesiones en cookies `httpOnly`, `secure` y `sameSite=lax` (vía `@supabase/ssr`).
* Contraseñas: mínimo 12 caracteres. Claves aleatorias generadas por el sistema, de un solo uso, que se cambian al primer ingreso.
* Sin MFA por decisión del proyecto. Compensan: límite de intentos, rol firmado en el JWT y RLS en todas las tablas.
* Límite de intentos de inicio de sesión y bloqueo temporal tras varios fallos.
* Mensajes de error genéricos: nunca revelan si un correo o RUC existe, salvo en el alta, donde se avisa del duplicado de forma controlada.
* Revocar sesiones al dar de baja a una persona o desactivar una empresa.

## 3. Autorización

* **Denegar por defecto:** toda tabla tiene RLS activa y sin política no hay acceso.
* **Doble barrera:** la app verifica el permiso en el caso de uso, y la base lo verifica con RLS. Ninguna sola basta.
* **Roles en el servidor:** el rol se lee de la base o de `app_metadata` firmado, nunca de datos que envía el cliente.
* **Clave de servicio** de Supabase solo en el servidor, nunca en el navegador ni en logs.
* **Pruebas de autorización** en cada corte: intentos directos de leer y escribir con cada rol y con otra empresa.

## 4. Seguridad web

* Cabeceras por `next.config`: `Content-Security-Policy`, `Strict-Transport-Security`, `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`.
* Protección CSRF: las server actions de Next validan el origen; las rutas que cambian estado exigen método `POST` y verificación de origen.
* Páginas con datos sensibles: `Cache-Control: no-store`.
* Dependencias: lockfile versionado, `npm audit` en CI bloquea vulnerabilidades altas, Dependabot activo.
* Secretos: variables de entorno validadas al arrancar con Zod. `.env` fuera del repositorio.

## 5. Archivos (fotos y firmas)

* Validar tipo real por firma binaria (no por extensión), tamaño máximo de 2 MB y dimensiones razonables.
* Nombres aleatorios; nunca el nombre original del usuario en la ruta.
* Bucket privado. Descarga por URL firmada de vida corta (minutos).
* Eliminación lógica con registro en auditoría.

## 6. Robustez y disponibilidad

* **Transacciones** en cada operación de varios pasos (cierre de RM, alta de empresa, pago). Si un paso falla, se revierte todo.
* **Bloqueo de fila** (`SELECT ... FOR UPDATE`) en transiciones de estado para evitar carreras (dos personas cerrando lo mismo).
* **Idempotencia:** cada escritura que puede repetirse (webhook, sincronización, reintento) lleva una clave de idempotencia.
* **Límites:** tamaño de archivo, número de filas de importación, rango de fechas en reportes y en analítica. Evita que una consulta tumbe el servicio.
* **Tiempos de espera** en llamadas externas, con reintentos y espera creciente.
* **Límites de frecuencia** en login, alta pública, importaciones y endpoints de sincronización.
* **Manejo de errores:** `DomainError` con código para el usuario; errores inesperados se registran y muestran un mensaje genérico, sin pila ni detalles de la base.
* **Límites de error en la interfaz:** `error.tsx` por ruta para que una falla no tumbe toda la app.
* **Comprobaciones de salud** (`/api/health`) que verifican base y servicios.
* **Respaldos:** automáticos en Pro; en Free, respaldo manual por empresa (botón del superadmin). Probar restauración antes del lanzamiento.

## 7. Datos personales

* Solo se guardan los datos necesarios. Nada de tarjetas ni claves de pasarela.
* Los datos de personas (nombre, documento, correo, teléfono) tienen acceso restringido por rol.
* Los registros de auditoría no contienen contraseñas ni claves.
* Plazo de retención y procedimiento para eliminar datos de una persona o empresa: se define en el corte 14 con asesoría legal. En Perú aplica la Ley 29733 de protección de datos personales; confirmar con un abogado.

## 8. Logs y observabilidad

* Logs estructurados con identificador de petición y de empresa, sin datos personales ni secretos.
* Alertas para: errores 500 repetidos, intentos de acceso denegados en serie, picos de login fallido, cola de sincronización creciendo.

## 9. Calidad de código (nivel senior)

* TypeScript estricto. Sin `any` sin justificación comentada.
* Dominio sin dependencias de framework ni de base. Casos de uso con interfaces, no con clientes concretos.
* Funciones pequeñas y con un solo propósito. Un archivo por concepto.
* Errores tipados. Nada de `catch` vacíos.
* Revisión de código obligatoria antes de integrar. Cada cambio de decisión importante queda en un registro corto (ADR).
* Pruebas primero para la lógica nueva. Cobertura mínima en dominio y casos de uso (la que se fije en el corte 0).
* Un corte no se integra si incumple cualquiera de estos puntos.

## 10. Antes del lanzamiento

* Prueba de penetración externa o revisión de seguridad por un tercero.
* Escaneo de dependencias y de configuración sin hallazgos altos.
* Prueba de restauración de respaldo.
* Plan de respuesta a incidentes escrito: quién avisa, a quién, en cuántas horas.

## 11. Datos en el front y caché (decisión)

* **Lecturas en cliente:** TanStack Query en todo el proyecto, no solo en el plan Pro. Claves siempre con la empresa: `['backlogs', empresaId, filtros]`.
* **Carga inicial:** Server Components leen y pasan los datos con `HydrationBoundary`, para no mostrar pantallas vacías.
* **Escrituras:** server actions que validan, llaman al caso de uso y devuelven un resultado tipado. Después se invalidan las claves de TanStack Query afectadas y se llama a `revalidateTag` o `revalidatePath` en el servidor.
* **Limpieza de caché:** la caché del navegador se borra al cerrar sesión y al cambiar de empresa. Ningún dato de una empresa queda disponible para otra.
* **Sin caché compartida para datos sensibles:** respaldos y reportes del superadmin no usan caché del servidor.

## 12. Guardia obligatoria en cada server action y route handler

Ninguna acción ni ruta escribe código propio de validación. Todas pasan por un único pipeline, `defineAction` (o `defineRoute` para route handlers), que ejecuta estos pasos en orden y se detiene al primer fallo:

1. **Origen:** en route handlers que cambian estado, se verifica el encabezado `Origin` contra la lista permitida. Método `POST` obligatorio.
2. **Límite de frecuencia:** por usuario y por IP, antes de tocar la base.
3. **Autenticación:** `supabase.auth.getUser()` valida el token con el servidor de Supabase. Prohibido usar `getSession()` para decidir acceso, porque no valida la firma.
4. **Cuenta activa:** el usuario existe en `usuarios`, está `ACTIVO`, y su empresa pasa `empresa_activa()`. El superadmin se verifica por su rol en `app_metadata`.
5. **Pertenencia:** la empresa y el rol se leen de la base por el id del usuario. Nunca se aceptan `empresa_id` ni `rol` enviados por el cliente. Si el recurso pertenece a otra empresa, se responde como si no existiera.
6. **Permiso:** `puede(rol, accion, recurso)` del dominio. Acciones sensibles exigen además `planificador_puede_validar` cuando aplique.
7. **Validación de entrada:** esquema Zod en modo estricto (`.strict()`), con longitudes máximas, rangos y formatos. Campos desconocidos se rechazan.
8. **Idempotencia:** en escrituras repetibles, la clave se revisa antes de ejecutar.
9. **Caso de uso:** la lógica de negocio, dentro de una transacción cuando hay varios pasos.
10. **Auditoría:** la acción queda registrada con usuario, empresa, acción, resultado y hora. Nunca se registran contraseñas, tokens ni datos personales completos.
11. **Respuesta:** resultado tipado. Los errores se traducen a códigos. Ningún mensaje de la base ni pila de error llega al cliente.

**Lo que se prueba en cada acción** (son pruebas obligatorias para integrar):

* Sin sesión: rechazada.
* Token inválido o vencido: rechazado.
* Rol sin permiso: rechazado.
* Recurso de otra empresa: rechazado como "no encontrado".
* Empresa inactiva: rechazada.
* Campo extra o valor fuera de rango: rechazado.
* Reintento con la misma clave: no duplica.
* Exceso de frecuencia: rechazado.

**Verificación automática:** una prueba recorre todas las acciones y rutas exportadas y falla si alguna no usa `defineAction` o `defineRoute`. Así no se puede olvidar la guardia.

**Claves:** la clave de servicio de Supabase no entra nunca a una acción de usuario. Solo los jobs la usan, dentro de su propia ruta protegida con secreto.

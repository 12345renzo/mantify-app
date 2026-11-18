# Corte 14: Parte legal y cobro

## Resumen del corte anterior

Corte 13 entregó los indicadores Pro: disponibilidad, MTTR, MTBF, Pareto, turnos, demora por repuestos, fecha sugerida y plan de acción, cada uno con pruebas numéricas y bloqueo por plan. El producto funciona completo, salvo lo legal y el cobro formal.

## Estructura y arquitectura

Mismo esquema. Este corte no tiene código de negocio nuevo; agrega documentos, textos y, si hace falta, un módulo de comprobantes.

```
src/modules/legal/
  domain/        (sin lógica nueva salvo lo que defina el contador)
  application/   (según el proveedor de comprobantes elegido)
  ui/            términos, política de datos, pie de página legal
src/app/(legal)/terminos/
src/app/(legal)/privacidad/
```

**Front:** páginas estáticas de términos y privacidad.

**Back:** solo si se emiten comprobantes desde la plataforma. Si se emiten por fuera, este corte no toca el código.

## Alcance

**No se empieza hasta cerrar los cortes 0 a 13.**

**Antes de codear, con un contador (y un abogado si hace falta):**
* Cómo emitir factura electrónica ante SUNAT: si la emite Mantify con un sistema autorizado, o un proveedor externo.
* Si la firma precargada tiene validez para los documentos de cada empresa.
* Términos y condiciones: alcance del servicio, cobro, reembolsos (sin devolución por días no usados, previa verificación), baja de cuentas por falta de pago.
* Política de datos personales: qué datos de personas se guardan, dónde, por cuánto tiempo, y quién puede pedir su eliminación.
* Respaldo y retención: cuántos días se conservan los datos después de dar de baja una empresa.

**Cobro:** los pagos siguen siendo manuales (transferencia registrada por el superadmin). Si cambia, se abre un corte nuevo, no se mete aquí.

**Moneda:** definir si el cobro manual es en USD o PEN (pendiente en el documento).

## Pruebas

* **Legales:** revisión del texto final por el contador o abogado antes de publicarlo.
* **Técnicas:** los enlaces de términos y privacidad aparecen en el pie y en el registro de empresa.
* **Comprobantes (si se emiten desde la app):** pruebas con el ambiente de pruebas del proveedor, nunca con documentos reales.

## Criterios de aceptación

* Los términos y la política de privacidad están publicados y enlazados.
* El contador confirmó por escrito cómo se emiten los comprobantes.
* Ninguna empresa cobra antes de cerrar este corte.


## Seguridad y robustez de este corte

* Política de datos personales alineada con la Ley 29733 (revisión con abogado).
* Procedimiento escrito para solicitudes de acceso, rectificación y eliminación de datos.
* Respaldos cifrados y con plazo de retención definido.
* Plan de respuesta a incidentes firmado: quién avisa, a quién y en cuántas horas.
* Revisión final de seguridad y prueba de penetración antes de cobrar a la primera empresa (ver ESTANDARES.md, sección 10).

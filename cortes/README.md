# Cortes de implementación

Plan para construir Mantify por partes. Base: `../propuesta_saas_completa_v2.md`.

Estándares de seguridad, robustez y calidad que aplican a todos los cortes: [ESTANDARES.md](ESTANDARES.md).

Cada corte empieza con el resumen del anterior, la estructura de carpetas, el alcance, las pruebas y los criterios de aceptación. No se empieza un corte si el anterior no cumple sus criterios.

## Índice

| # | Corte | Qué entrega |
| - | ----- | ----- |
| 0 | [Base del proyecto](00-base.md) | Next.js, capas, Supabase local, CI, pruebas |
| 1 | [Plataforma y membresía](01-plataforma-empresas-membresia.md) | Empresas con RUC, membresías, pagos manuales |
| 2 | [Personas, usuarios y roles](02-personas-usuarios-roles.md) | Personal, cuentas, permisos por rol |
| 3 | [Catálogos](03-catalogos.md) | Listas editables por empresa con seeds |
| 4 | [Equipos y horómetro](04-equipos-horometro.md) | Flota, horómetro que solo sube, importación |
| 5 | [Backlogs, OT, RM, RQ y firmas](05-backlogs-ot-rm-firmas.md) | Flujo correctivo completo |
| 6 | [Preventivos](06-preventivos.md) | Programación, alerta, ejecución, terceros |
| 7 | [Paradas, reportes e importación](07-paradas-reportes.md) | Paradas, reporte diario, ranking |
| 8 | [Engrase](08-engrase.md) | Estados por equipo y umbral configurable |
| 9 | [Neumáticos](09-neumaticos.md) | Cubiertas, montajes, mediciones, salud |
| 10 | [Dashboard y exportaciones](10-dashboard-exportaciones.md) | Panel por rol, bandeja, PDF, Excel, JSON, respaldo |
| 11 | [Notificaciones y auditoría](11-notificaciones-auditoria.md) | Avisos, auditoría por trigger |
| 12 | [Sin señal (Pro)](12-sin-senal-pro.md) | ElectricSQL, cola offline, conflictos |
| 13 | [Pro analítico](13-pro-analitico.md) | MTTR, MTBF, Pareto, turnos, plan de acción |
| 14 | [Parte legal y cobro](14-legal-cobro.md) | Términos, privacidad, comprobantes (al final) |

## Hitos

* **Hito 1 (cortes 0 a 5):** una empresa lleva equipos, backlogs y OT.
* **Hito 2 (cortes 6 a 11):** la operación completa en línea, con dashboard y exportaciones.
* **Hito 3 (cortes 12 y 13):** plan Pro.
* **Hito 4 (corte 14):** lanzamiento a empresas que paguen.

## Stack

Todo en Next.js + TypeScript. Supabase para auth, base y archivos. ElectricSQL en Railway solo para el plan Pro.

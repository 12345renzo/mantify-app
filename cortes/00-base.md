# Corte 0: Base del proyecto

## Resumen del corte anterior

Punto de partida. No hay cortes anteriores. El código actual (`app.js`, HTML y JavaScript puro, con Firebase) no se reutiliza como base: se empieza un proyecto nuevo en Next.js + TypeScript. La app actual sirve como referencia de reglas y pantallas.

## Estructura y arquitectura

Todo el proyecto es Next.js (front y back juntos).

**Front**
* App Router. Las páginas y listados son Server Components que leen con casos de uso.
* Los formularios y la interacción son Client Components, solo donde hagan falta.
* UI con Tailwind CSS (decisión de este corte).

**Back**
* Server Actions y Route Handlers son una capa fina: validan con Zod y llaman a un caso de uso.
* Los casos de uso viven en `application/` y no conocen Next.js ni Supabase directamente.
* Las consultas y escrituras viven en `infrastructure/` (Supabase).

**Capas por módulo**

```
src/
  app/                  rutas Next.js (App Router), server actions
  modules/<modulo>/
    domain/             reglas puras, sin imports de Next ni Supabase
    application/       casos de uso, permisos, repositorios (interfaces)
    infrastructure/     implementación de repositorios con Supabase
    ui/                 componentes del módulo
  shared/
    kernel/             DomainError, Result, tipos comunes
    validation/         esquemas Zod reutilizables
    supabase/           clientes de servidor y de navegador (@supabase/ssr)
supabase/
  migrations/           una migración por corte
  seed/
tests/
  unit/                 domain y application con repositorios falsos
  integration/          Supabase local: constraints, RLS, funciones
  e2e/                  Playwright (desde el corte 5)
```

**Reglas del corte 0**
* Lógica de negocio solo en `domain/` y `application/`.
* Validación con Zod en el borde y de nuevo en el servidor.
* Migraciones inmutables.
* TypeScript estricto. Sin `any` sin comentario.
* Errores de dominio con tipo propio (`DomainError` con código). Nunca mensajes de la base al usuario.

## Alcance

* Proyecto Next.js + TypeScript con la estructura de arriba.
* TanStack Query para lecturas en cliente, en todo el proyecto (regla en `ESTANDARES.md`, sección 11).
* Server actions para escrituras, con validación Zod y resultado tipado.
* ESLint, Prettier y TypeScript estricto.
* Vitest para unitarias e integración. Playwright instalado, sin pruebas todavía.
* Supabase CLI: base local con migraciones vacías.
* Zod instalado.
* CI que corre lint, tipos, pruebas y migraciones en cada cambio.

## Criterios de aceptación

* `npm run lint`, `npm run typecheck` y `npm test` pasan en un proyecto vacío.
* `supabase start` levanta la base local y las migraciones corren sin error.
* CI corre todo en cada push.
* La estructura de carpetas coincide con la de arriba.


## Seguridad y robustez de este corte

* Cabeceras de seguridad y CSP base en `next.config`.
* Validación de variables de entorno al arrancar (Zod). El proyecto no arranca si falta una variable.
* CI con lint de seguridad, `npm audit` (bloquea altos) y regla que prohíbe SQL concatenado.
* Lockfile versionado y Dependabot activo.

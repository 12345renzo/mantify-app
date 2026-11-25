# Graph Report - mantify-app  (2026-11-25)

## Corpus Check
- 246 files · ~129,150 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 6 file(s) not represented in the graph (top: (none) 4, .ico 1, .css 1)

## Summary
- 1641 nodes · 5938 edges · 77 communities (72 shown, 5 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 106 edges (avg confidence: 0.83)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4347e2d1`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Navegacion e iconos
- Fechas y empresas
- Componentes UI y modales
- trabajos/page.tsx
- contexto
- Sesion y paginas protegidas
- Casos de uso de plataforma
- Result
- Estados y permisos de trabajos
- paradas/application/repositorios.ts
- modales-trabajo.tsx
- Layout, perfil y clave
- Acciones de trabajos
- paradas/page.tsx
- Catalogos
- Dependencias de desarrollo
- server.ts
- Variables de entorno
- UI modales de mantenimiento (2)
- equipos/application/esquemas.ts
- equipos/application/casos-uso.ts
- Importacion de equipos Excel
- aDomainError
- Repositorio de preventivos (2)
- Firmas y fotos
- Importacion y duracion de paradas
- Tipos de base de datos
- ok
- Configuracion TypeScript
- modales-preventivo.tsx
- engrase/application/casos-uso.ts
- Login
- Exportacion PDF
- Cortes 07 a 11
- Roadmap y cortes Pro
- sesion.ts
- Detalle de preventivo
- Casos de uso de preventivos
- Esquemas de preventivos
- fechas.ts
- trabajos/application/esquemas.ts
- Flujo correctivo (docs)
- Acciones de equipos (2)
- Casos de uso de preventivos (2)
- Membresia (docs)
- Pantalla de personal
- Catalogos (2)
- Errores de dominio y personal (2)
- modales-parada.tsx
- trabajos/[id]/page.tsx
- Estandares y base (docs)
- Catalogos y equipos (docs)
- Dependencias de produccion
- engrase/page.tsx
- trabajos-repositorio.ts
- Providers de la app
- Scripts npm
- Spec: Mantify — Corte 8: Engrase — V1
- Preventivos y paradas (docs)
- Pruebas E2E de trabajos
- Reportes de paradas
- Pruebas E2E de paradas
- Pruebas E2E de paradas (2)
- plataforma/application/consultas.ts
- Lector de trabajos
- Sesion y paginas protegidas (2)
- AGENTS.md
- paradas.test.ts
- README
- Config MCP
- Tareas: Corte 8 — Engrase
- engrase-repositorio.ts
- paradas/domain/duracion.ts
- diario/route.ts
- engrase/actions.ts
- Plan de implementación: Corte 8 — Engrase

## God Nodes (most connected - your core abstractions)
1. `ok()` - 109 edges
2. `err()` - 107 edges
3. `DomainError` - 106 edges
4. `Result` - 99 edges
5. `obtenerActor` - 65 edges
6. `exigirPermiso()` - 56 edges
7. `react` - 52 edges
8. `Modal()` - 52 edges
9. `next` - 47 edges
10. `empresaDeTrabajo()` - 44 edges

## Surprising Connections (you probably didn't know these)
- `7. Estilo de código` --references--> `mensajeError()`  [INFERRED]
  SPEC.md → src/app/(app)/mensajes.ts
- `2. Lo que ya existe (cortes 1 a 7)` --references--> `parsearHorometro()`  [INFERRED]
  SPEC.md → src/modules/equipos/domain/horometro.ts
- `7. Estilo de código` --references--> `exigirPermiso()`  [INFERRED]
  SPEC.md → src/modules/identidad/application/acceso.ts
- `7. Estilo de código` --references--> `DomainError`  [INFERRED]
  SPEC.md → src/shared/kernel/errors.ts
- `2. Lo que ya existe (cortes 1 a 7)` --references--> `diasEntre()`  [INFERRED]
  SPEC.md → src/shared/kernel/fechas.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Ciclo correctivo** — cortes_05_backlogs_ot_rm_firmas_flujo_correctivo, cortes_05_backlogs_ot_rm_firmas_maquina_estados, cortes_05_backlogs_ot_rm_firmas_firmas [EXTRACTED 1.00]
- **Flujo sin senal Pro** — cortes_12_sin_senal_pro_electricsql, cortes_12_sin_senal_pro_conflictos_version, cortes_12_sin_senal_pro_cola_offline [EXTRACTED 1.00]

## Communities (77 total, 5 thin omitted)

### Community 0 - "Navegacion e iconos"
Cohesion: 0.07
Nodes (53): AppShell(), MenuConRuta(), MenuModulos(), SENAL, ShellContexto, Ubicacion(), buscarSeccion(), GrupoNav (+45 more)

### Community 1 - "Fechas y empresas"
Cohesion: 0.09
Nodes (37): AccionesFila(), FormBaja(), FormEditar(), FormRenovar(), Pie(), CAMPOS_EMPRESA, crearEmpresaAction(), darDeBajaAction() (+29 more)

### Community 2 - "Componentes UI y modales"
Cohesion: 0.10
Nodes (35): react, Cifra(), COLUMNAS, FormImportar(), ModalImportar(), EstadoIdentidad, FormularioPersona(), ModalPersona() (+27 more)

### Community 3 - "trabajos/page.tsx"
Cohesion: 0.08
Nodes (50): CatalogosPage(), Contenido(), metadata, EmpresasPage(), metadata, TablaEmpresas(), Encabezado(), Dato() (+42 more)

### Community 4 - "contexto"
Cohesion: 0.46
Nodes (8): abrirOrdenTrabajo(), contexto(), crearRequisicion(), editarBacklog(), noEncontrado(), reabrirTrabajo(), validarTrabajo(), transicionar()

### Community 5 - "Sesion y paginas protegidas"
Cohesion: 0.15
Nodes (24): next, BotonNuevaEmpresa(), BotonNuevaEmpresaCargando(), Modulos(), NAVEGACION, veItem(), ESTADOS_RESUMEN, LEYENDA (+16 more)

### Community 6 - "Casos de uso de plataforma"
Cohesion: 0.15
Nodes (28): unaFila(), cambiarClave(), reactivarPersona(), cambiarPrecioPlan(), crearEmpresa(), darDeBajaEmpresa(), editarEmpresa(), renovarEmpresa() (+20 more)

### Community 7 - "Result"
Cohesion: 0.09
Nodes (21): 7. Estilo de código, resolverPersonaParaCuenta(), crearUsuario(), CuentaCreada, PersonaEntrada, reemplazarPersona(), CuentaInfo, CuentasRepositorio (+13 more)

### Community 8 - "Estados y permisos de trabajos"
Cohesion: 0.11
Nodes (19): puedeValidar(), verTrabajo(), crearBacklogSchema, validarSchema, ContextoTransicion, CRITICIDADES, ESTADOS_BACKLOG, EventoBacklog (+11 more)

### Community 9 - "paradas/application/repositorios.ts"
Cohesion: 0.11
Nodes (17): DatosCierre, DatosInicio, EstadoParada, FiltroReporte, LectorParadas, OpcionesParada, Parada, ParadasRepositorio (+9 more)

### Community 10 - "modales-trabajo.tsx"
Cohesion: 0.13
Nodes (34): BotonActivo(), CampoFormulario(), FormActivo(), FormElemento(), ModalElemento(), OpcionCategoria, BotonMovilizacion(), FormEquipo() (+26 more)

### Community 11 - "Layout, perfil y clave"
Cohesion: 0.17
Nodes (17): EstadoClave, AvisoClave(), CAMPOS, FormularioClave(), ModalClave(), MenuPerfil(), EstadoTrabajo, FormFirma() (+9 more)

### Community 12 - "Acciones de trabajos"
Cohesion: 0.30
Nodes (19): abrirOtAction(), CAMPOS_BACKLOG, cerrarReporteAction(), crearBacklogAction(), editarBacklogAction(), errorTrabajo(), estadoRequisicionAction(), fotosDe() (+11 more)

### Community 13 - "paradas/page.tsx"
Cohesion: 0.16
Nodes (22): ErrorPanel(), Dato(), Detalle(), hora(), metadata, nf, ParadaPage(), Abiertas() (+14 more)

### Community 14 - "Catalogos"
Cohesion: 0.12
Nodes (24): cambiarActivoAction(), EstadoCatalogo, guardarElementoAction(), primerError(), valoresDe(), CambiarActivoEntrada, cambiarActivoSchema, catalogoSchema (+16 more)

### Community 15 - "Dependencias de desarrollo"
Cohesion: 0.10
Nodes (26): eslintConfig, devDependencies, eslint@^9, eslint-config-next@16.4.6, eslint-config-prettier@^10.1.8, prettier@^3.10.1, tailwindcss@4.3.3, @tailwindcss/turbopack@4.3.3 (+18 more)

### Community 16 - "server.ts"
Cohesion: 0.31
Nodes (9): server-only, reposPreventivos(), crearLectorPreventivos(), crearPreventivosRepositorio(), columnas(), crearLectorTrabajos(), crearTrabajosRepositorio(), createSupabaseServerClient() (+1 more)

### Community 17 - "Variables de entorno"
Cohesion: 0.14
Nodes (17): @supabase/ssr@^0.12.7, @supabase/ssr, @supabase/supabase-js, register(), crearServicioAuth(), errorAuth(), config, PROTEGIDAS (+9 more)

### Community 18 - "UI modales de mantenimiento (2)"
Cohesion: 0.19
Nodes (17): backlogHallazgoAction(), cerrarAction(), errorParada(), EstadoImportacion, EstadoParada, fotosDe(), iniciarAction(), MENSAJES (+9 more)

### Community 19 - "equipos/application/esquemas.ts"
Cohesion: 0.17
Nodes (10): campos, CrearEquipoEntrada, crearEquipoSchema, EditarEquipoEntrada, editarEquipoSchema, idOpcional, LecturaEntrada, lecturaSchema (+2 more)

### Community 20 - "equipos/application/casos-uso.ts"
Cohesion: 0.09
Nodes (22): cambiarMovilizacion(), crearEquipo(), editarEquipo(), registrarLectura(), DatosEquipo, EquipoDetalle, EquipoFila, EquipoParaLectura (+14 more)

### Community 21 - "Importacion de equipos Excel"
Cohesion: 0.14
Nodes (23): fflate, importarEquipos(), MOTIVO_BASE, LectorExcel, normalizarCodigo(), ALIAS, Campo, Catalogos (+15 more)

### Community 22 - "aDomainError"
Cohesion: 0.12
Nodes (17): CuentaFila, LectorIdentidad, MiPerfil, PersonaFila, Personal, Cupo, MotivoSinAcceso, nombreCompleto() (+9 more)

### Community 23 - "Repositorio de preventivos (2)"
Cohesion: 0.10
Nodes (19): DatosEjecucion, DatosProgramacion, LectorPreventivos, PreventivoDetalle, PreventivoFila, PreventivosRepositorio, ResultadoImportacion, Resultado (+11 more)

### Community 24 - "Firmas y fotos"
Cohesion: 0.18
Nodes (19): cerrarReporte(), crearBacklog(), guardarMiFirma(), Repos, revisarImagenes(), subirTodas(), VistaTrabajo, ascii() (+11 more)

### Community 25 - "Importacion y duracion de paradas"
Cohesion: 0.26
Nodes (11): HOROMETRO_MAX, ALIAS, Campo, clave(), ErrorFila, fechaHora(), horometro(), OBLIGATORIAS (+3 more)

### Community 26 - "Tipos de base de datos"
Cohesion: 0.18
Nodes (10): CompositeTypes, Constants, Database, DatabaseWithoutInternals, DefaultSchema, Enums, Json, Tables (+2 more)

### Community 27 - "ok"
Cohesion: 0.14
Nodes (37): cambiarActivoElemento(), guardarElemento(), listarCatalogo(), listarEquipos(), verEquipo(), empresaDeTrabajo(), exigirPermiso(), cambiarRolCuenta() (+29 more)

### Community 28 - "Configuracion TypeScript"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 29 - "modales-preventivo.tsx"
Cohesion: 0.24
Nodes (15): backlogObservacionAction(), ejecutarAction(), errorPreventivo(), primerError(), programarAction(), reprogramarAction(), terminar(), validarPreventivoAction() (+7 more)

### Community 30 - "engrase/application/casos-uso.ts"
Cohesion: 0.08
Nodes (40): armarFilas(), configurarAvisoEngrase(), contexto(), guardarPlanEngrase(), invalido(), listarEngrase(), registrarEngrase(), verEngrase() (+32 more)

### Community 31 - "Login"
Cohesion: 0.22
Nodes (12): cerrarSesion(), iniciarSesion(), ResultadoLogin, BotonIngresar(), ERRORES_URL, LoginForm(), enviar(), loginSchema (+4 more)

### Community 32 - "Exportacion PDF"
Cohesion: 0.18
Nodes (15): COLUMNAS_DIARIO, filaDiario(), hora(), nf, pdfDiario(), aWinAnsi(), ColumnaPdf, crearPdf() (+7 more)

### Community 33 - "Cortes 07 a 11"
Cohesion: 0.17
Nodes (12): UNIQUE (empresa_id, id_importacion) para importar sin duplicar, Ranking de fallas por paradas no planificadas, Reportes diario (PDF) y mensual (Excel), Umbral por vencer configurable (porcentaje, horas o dias), Indices unicos parciales garantizan una cubierta por posicion, Neumaticos: montaje, medicion, rotacion, recapado, Salud de cubierta: cambiar, alerta, medir, OK, Dashboard por rol con vistas de base (+4 more)

### Community 34 - "Roadmap y cortes Pro"
Cohesion: 0.17
Nodes (13): Cola offline y /api/sync con idempotencia, ElectricSQL en Railway, replicacion logica con Supabase, Revisar LICENSE de ElectricSQL antes de empezar, Formulas en domain, no en SQL, Verificacion de plan Pro en el servidor, Cobro manual por transferencia; sin cobro antes de cerrar el corte, Terminos, privacidad y comprobantes SUNAT, Ley 29733 de proteccion de datos personales (+5 more)

### Community 35 - "sesion.ts"
Cohesion: 0.11
Nodes (36): MenuCargando(), CuentasEmpresa(), Contenido(), InicioPage(), metadata, AppLayout(), AvisoClaveServidor(), MenuDelUsuario() (+28 more)

### Community 36 - "Detalle de preventivo"
Cohesion: 0.20
Nodes (13): Dato(), Detalle(), horas(), metadata, nf, Seccion(), ActividadEjecutada, MIN_OBSERVACION (+5 more)

### Community 37 - "Casos de uso de preventivos"
Cohesion: 0.24
Nodes (16): contexto(), ejecutarPreventivo(), generarBacklogDesdeObservacion(), MOTIVO_BASE, noEncontrado(), programarPreventivo(), reprogramarPreventivo(), validarPreventivo() (+8 more)

### Community 38 - "Esquemas de preventivos"
Cohesion: 0.11
Nodes (20): CAMPOS_PROGRAMAR, EstadoImportacion, EstadoPreventivo, json(), MENSAJES, MENSAJES_ARCHIVO, ResumenImportacion, BacklogObservacionEntrada (+12 more)

### Community 39 - "fechas.ts"
Cohesion: 0.16
Nodes (16): importarPreventivos(), ALIAS, Campo, clave(), ErrorFila, fecha(), leerCsv(), LIMITES_CSV (+8 more)

### Community 40 - "trabajos/application/esquemas.ts"
Cohesion: 0.07
Nodes (37): zod, avisoSchema, cadaDias, cadaHoras, MAX_PUNTOS, planSchema, registroSchema, vacioANulo (+29 more)

### Community 41 - "Flujo correctivo (docs)"
Cohesion: 0.14
Nodes (14): Nadie valida su propio cierre, salvo planificador autorizado, Codigos secuenciales BKL-, OT-AAAA-, RM-AAAA- (siguiente_codigo), Firmas: sin firma no se cierra; reabrir las invalida, Flujo correctivo: backlog, OT, RM, validacion, Cierre con clave de idempotencia y bloqueo de fila, Maquina de estados transicionar(estado, evento, rol, esPropio), Requisicion (RQ) con prefijo de empresa, Actividad OBSERVADO genera backlog origen PREVENTIVO (+6 more)

### Community 42 - "Acciones de equipos (2)"
Cohesion: 0.18
Nodes (19): CAMPOS, crearEquipoAction(), editarEquipoAction(), errorEquipo(), EstadoEquipo, EstadoImportacion, importarAction(), lecturaAction() (+11 more)

### Community 43 - "Casos de uso de preventivos (2)"
Cohesion: 0.18
Nodes (12): duracionHoras(), HORA, minutos(), DIAS_ALERTA, enAlerta(), estaVencido(), horometroEnAlerta(), MARGEN_HORAS (+4 more)

### Community 44 - "Membresia (docs)"
Cohesion: 0.16
Nodes (12): Funcion empresa_activa() usada por RLS, Bloqueo de login 3 intentos / 30 s en memoria, Membresia 30 dias con 3 de gracia y estados AL_DIA..INACTIVA, Modulo plataforma (superadmin), Pagos manuales registrados por superadmin, Validacion de RUC de 11 digitos unico, Cupo de cuentas por plan: Estandar 10, Pro 25, Matriz de permisos puede(rol, accion, recurso) (+4 more)

### Community 45 - "Pantalla de personal"
Cohesion: 0.27
Nodes (19): cambiarClaveAction(), BASE, mensajeError(), importarAction(), asignarPersonaAction(), cambiarRolAction(), CAMPOS_PERSONA, crearCuentaAction() (+11 more)

### Community 46 - "Catalogos (2)"
Cohesion: 0.16
Nodes (10): vitest, CatalogosRepositorio, Elemento, CodigoCatalogo, Valores, crearCatalogosRepositorio(), errorEn(), fakes() (+2 more)

### Community 47 - "Errores de dominio y personal (2)"
Cohesion: 0.18
Nodes (8): asignarPersonaSchema, cambiarClaveSchema, cambiarRolSchema, correo, crearCuentaSchema, darBajaSchema, personaSchema, ROLES_EMPRESA

### Community 48 - "modales-parada.tsx"
Cohesion: 0.18
Nodes (36): EJEMPLO, FormAviso(), FormPlan(), FormRegistrar(), Grasa, SelectorGrasa(), SinGrasas(), FormLectura() (+28 more)

### Community 49 - "trabajos/[id]/page.tsx"
Cohesion: 0.14
Nodes (21): Dato(), Detalle(), EmpresaPage(), metadata, Esqueleto(), EngraseEquipoPage(), EquipoPage(), PreventivoPage() (+13 more)

### Community 50 - "Estandares y base (docs)"
Cohesion: 0.22
Nodes (11): Capas por modulo: domain, application, infrastructure, ui, CI: lint, tipos, pruebas, npm audit, Dependabot, DomainError con codigo y Result, Next.js App Router + Tailwind + Vitest + Playwright + Supabase CLI, Autenticacion Supabase Auth sin MFA, Autorizacion: RLS denegar por defecto y doble barrera, Calidad de codigo senior (TS estricto, ADR), Guardia defineAction / defineRoute (pipeline de 11 pasos) (+3 more)

### Community 51 - "Catalogos y equipos (docs)"
Cohesion: 0.19
Nodes (11): Catalogos editables por empresa con seeds, categorias_equipo con tipo_medidor y nombre_flota, Regla: catalogo en uso se desactiva, no se borra, Correccion a la baja solo planificador con motivo y auditoria, Equipos: estado_operativo y estado_movilizacion, Horometro solo sube (dominio + trigger), Importacion Excel de equipos con errores por fila, Engrase: estados calculados al leer (+3 more)

### Community 52 - "Dependencias de produccion"
Cohesion: 0.18
Nodes (11): dependencies, fflate@0.8.3, lucide-react@^1.75.0, next@16.4.6, react@19.3.0, react-dom@19.3.0, server-only@^0.0.1, @supabase/supabase-js@^2.119.0 (+3 more)

### Community 53 - "engrase/page.tsx"
Cohesion: 0.19
Nodes (20): Detalle(), metadata, ModalAviso(), ModalPlan(), ModalRegistrar(), EngrasePage(), esEstado(), Lista() (+12 more)

### Community 54 - "trabajos-repositorio.ts"
Cohesion: 0.12
Nodes (12): datosBacklog, DatosBacklog, BacklogDetalle, BacklogFila, EstadoRequisicion, OpcionesTrabajo, TrabajosRepositorio, VistaBandeja (+4 more)

### Community 55 - "Providers de la app"
Cohesion: 0.24
Nodes (7): @tanstack/react-query@^5.108.0, @tanstack/react-query, geistMono, geistSans, metadata, RootLayout(), QueryProvider()

### Community 56 - "Scripts npm"
Cohesion: 0.20
Nodes (10): scripts, build, dev, format, format:check, lint, start, test (+2 more)

### Community 57 - "Spec: Mantify — Corte 8: Engrase — V1"
Cohesion: 0.11
Nodes (18): 10. Límites, 11. Diferencias con el corte 8, 12. Diferido, 13. Decisiones, 14. Construido (2026-11-25), 15. Antes de empezar, 16. Sugerencias para cortes anteriores (fuera de este corte), 1. Objetivo (+10 more)

### Community 58 - "Preventivos y paradas (docs)"
Cohesion: 0.25
Nodes (8): motivos_parada: MCI no planificado, PM1-PM4 planificados, Duracion con cruce de medianoche suma 24 h, Fechas del servidor deciden vencimiento, no el cliente, Preventivos PM1-PM4 con alerta a 7 dias, Vencido no es estado guardado: se evalua al leer, Paradas con revision al cerrar (revisarCierre), Proyeccion de desgaste (Pro, implementada aqui), Indicadores Pro: disponibilidad, MTTR, MTBF, Pareto

### Community 59 - "Pruebas E2E de trabajos"
Cohesion: 0.31
Nodes (4): firmaDesdePerfil(), registrarFirma(), jpg(), png()

### Community 60 - "Reportes de paradas"
Cohesion: 0.52
Nodes (6): Celda, columna(), crearXlsx(), hojaXml(), neutralizar(), xml()

### Community 61 - "Pruebas E2E de paradas"
Cohesion: 0.33
Nodes (4): read-excel-file@9.3.14, read-excel-file, ir(), motivo()

### Community 62 - "Pruebas E2E de paradas (2)"
Cohesion: 0.18
Nodes (5): @playwright/test@^1.65.1, @playwright/test, abrirEquipo(), fila(), ir()

### Community 63 - "plataforma/application/consultas.ts"
Cohesion: 0.16
Nodes (11): DetalleEmpresa, EmpresaResumen, LectorPlataforma, PagoRegistrado, Plan, EstadoMembresia, aPlan(), crearLectorPlataforma() (+3 more)

### Community 65 - "Sesion y paginas protegidas (2)"
Cohesion: 0.50
Nodes (3): csp, nextConfig, securityHeaders

### Community 67 - "paradas.test.ts"
Cohesion: 0.16
Nodes (9): 2. Lo que ya existe (cortes 1 a 7), CerrarEntrada, IniciarEntrada, ParadaDetalle, esPlanificado(), generaEngrase(), PLANIFICADOS, AHORA (+1 more)

### Community 71 - "Tareas: Corte 8 — Engrase"
Cohesion: 0.14
Nodes (13): Punto de control A, Punto de control B, Punto de control C, - [ ] T9. Cierre del corte (S), Tareas: Corte 8 — Engrase, - [x] T1. Dominio y permisos (M), - [x] T2. Tablas, columnas y RLS (S), - [x] T3. Lectura de estados (M) (+5 more)

### Community 72 - "engrase-repositorio.ts"
Cohesion: 0.19
Nodes (9): Medidor, TIPOS_AVISO, crearEngraseRepositorio(), crearLectorEngrase(), referencias(), lista(), mapaEquipos(), rpc() (+1 more)

### Community 73 - "paradas/domain/duracion.ts"
Cohesion: 0.24
Nodes (10): aMs(), duracionHoras(), esFechaHora(), FechaHora, FilaRanking, ParadaRanking, Advertencia, revisarParada() (+2 more)

### Community 74 - "diario/route.ts"
Cohesion: 0.27
Nodes (8): descargar(), ESTADO, GET(), GET(), Archivo, exportarDiario(), fechaUrl, mesUrl

### Community 75 - "engrase/actions.ts"
Cohesion: 0.42
Nodes (10): configurarAvisoAction(), errorEngrase(), EstadoEngraseForm, guardarPlanAction(), MENSAJES, primerError(), registrarAction(), terminar() (+2 more)

### Community 76 - "Plan de implementación: Corte 8 — Engrase"
Cohesion: 0.25
Nodes (7): Decisiones de arquitectura, Dependencias, Estado previo, Plan de implementación: Corte 8 — Engrase, Preguntas abiertas, Resumen, Riesgos

## Knowledge Gaps
- **34 isolated node(s):** `UNIQUE (empresa_id, id_importacion) para importar sin duplicar`, `Reportes diario (PDF) y mensual (Excel)`, `Umbral por vencer configurable (porcentaje, horas o dias)`, `Indices unicos parciales garantizan una cubierta por posicion`, `Exportaciones PDF, Excel, JSON` (+29 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 396 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Result` connect `Result` to `Casos de uso de plataforma`, `Estados y permisos de trabajos`, `paradas/application/repositorios.ts`, `Acciones de trabajos`, `Variables de entorno`, `UI modales de mantenimiento (2)`, `equipos/application/casos-uso.ts`, `Importacion de equipos Excel`, `aDomainError`, `Repositorio de preventivos (2)`, `Firmas y fotos`, `ok`, `engrase/application/casos-uso.ts`, `Detalle de preventivo`, `Casos de uso de preventivos`, `Esquemas de preventivos`, `fechas.ts`, `Catalogos (2)`, `trabajos-repositorio.ts`, `plataforma/application/consultas.ts`, `diario/route.ts`, `engrase/actions.ts`?**
  _High betweenness centrality (0.080) - this node is a cross-community bridge._
- **What connects `UNIQUE (empresa_id, id_importacion) para importar sin duplicar`, `Reportes diario (PDF) y mensual (Excel)`, `Umbral por vencer configurable (porcentaje, horas o dias)` to the rest of the system?**
  _34 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Navegacion e iconos` be split into smaller, more focused modules?**
  _Cohesion score 0.06721311475409836 - nodes in this community are weakly interconnected._
- **Why does `next` connect `Sesion y paginas protegidas` to `Navegacion e iconos`, `Fechas y empresas`, `Componentes UI y modales`, `trabajos/page.tsx`, `Layout, perfil y clave`, `Acciones de trabajos`, `paradas/page.tsx`, `Catalogos`, `Dependencias de desarrollo`, `server.ts`, `Variables de entorno`, `UI modales de mantenimiento (2)`, `modales-preventivo.tsx`, `Login`, `sesion.ts`, `Detalle de preventivo`, `Esquemas de preventivos`, `Acciones de equipos (2)`, `Pantalla de personal`, `modales-parada.tsx`, `trabajos/[id]/page.tsx`, `Dependencias de produccion`, `engrase/page.tsx`, `Providers de la app`, `Sesion y paginas protegidas (2)`, `diario/route.ts`, `engrase/actions.ts`?**
  _High betweenness centrality (0.074) - this node is a cross-community bridge._
- **Should `Fechas y empresas` be split into smaller, more focused modules?**
  _Cohesion score 0.08599033816425121 - nodes in this community are weakly interconnected._
- **Why does `DomainError` connect `Casos de uso de plataforma` to `contexto`, `Result`, `Estados y permisos de trabajos`, `Acciones de trabajos`, `Variables de entorno`, `UI modales de mantenimiento (2)`, `equipos/application/casos-uso.ts`, `Importacion de equipos Excel`, `aDomainError`, `Firmas y fotos`, `ok`, `engrase/application/casos-uso.ts`, `Detalle de preventivo`, `Casos de uso de preventivos`, `Esquemas de preventivos`, `fechas.ts`, `Acciones de equipos (2)`, `Pantalla de personal`, `Catalogos (2)`, `trabajos-repositorio.ts`, `engrase/actions.ts`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._
- **Should `Componentes UI y modales` be split into smaller, more focused modules?**
  _Cohesion score 0.09528214616096208 - nodes in this community are weakly interconnected._
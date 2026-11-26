# Graph Report - mantify-app  (2026-11-26)

## Corpus Check
- 290 files · ~162,487 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 6 file(s) not represented in the graph (top: (none) 4, .ico 1, .css 1)

## Summary
- 2009 nodes · 7305 edges · 83 communities (75 shown, 8 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 123 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `bc78b0e5`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- planes/page.tsx
- Result
- exportar.ts
- equipos/[id]/page.tsx
- modales-neumatico.tsx
- panel/page.tsx
- Casos de uso de plataforma
- err
- Estados y permisos de trabajos
- paradas/application/repositorios.ts
- puede
- Spec: Mantify — Corte 10: Dashboard, bandeja y exportaciones — V1
- Acciones de trabajos
- paradas/page.tsx
- Catalogos
- Dependencias de desarrollo
- reportes/infrastructure/index.ts
- Variables de entorno
- paradas/actions.ts
- neumaticos/application/repositorios.ts
- equipos/domain/importacion.ts
- trabajos/application/casos-uso.ts
- paradas/actions.ts
- preventivos/application/esquemas.ts
- fotos.ts
- Importacion y duracion de paradas
- database.types.ts
- paradas/application/casos-uso.ts
- Configuracion TypeScript
- react
- engrase.test.ts
- ok
- Exportacion PDF
- Cortes 07 a 11
- Roadmap y cortes Pro
- permisos.ts
- sesion.ts
- preventivos/application/casos-uso.ts
- preventivos/actions.ts
- fechas.ts
- engrase/application/esquemas.ts
- Flujo correctivo (docs)
- equipos/actions.ts
- preventivos/page.tsx
- Membresia (docs)
- personal/actions.ts
- fechas.ts
- neumaticos/actions.ts
- modales-preventivo.tsx
- trabajos/[id]/page.tsx
- Estandares y base (docs)
- Catalogos y equipos (docs)
- Dependencias de produccion
- engrase/page.tsx
- TrabajosRepositorio
- Providers de la app
- Scripts npm
- Spec: Mantify — Corte 8: Engrase — V1
- Preventivos y paradas (docs)
- claveDe
- neumaticos/application/esquemas.ts
- estado-engrase.ts
- engrase/application/casos-uso.ts
- engrase/actions.ts
- Lector de trabajos
- Sesion y paginas protegidas (2)
- AGENTS.md
- paradas.test.ts
- README
- Config MCP
- Tareas: Corte 9 — Neumáticos
- engrase-repositorio.ts
- Spec: Mantify — Corte 9: Neumáticos — V1
- hoyEn
- neumaticos/application/casos-uso.ts
- Plan de implementación: Corte 8 — Engrase
- obtener-dashboard.ts
- preventivos/application/repositorios.ts
- LectorEngrase
- LectorNeumaticos
- Plan de implementación: Corte 10 — Dashboard, bandeja y exportaciones
- vitest

## God Nodes (most connected - your core abstractions)
1. `ok()` - 129 edges
2. `err()` - 126 edges
3. `DomainError` - 125 edges
4. `Result` - 118 edges
5. `obtenerActor` - 83 edges
6. `exigirPermiso()` - 64 edges
7. `hoyEn()` - 60 edges
8. `react` - 60 edges
9. `Modal()` - 58 edges
10. `next` - 56 edges

## Surprising Connections (you probably didn't know these)
- `3.1 Dashboard (Server Components, una tarjeta por indicador)` --references--> `puede()`  [INFERRED]
  SPEC-corte10-dashboard-exportaciones.md → src/modules/identidad/domain/permisos.ts
- `14. Construido (2026-11-26)` --references--> `armarBandeja()`  [INFERRED]
  SPEC-corte10-dashboard-exportaciones.md → src/modules/reportes/domain/bandeja.ts
- `2. Lo que ya existe (cortes 1 a 9)` --references--> `hoyEn()`  [INFERRED]
  SPEC-corte10-dashboard-exportaciones.md → src/shared/kernel/fechas.ts
- `3.2 Reglas de dominio (puras)` --references--> `saludCubierta()`  [INFERRED]
  SPEC-corte9-neumaticos.md → src/modules/neumaticos/domain/salud.ts
- `7. Estilo de código` --references--> `mensajeError()`  [INFERRED]
  SPEC.md → src/app/(app)/mensajes.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Ciclo correctivo** — cortes_05_backlogs_ot_rm_firmas_flujo_correctivo, cortes_05_backlogs_ot_rm_firmas_maquina_estados, cortes_05_backlogs_ot_rm_firmas_firmas [EXTRACTED 1.00]
- **Flujo sin senal Pro** — cortes_12_sin_senal_pro_electricsql, cortes_12_sin_senal_pro_conflictos_version, cortes_12_sin_senal_pro_cola_offline [EXTRACTED 1.00]

## Communities (83 total, 8 thin omitted)

### Community 0 - "planes/page.tsx"
Cohesion: 0.07
Nodes (51): ModalClave(), MenuPerfil(), cerrarSesion(), iniciarSesion(), ResultadoLogin, BotonIngresar(), ERRORES_URL, LoginForm() (+43 more)

### Community 1 - "Result"
Cohesion: 0.10
Nodes (9): 7. Estilo de código, 7. Estilo de código, CuentasRepositorio, PersonasRepositorio, ServicioAuth, RolEmpresa, EmpresasRepositorio, Result (+1 more)

### Community 2 - "exportar.ts"
Cohesion: 0.15
Nodes (20): GET(), Archivo, DEFINICION, esModuloExcel(), exportarExcelModulo(), fechaHora(), FilasDe, FuentesExcel (+12 more)

### Community 3 - "equipos/[id]/page.tsx"
Cohesion: 0.13
Nodes (29): next, CatalogosPage(), Contenido(), metadata, BotonNuevaEmpresaCargando(), EmpresasPage(), metadata, TablaEmpresas() (+21 more)

### Community 4 - "modales-neumatico.tsx"
Cohesion: 0.23
Nodes (23): Mapa(), MapaPage(), metadata, Accion, ConModal(), Entrada(), FechaYHorometro(), FormMontar() (+15 more)

### Community 5 - "panel/page.tsx"
Cohesion: 0.08
Nodes (33): BotonNuevaEmpresa(), Dato(), Detalle(), EmpresaPage(), metadata, ModalNuevaEmpresa(), ESTADOS_RESUMEN, LEYENDA (+25 more)

### Community 6 - "Casos de uso de plataforma"
Cohesion: 0.15
Nodes (17): cambiarPrecioPlan(), crearEmpresa(), darDeBajaEmpresa(), editarEmpresa(), DatosEmpresa, EmpresaParaMembresia, MotivoBaja, NuevaEmpresa (+9 more)

### Community 7 - "err"
Cohesion: 0.10
Nodes (43): cambiarActivoElemento(), guardarElemento(), listarCatalogo(), crearEquipo(), listarEquipos(), registrarLectura(), empresaDeTrabajo(), exigirPermiso() (+35 more)

### Community 8 - "Estados y permisos de trabajos"
Cohesion: 0.10
Nodes (21): puedeValidar(), verTrabajo(), crearBacklogSchema, validarSchema, ContextoTransicion, Criticidad, EstadoBacklog, EventoBacklog (+13 more)

### Community 9 - "paradas/application/repositorios.ts"
Cohesion: 0.12
Nodes (11): DatosCierre, DatosInicio, EstadoParada, FiltroReporte, LectorParadas, OpcionesParada, ParadaDetalle, ParadasRepositorio (+3 more)

### Community 10 - "puede"
Cohesion: 0.12
Nodes (28): AppShell(), MenuCargando(), MenuConRuta(), MenuModulos(), SENAL, ShellContexto, Ubicacion(), AvisoClave() (+20 more)

### Community 11 - "Spec: Mantify — Corte 10: Dashboard, bandeja y exportaciones — V1"
Cohesion: 0.10
Nodes (20): 10. Criterios de éxito, 11. Diferencias con `cortes/10` (para que las apruebes), 12. Diferido (V2), 13. Decisiones aprobadas, 14. Construido (2026-11-26), 1. Objetivo, 2. Lo que ya existe (cortes 1 a 9), 3.1 Dashboard (Server Components, una tarjeta por indicador) (+12 more)

### Community 12 - "Acciones de trabajos"
Cohesion: 0.27
Nodes (23): abrirOtAction(), CAMPOS_BACKLOG, cerrarReporteAction(), crearBacklogAction(), editarBacklogAction(), errorTrabajo(), estadoRequisicionAction(), fotosDe() (+15 more)

### Community 13 - "paradas/page.tsx"
Cohesion: 0.24
Nodes (13): ModalImportar(), ModalIniciar(), Abiertas(), Contenido(), Diario(), metadata, nf, ParadasPage() (+5 more)

### Community 14 - "Catalogos"
Cohesion: 0.09
Nodes (36): cambiarActivoAction(), EstadoCatalogo, guardarElementoAction(), primerError(), valoresDe(), CampoFormulario(), FormActivo(), FormElemento() (+28 more)

### Community 15 - "Dependencias de desarrollo"
Cohesion: 0.11
Nodes (25): eslintConfig, devDependencies, eslint@^9, eslint-config-next@16.4.6, eslint-config-prettier@^10.1.8, prettier@^3.10.1, tailwindcss@4.3.3, @tailwindcss/turbopack@4.3.3 (+17 more)

### Community 16 - "reportes/infrastructure/index.ts"
Cohesion: 0.10
Nodes (37): server-only, crearCatalogosRepositorio(), nombreCompleto(), crearLectorIdentidad(), crearPersonasRepositorio(), crearCuentasRepositorio(), crearLectorNeumaticos(), crearNeumaticosRepositorio() (+29 more)

### Community 17 - "Variables de entorno"
Cohesion: 0.16
Nodes (15): @supabase/ssr@^0.12.7, @supabase/ssr, register(), config, PROTEGIDAS, proxy(), check(), getPublicEnv() (+7 more)

### Community 18 - "paradas/actions.ts"
Cohesion: 0.15
Nodes (13): GET(), exportarDiario(), BacklogHallazgoEntrada, backlogHallazgoSchema, CerrarEntrada, cerrarSchema, fechaHora, fechaUrl (+5 more)

### Community 19 - "neumaticos/application/repositorios.ts"
Cohesion: 0.08
Nodes (23): DesmontarEntrada, MedirEntrada, MontarEntrada, NeumaticoEntrada, RecaparEntrada, RotarEntrada, EquipoNeumaticos, EstadoNeumatico (+15 more)

### Community 20 - "equipos/domain/importacion.ts"
Cohesion: 0.06
Nodes (27): Elemento, cambiarMovilizacion(), editarEquipo(), verEquipo(), DatosEquipo, importarEquipos(), MOTIVO_BASE, EquipoDetalle (+19 more)

### Community 21 - "trabajos/application/casos-uso.ts"
Cohesion: 0.11
Nodes (24): Repos, VistaTrabajo, AbrirOtEntrada, abrirOtSchema, CerrarReporteEntrada, cerrarReporteSchema, CrearBacklogEntrada, datosBacklog (+16 more)

### Community 22 - "paradas/actions.ts"
Cohesion: 0.22
Nodes (17): backlogHallazgoAction(), cerrarAction(), errorParada(), EstadoImportacion, EstadoParada, fotosDe(), importarAction(), iniciarAction() (+9 more)

### Community 23 - "preventivos/application/esquemas.ts"
Cohesion: 0.12
Nodes (16): BacklogObservacionEntrada, backlogObservacionSchema, ejecutarSchema, id, ProgramarEntrada, programarSchema, ReprogramarEntrada, reprogramarSchema (+8 more)

### Community 24 - "fotos.ts"
Cohesion: 0.16
Nodes (16): EstadoTrabajo, FormFirma(), elegir(), ModalFirma(), PanelFirma(), prepararFirma(), TIPOS, ascii() (+8 more)

### Community 25 - "Importacion y duracion de paradas"
Cohesion: 0.24
Nodes (12): aMs(), esFechaHora(), ALIAS, Campo, clave(), ErrorFila, fechaHora(), horometro() (+4 more)

### Community 26 - "database.types.ts"
Cohesion: 0.20
Nodes (9): CompositeTypes, Constants, DatabaseWithoutInternals, DefaultSchema, Enums, Json, Tables, TablesInsert (+1 more)

### Community 27 - "paradas/application/casos-uso.ts"
Cohesion: 0.17
Nodes (23): aplicarRevision(), backlogDesdeHallazgo(), cerrarParada(), contexto(), iniciarParada(), MAX_DIAS_REPORTE, MOTIVO_BASE, noEncontrada() (+15 more)

### Community 28 - "Configuracion TypeScript"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 29 - "react"
Cohesion: 0.09
Nodes (42): react, cambiarClaveAction(), EstadoClave, CAMPOS, FormularioClave(), CuentasEmpresa(), FormularioPersona(), ModalPersona() (+34 more)

### Community 30 - "engrase.test.ts"
Cohesion: 0.14
Nodes (13): armarFilas(), listarEngrase(), RegistroEntrada, ordenarPorEstado(), puntosEfectivos(), reposReportes(), AHORA, D10 (+5 more)

### Community 31 - "ok"
Cohesion: 0.12
Nodes (37): unaFila(), contexto(), invalido(), registrarEngrase(), verEngrase(), validarHorometroEngrase(), validarLectura(), crearServicioAuth() (+29 more)

### Community 32 - "Exportacion PDF"
Cohesion: 0.31
Nodes (9): aWinAnsi(), ColumnaPdf, crearPdf(), literal(), pagina(), recortar(), TablaPdf, textoPdf() (+1 more)

### Community 33 - "Cortes 07 a 11"
Cohesion: 0.17
Nodes (12): UNIQUE (empresa_id, id_importacion) para importar sin duplicar, Ranking de fallas por paradas no planificadas, Reportes diario (PDF) y mensual (Excel), Umbral por vencer configurable (porcentaje, horas o dias), Indices unicos parciales garantizan una cubierta por posicion, Neumaticos: montaje, medicion, rotacion, recapado, Salud de cubierta: cambiar, alerta, medir, OK, Dashboard por rol con vistas de base (+4 more)

### Community 34 - "Roadmap y cortes Pro"
Cohesion: 0.17
Nodes (13): Cola offline y /api/sync con idempotencia, ElectricSQL en Railway, replicacion logica con Supabase, Revisar LICENSE de ElectricSQL antes de empezar, Formulas en domain, no en SQL, Verificacion de plan Pro en el servidor, Cobro manual por transferencia; sin cobro antes de cerrar el corte, Terminos, privacidad y comprobantes SUNAT, Ley 29733 de proteccion de datos personales (+5 more)

### Community 35 - "permisos.ts"
Cohesion: 0.18
Nodes (12): Accion, ESCRIBIR, LEER, MATRIZ, Recurso, Rol, ROLES, TODO (+4 more)

### Community 36 - "sesion.ts"
Cohesion: 0.09
Nodes (44): Encabezado(), Esqueleto(), ErrorPanel(), Contenido(), InicioPage(), metadata, CubiertaPage(), Dato() (+36 more)

### Community 37 - "preventivos/application/casos-uso.ts"
Cohesion: 0.17
Nodes (20): contexto(), ejecutarPreventivo(), generarBacklogDesdeObservacion(), importarPreventivos(), MOTIVO_BASE, noEncontrado(), programarPreventivo(), reprogramarPreventivo() (+12 more)

### Community 38 - "preventivos/actions.ts"
Cohesion: 0.24
Nodes (18): backlogObservacionAction(), CAMPOS_PROGRAMAR, ejecutarAction(), errorPreventivo(), EstadoImportacion, EstadoPreventivo, importarAction(), json() (+10 more)

### Community 39 - "fechas.ts"
Cohesion: 0.24
Nodes (10): ALIAS, Campo, clave(), ErrorFila, fecha(), leerCsv(), LIMITES_CSV, Preparacion (+2 more)

### Community 40 - "engrase/application/esquemas.ts"
Cohesion: 0.17
Nodes (11): avisoSchema, cadaDias, cadaHoras, MAX_PUNTOS, planSchema, registroSchema, vacioANulo, clave (+3 more)

### Community 41 - "Flujo correctivo (docs)"
Cohesion: 0.14
Nodes (14): Nadie valida su propio cierre, salvo planificador autorizado, Codigos secuenciales BKL-, OT-AAAA-, RM-AAAA- (siguiente_codigo), Firmas: sin firma no se cierra; reabrir las invalida, Flujo correctivo: backlog, OT, RM, validacion, Cierre con clave de idempotencia y bloqueo de fila, Maquina de estados transicionar(estado, evento, rol, esPropio), Requisicion (RQ) con prefijo de empresa, Actividad OBSERVADO genera backlog origen PREVENTIVO (+6 more)

### Community 42 - "equipos/actions.ts"
Cohesion: 0.06
Nodes (55): CAMPOS, crearEquipoAction(), editarEquipoAction(), errorEquipo(), EstadoEquipo, EstadoImportacion, importarAction(), lecturaAction() (+47 more)

### Community 43 - "preventivos/page.tsx"
Cohesion: 0.10
Nodes (29): ModalImportar(), EN_VISTA, esVista(), Lista(), metadata, nf, PreventivosPage(), uno() (+21 more)

### Community 44 - "Membresia (docs)"
Cohesion: 0.16
Nodes (12): Funcion empresa_activa() usada por RLS, Bloqueo de login 3 intentos / 30 s en memoria, Membresia 30 dias con 3 de gracia y estados AL_DIA..INACTIVA, Modulo plataforma (superadmin), Pagos manuales registrados por superadmin, Validacion de RUC de 11 digitos unico, Cupo de cuentas por plan: Estandar 10, Pro 25, Matriz de permisos puede(rol, accion, recurso) (+4 more)

### Community 45 - "personal/actions.ts"
Cohesion: 0.12
Nodes (32): mensajeError(), asignarPersonaAction(), cambiarRolAction(), CAMPOS_PERSONA, crearCuentaAction(), crearPersonaAction(), darBajaAction(), desactivarCuentaAction() (+24 more)

### Community 46 - "fechas.ts"
Cohesion: 0.11
Nodes (39): 2. Lo que ya existe (cortes 1 a 7), AccionesFila(), FormBaja(), FormEditar(), FormRenovar(), Pie(), CAMPOS_EMPRESA, crearEmpresaAction() (+31 more)

### Community 47 - "neumaticos/actions.ts"
Cohesion: 0.20
Nodes (24): campos(), desmontarAction(), ejecutar(), errorNeumatico(), EstadoNeumaticoForm, guardarNeumaticoAction(), medirAction(), MENSAJES (+16 more)

### Community 48 - "modales-preventivo.tsx"
Cohesion: 0.07
Nodes (88): BotonActivo(), registrarAction(), EJEMPLO, FormAviso(), FormPlan(), FormRegistrar(), Grasa, ModalAviso() (+80 more)

### Community 49 - "trabajos/[id]/page.tsx"
Cohesion: 0.22
Nodes (15): metadata, Bandeja(), esVista(), metadata, TrabajosPage(), uno(), VISTAS, opcionesTrabajo() (+7 more)

### Community 50 - "Estandares y base (docs)"
Cohesion: 0.22
Nodes (11): Capas por modulo: domain, application, infrastructure, ui, CI: lint, tipos, pruebas, npm audit, Dependabot, DomainError con codigo y Result, Next.js App Router + Tailwind + Vitest + Playwright + Supabase CLI, Autenticacion Supabase Auth sin MFA, Autorizacion: RLS denegar por defecto y doble barrera, Calidad de codigo senior (TS estricto, ADR), Guardia defineAction / defineRoute (pipeline de 11 pasos) (+3 more)

### Community 51 - "Catalogos y equipos (docs)"
Cohesion: 0.19
Nodes (11): Catalogos editables por empresa con seeds, categorias_equipo con tipo_medidor y nombre_flota, Regla: catalogo en uso se desactiva, no se borra, Correccion a la baja solo planificador con motivo y auditoria, Equipos: estado_operativo y estado_movilizacion, Horometro solo sube (dominio + trigger), Importacion Excel de equipos con errores por fila, Engrase: estados calculados al leer (+3 more)

### Community 52 - "Dependencias de produccion"
Cohesion: 0.13
Nodes (15): dependencies, fflate@0.8.3, lucide-react@^1.75.0, next@16.4.6, react@19.3.0, react-dom@19.3.0, read-excel-file@9.3.14, server-only@^0.0.1 (+7 more)

### Community 53 - "engrase/page.tsx"
Cohesion: 0.19
Nodes (19): Campo(), NuevaEmpresaForm(), Detalle(), EngraseEquipoPage(), metadata, ModalPlan(), ModalRegistrar(), EngrasePage() (+11 more)

### Community 54 - "TrabajosRepositorio"
Cohesion: 0.17
Nodes (3): DatosBacklog, TrabajosRepositorio, TipoImagen

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

### Community 59 - "claveDe"
Cohesion: 0.06
Nodes (28): @playwright/test@^1.65.1, @playwright/test, claveDe(), fila(), irAFila(), SELLO, abrirEquipo(), entrar() (+20 more)

### Community 60 - "neumaticos/application/esquemas.ts"
Cohesion: 0.10
Nodes (22): decimal(), desmontarSchema, DESTINOS, horometro, id, medida, medirSchema, montarSchema (+14 more)

### Community 61 - "estado-engrase.ts"
Cohesion: 0.15
Nodes (15): Medidor, calcularEstado(), esRegistroCompleto(), EstadoEngrase, ESTADOS_ENGRASE, Frecuencia, margen(), RANGO_AVISO (+7 more)

### Community 62 - "engrase/application/casos-uso.ts"
Cohesion: 0.26
Nodes (10): AvisoEntrada, PlanEntrada, EmpresaEngrase, EngraseRepositorio, EquipoEngrase, FilaEngrase, ListadoEngrase, RegistroEngrase (+2 more)

### Community 63 - "engrase/actions.ts"
Cohesion: 0.35
Nodes (10): configurarAvisoAction(), errorEngrase(), EstadoEngraseForm, guardarPlanAction(), MENSAJES, primerError(), terminar(), valoresDe() (+2 more)

### Community 65 - "Sesion y paginas protegidas (2)"
Cohesion: 0.50
Nodes (3): csp, nextConfig, securityHeaders

### Community 67 - "paradas.test.ts"
Cohesion: 0.15
Nodes (17): exportarMensual(), rankingParadas(), reporteParadas(), COLUMNAS_DIARIO, filaDiario(), hojasMensual(), hora(), nf (+9 more)

### Community 71 - "Tareas: Corte 9 — Neumáticos"
Cohesion: 0.13
Nodes (14): Punto de control A, Punto de control B, Punto de control C, - [ ] T10. Cierre (S), Tareas: Corte 9 — Neumáticos, - [x] T1. Dominio y permisos (M), - [x] T2. Tablas, índices y RLS (M), - [x] T3. Stock de cubiertas (L, en dos pasos) (+6 more)

### Community 72 - "engrase-repositorio.ts"
Cohesion: 0.39
Nodes (4): TIPOS_AVISO, crearEngraseRepositorio(), crearLectorEngrase(), reposEngrase()

### Community 73 - "Spec: Mantify — Corte 9: Neumáticos — V1"
Cohesion: 0.11
Nodes (18): 10. Límites, 11. Diferencias con el corte 9, 12. Diferido, 13. Decisiones aprobadas, 14. Construido (2026-11-25), 15. Antes de empezar, 1. Objetivo, 2. Lo que ya existe (cortes 1 a 8) (+10 more)

### Community 74 - "hoyEn"
Cohesion: 0.24
Nodes (12): zod, descargar(), ESTADO, GET(), GET(), GET(), entrada, POST() (+4 more)

### Community 75 - "neumaticos/application/casos-uso.ts"
Cohesion: 0.18
Nodes (22): contexto(), definirPosiciones(), evaluar(), guardarNeumatico(), listarNeumaticos(), umbralesDe(), verEquipoNeumaticos(), verNeumatico() (+14 more)

### Community 76 - "Plan de implementación: Corte 8 — Engrase"
Cohesion: 0.29
Nodes (6): Decisiones, Dependencias, Plan de implementación: Corte 9 — Neumáticos, Preguntas abiertas, Resumen, Riesgos

### Community 77 - "obtener-dashboard.ts"
Cohesion: 0.06
Nodes (58): Panel(), Salud, SALUDES, Base, Dashboard, DatosDashboard, flotaDe(), FuentesDashboard (+50 more)

### Community 78 - "preventivos/application/repositorios.ts"
Cohesion: 0.12
Nodes (9): DatosEjecucion, DatosProgramacion, LectorPreventivos, OpcionesPreventivo, PreventivoFila, PreventivosRepositorio, ResultadoImportacion, FilaPreventivo (+1 more)

### Community 81 - "Plan de implementación: Corte 10 — Dashboard, bandeja y exportaciones"
Cohesion: 0.33
Nodes (5): Dependencias, Plan de implementación: Corte 10 — Dashboard, bandeja y exportaciones, Preguntas abiertas, Resumen, Riesgos

## Knowledge Gaps
- **34 isolated node(s):** `UNIQUE (empresa_id, id_importacion) para importar sin duplicar`, `Reportes diario (PDF) y mensual (Excel)`, `Umbral por vencer configurable (porcentaje, horas o dias)`, `Indices unicos parciales garantizan una cubierta por posicion`, `Exportaciones PDF, Excel, JSON` (+29 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 501 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `equipos/[id]/page.tsx` to `planes/page.tsx`, `exportar.ts`, `modales-neumatico.tsx`, `panel/page.tsx`, `puede`, `Acciones de trabajos`, `paradas/page.tsx`, `Catalogos`, `Dependencias de desarrollo`, `reportes/infrastructure/index.ts`, `Variables de entorno`, `paradas/actions.ts`, `paradas/actions.ts`, `react`, `sesion.ts`, `preventivos/actions.ts`, `equipos/actions.ts`, `preventivos/page.tsx`, `personal/actions.ts`, `fechas.ts`, `neumaticos/actions.ts`, `modales-preventivo.tsx`, `trabajos/[id]/page.tsx`, `Dependencias de produccion`, `engrase/page.tsx`, `Providers de la app`, `engrase/actions.ts`, `Sesion y paginas protegidas (2)`, `hoyEn`, `obtener-dashboard.ts`?**
  _High betweenness centrality (0.061) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `DomainError` (e.g. with `7. Estilo de código` and `7. Estilo de código`) actually correct?**
  _`DomainError` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `UNIQUE (empresa_id, id_importacion) para importar sin duplicar`, `Reportes diario (PDF) y mensual (Excel)`, `Umbral por vencer configurable (porcentaje, horas o dias)` to the rest of the system?**
  _34 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `planes/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06768905341089371 - nodes in this community are weakly interconnected._
- **Why does `ok()` connect `ok` to `exportar.ts`, `equipos/[id]/page.tsx`, `panel/page.tsx`, `Casos de uso de plataforma`, `err`, `Estados y permisos de trabajos`, `Catalogos`, `reportes/infrastructure/index.ts`, `paradas/actions.ts`, `equipos/domain/importacion.ts`, `trabajos/application/casos-uso.ts`, `paradas/actions.ts`, `paradas/application/casos-uso.ts`, `react`, `engrase.test.ts`, `preventivos/application/casos-uso.ts`, `preventivos/page.tsx`, `fechas.ts`, `modales-preventivo.tsx`, `trabajos/[id]/page.tsx`, `neumaticos/application/esquemas.ts`, `estado-engrase.ts`, `engrase/application/casos-uso.ts`, `paradas.test.ts`, `neumaticos/application/casos-uso.ts`, `obtener-dashboard.ts`?**
  _High betweenness centrality (0.059) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `Result` (e.g. with `7. Estilo de código` and `7. Estilo de código`) actually correct?**
  _`Result` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Should `Result` be split into smaller, more focused modules?**
  _Cohesion score 0.1010752688172043 - nodes in this community are weakly interconnected._
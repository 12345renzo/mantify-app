# Graph Report - mantify-app  (2026-11-25)

## Corpus Check
- 21 files · ~114,665 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1478 nodes · 5022 edges · 71 communities (63 shown, 8 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 87 edges (avg confidence: 0.82)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Navegacion e iconos
- Fechas y empresas
- Componentes UI y modales
- Paginas de equipos
- Errores de dominio y personal
- Sesion y paginas protegidas
- Casos de uso de plataforma
- Identidad contratos y repositorios
- Estados y permisos de trabajos
- Repositorio de paradas
- UI modales de mantenimiento
- Layout, perfil y clave
- Acciones de trabajos
- Listado de paradas
- Catalogos
- Dependencias de desarrollo
- Repositorio de preventivos
- Variables de entorno
- UI modales de mantenimiento (2)
- Acciones de equipos
- Casos de uso de equipos
- Importacion de equipos Excel
- Supabase server y errores
- Repositorio de preventivos (2)
- Firmas y fotos
- Importacion y duracion de paradas
- Tipos de base de datos
- Cierre de paradas
- Configuracion TypeScript
- Acciones de preventivos
- UI modales de mantenimiento (3)
- Login
- Exportacion PDF
- Cortes 07 a 11
- Roadmap y cortes Pro
- Permisos y pruebas kernel
- Detalle de preventivo
- Casos de uso de preventivos
- Esquemas de preventivos
- Importacion CSV preventivos
- Esquemas de trabajos
- Flujo correctivo (docs)
- Acciones de equipos (2)
- Casos de uso de preventivos (2)
- Membresia (docs)
- Pantalla de personal
- Catalogos (2)
- Errores de dominio y personal (2)
- UI modales de mantenimiento (4)
- Listado de preventivos
- Estandares y base (docs)
- Catalogos y equipos (docs)
- Dependencias de produccion
- Detalle de parada
- Repositorio de trabajos
- Providers de la app
- Scripts npm
- Componentes UI y modales (2)
- Preventivos y paradas (docs)
- Pruebas E2E de trabajos
- Reportes de paradas
- Pruebas E2E de paradas
- Pruebas E2E de paradas (2)
- Consultas de identidad
- Lector de trabajos
- Sesion y paginas protegidas (2)
- AGENTS.md
- Errores y reglas de cierre
- README
- Config MCP

## God Nodes (most connected - your core abstractions)
1. `DomainError` - 67 edges
2. `Result` - 67 edges
3. `err()` - 65 edges
4. `ok()` - 65 edges
5. `react` - 49 edges
6. `obtenerActor` - 45 edges
7. `next` - 44 edges
8. `exigirPermiso()` - 39 edges
9. `Actor` - 35 edges
10. `empresaDeTrabajo()` - 33 edges

## Surprising Connections (you probably didn't know these)
- `repos()` --calls--> `ok()`  [EXTRACTED]
  tests/unit/trabajos.test.ts → src/shared/kernel/result.ts
- `fakes()` --calls--> `ok()`  [EXTRACTED]
  tests/unit/catalogos.test.ts → src/shared/kernel/result.ts
- `form()` --calls--> `esquemaElemento()`  [EXTRACTED]
  tests/unit/catalogos.test.ts → src/modules/catalogos/application/esquemas.ts
- `Duracion con cruce de medianoche suma 24 h` --semantically_similar_to--> `Paradas con revision al cerrar (revisarCierre)`  [INFERRED] [semantically similar]
  cortes/06-preventivos.md → cortes/07-paradas-reportes.md
- `estado()` --calls--> `calcularEstadoMembresia()`  [EXTRACTED]
  tests/unit/plataforma-dominio.test.ts → src/modules/plataforma/domain/estado-membresia.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Ciclo correctivo** — cortes_05_backlogs_ot_rm_firmas_flujo_correctivo, cortes_05_backlogs_ot_rm_firmas_maquina_estados, cortes_05_backlogs_ot_rm_firmas_firmas [EXTRACTED 1.00]
- **Flujo sin senal Pro** — cortes_12_sin_senal_pro_electricsql, cortes_12_sin_senal_pro_conflictos_version, cortes_12_sin_senal_pro_cola_offline [EXTRACTED 1.00]

## Communities (71 total, 8 thin omitted)

### Community 0 - "Navegacion e iconos"
Cohesion: 0.06
Nodes (57): AppShell(), MenuConRuta(), MenuModulos(), SENAL, ShellContexto, Ubicacion(), ErrorPanel(), buscarSeccion() (+49 more)

### Community 1 - "Fechas y empresas"
Cohesion: 0.07
Nodes (51): AccionesFila(), FormBaja(), FormEditar(), FormRenovar(), Pie(), CAMPOS_EMPRESA, crearEmpresaAction(), darDeBajaAction() (+43 more)

### Community 2 - "Componentes UI y modales"
Cohesion: 0.09
Nodes (46): BotonActivo(), CampoFormulario(), FormActivo(), FormElemento(), ModalElemento(), OpcionCategoria, Campo(), ModalNuevaEmpresa() (+38 more)

### Community 3 - "Paginas de equipos"
Cohesion: 0.11
Nodes (44): CatalogosPage(), Contenido(), metadata, CuentasEmpresa(), Encabezado(), Esqueleto(), Dato(), EquipoPage() (+36 more)

### Community 4 - "Errores de dominio y personal"
Cohesion: 0.17
Nodes (33): cambiarActivoElemento(), guardarElemento(), listarCatalogo(), unaFila(), listarEquipos(), verEquipo(), empresaDeTrabajo(), exigirPermiso() (+25 more)

### Community 5 - "Sesion y paginas protegidas"
Cohesion: 0.12
Nodes (34): next, BotonNuevaEmpresa(), BotonNuevaEmpresaCargando(), Dato(), Detalle(), EmpresaPage(), metadata, EmpresasPage() (+26 more)

### Community 6 - "Casos de uso de plataforma"
Cohesion: 0.13
Nodes (18): cambiarPrecioPlan(), crearEmpresa(), darDeBajaEmpresa(), editarEmpresa(), DatosEmpresa, EmpresaParaMembresia, EmpresasRepositorio, MotivoBaja (+10 more)

### Community 7 - "Identidad contratos y repositorios"
Cohesion: 0.08
Nodes (14): DatosEquipo, EquiposRepositorio, FilaImportada, CuentaInfo, CuentasRepositorio, DatosPersona, PersonaInfo, PersonasRepositorio (+6 more)

### Community 8 - "Estados y permisos de trabajos"
Cohesion: 0.08
Nodes (27): puedeValidar(), cerrarReporteSchema, crearBacklogSchema, validarSchema, ContextoTransicion, Criticidad, CRITICIDADES, EstadoBacklog (+19 more)

### Community 9 - "Repositorio de paradas"
Cohesion: 0.08
Nodes (25): BacklogHallazgoEntrada, backlogHallazgoSchema, CerrarEntrada, cerrarSchema, DatosCierre, DatosInicio, fechaHora, horometro (+17 more)

### Community 10 - "UI modales de mantenimiento"
Cohesion: 0.12
Nodes (31): Dato(), Detalle(), Fotos(), metadata, Requisiciones(), Seccion(), TrabajoPage(), BotonRequisicion() (+23 more)

### Community 11 - "Layout, perfil y clave"
Cohesion: 0.13
Nodes (26): react, MenuCargando(), AvisoClave(), CAMPOS, FormularioClave(), ModalClave(), AppLayout(), AvisoClaveServidor() (+18 more)

### Community 12 - "Acciones de trabajos"
Cohesion: 0.21
Nodes (30): abrirOtAction(), CAMPOS_BACKLOG, cerrarReporteAction(), crearBacklogAction(), editarBacklogAction(), errorTrabajo(), estadoRequisicionAction(), fotosDe() (+22 more)

### Community 13 - "Listado de paradas"
Cohesion: 0.14
Nodes (25): descargar(), ESTADO, GET(), GET(), ModalIniciar(), Abiertas(), Contenido(), Diario() (+17 more)

### Community 14 - "Catalogos"
Cohesion: 0.12
Nodes (25): cambiarActivoAction(), EstadoCatalogo, guardarElementoAction(), primerError(), valoresDe(), CambiarActivoEntrada, cambiarActivoSchema, catalogoSchema (+17 more)

### Community 15 - "Dependencias de desarrollo"
Cohesion: 0.10
Nodes (26): eslintConfig, devDependencies, eslint@^9, eslint-config-next@16.4.6, eslint-config-prettier@^10.1.8, prettier@^3.10.1, tailwindcss@4.3.3, @tailwindcss/turbopack@4.3.3 (+18 more)

### Community 16 - "Repositorio de preventivos"
Cohesion: 0.16
Nodes (21): nombres(), crearLectorParadas(), crearParadasRepositorio(), crearLectorPreventivos(), crearPreventivosRepositorio(), fila(), FilaBase, num() (+13 more)

### Community 17 - "Variables de entorno"
Cohesion: 0.13
Nodes (16): @supabase/ssr, @supabase/supabase-js, register(), crearServicioAuth(), errorAuth(), config, PROTEGIDAS, check() (+8 more)

### Community 18 - "UI modales de mantenimiento (2)"
Cohesion: 0.15
Nodes (23): backlogHallazgoAction(), cerrarAction(), errorParada(), EstadoImportacion, EstadoParada, fotosDe(), importarAction(), iniciarAction() (+15 more)

### Community 19 - "Acciones de equipos"
Cohesion: 0.14
Nodes (20): cambiarMovilizacion(), crearEquipo(), editarEquipo(), registrarLectura(), campos, CrearEquipoEntrada, crearEquipoSchema, EditarEquipoEntrada (+12 more)

### Community 20 - "Casos de uso de equipos"
Cohesion: 0.12
Nodes (14): EquipoDetalle, EquipoFila, EquipoParaLectura, LectorEquipos, LectorExcel, Lectura, ResultadoFilaImportada, EstadoMovilizacion (+6 more)

### Community 21 - "Importacion de equipos Excel"
Cohesion: 0.17
Nodes (20): importarEquipos(), MOTIVO_BASE, normalizarCodigo(), ALIAS, Campo, Catalogos, claveEncabezado(), claveNombre() (+12 more)

### Community 22 - "Supabase server y errores"
Cohesion: 0.19
Nodes (12): server-only, crearCatalogosRepositorio(), Personal, crearLectorIdentidad(), crearPersonasRepositorio(), crearCuentasRepositorio(), crearEmpresasRepositorio(), crearPlanesRepositorio() (+4 more)

### Community 23 - "Repositorio de preventivos (2)"
Cohesion: 0.11
Nodes (11): DatosEjecucion, DatosProgramacion, LectorPreventivos, OpcionesPreventivo, PreventivoDetalle, PreventivoFila, PreventivosRepositorio, ReposPreventivos (+3 more)

### Community 24 - "Firmas y fotos"
Cohesion: 0.18
Nodes (18): Repos, VistaTrabajo, BacklogDetalle, BacklogFila, EstadoRequisicion, OpcionesTrabajo, VistaBandeja, ascii() (+10 more)

### Community 25 - "Importacion y duracion de paradas"
Cohesion: 0.17
Nodes (17): HOROMETRO_MAX, aMs(), duracionHoras(), esFechaHora(), FechaHora, ALIAS, Campo, clave() (+9 more)

### Community 26 - "Tipos de base de datos"
Cohesion: 0.11
Nodes (14): LectorParadas, FilaReporte, num(), parada(), CompositeTypes, Constants, Database, DatabaseWithoutInternals (+6 more)

### Community 27 - "Cierre de paradas"
Cohesion: 0.24
Nodes (18): aplicarRevision(), backlogDesdeHallazgo(), cerrarParada(), contexto(), importarParadas(), iniciarParada(), MAX_DIAS_REPORTE, MOTIVO_BASE (+10 more)

### Community 28 - "Configuracion TypeScript"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 29 - "Acciones de preventivos"
Cohesion: 0.27
Nodes (17): backlogObservacionAction(), CAMPOS_PROGRAMAR, ejecutarAction(), errorPreventivo(), importarAction(), json(), MENSAJES, MENSAJES_ARCHIVO (+9 more)

### Community 30 - "UI modales de mantenimiento (3)"
Cohesion: 0.16
Nodes (16): EstadoImportacion, EstadoPreventivo, Cifra(), COLUMNAS, FormImportar(), FormReprogramar(), FormValidar(), ModalImportar() (+8 more)

### Community 31 - "Login"
Cohesion: 0.19
Nodes (14): cerrarSesion(), iniciarSesion(), ResultadoLogin, BotonIngresar(), ERRORES_URL, LoginForm(), enviar(), loginSchema (+6 more)

### Community 32 - "Exportacion PDF"
Cohesion: 0.18
Nodes (16): COLUMNAS_DIARIO, filaDiario(), hojasMensual(), hora(), nf, pdfDiario(), rankingFallas(), aWinAnsi() (+8 more)

### Community 33 - "Cortes 07 a 11"
Cohesion: 0.17
Nodes (12): UNIQUE (empresa_id, id_importacion) para importar sin duplicar, Ranking de fallas por paradas no planificadas, Reportes diario (PDF) y mensual (Excel), Umbral por vencer configurable (porcentaje, horas o dias), Indices unicos parciales garantizan una cubierta por posicion, Neumaticos: montaje, medicion, rotacion, recapado, Salud de cubierta: cambiar, alerta, medir, OK, Dashboard por rol con vistas de base (+4 more)

### Community 34 - "Roadmap y cortes Pro"
Cohesion: 0.17
Nodes (13): Cola offline y /api/sync con idempotencia, ElectricSQL en Railway, replicacion logica con Supabase, Revisar LICENSE de ElectricSQL antes de empezar, Formulas en domain, no en SQL, Verificacion de plan Pro en el servidor, Cobro manual por transferencia; sin cobro antes de cerrar el corte, Terminos, privacidad y comprobantes SUNAT, Ley 29733 de proteccion de datos personales (+5 more)

### Community 35 - "Permisos y pruebas kernel"
Cohesion: 0.14
Nodes (13): vitest, Accion, ESCRIBIR, LEER, MATRIZ, Recurso, Rol, ROLES (+5 more)

### Community 36 - "Detalle de preventivo"
Cohesion: 0.20
Nodes (15): Dato(), Detalle(), horas(), metadata, nf, PreventivoPage(), Seccion(), FormBacklogObservacion() (+7 more)

### Community 37 - "Casos de uso de preventivos"
Cohesion: 0.25
Nodes (16): contexto(), ejecutarPreventivo(), generarBacklogDesdeObservacion(), MOTIVO_BASE, noEncontrado(), opcionesPreventivo(), reprogramarPreventivo(), ResumenImportacion (+8 more)

### Community 38 - "Esquemas de preventivos"
Cohesion: 0.12
Nodes (15): BacklogObservacionEntrada, backlogObservacionSchema, horometroOpcional, id, ProgramarEntrada, ReprogramarEntrada, reprogramarSchema, ValidarPreventivoEntrada (+7 more)

### Community 39 - "Importacion CSV preventivos"
Cohesion: 0.15
Nodes (15): ALIAS, Campo, clave(), ErrorFila, fecha(), leerCsv(), LIMITES_CSV, Preparacion (+7 more)

### Community 40 - "Esquemas de trabajos"
Cohesion: 0.12
Nodes (16): AbrirOtEntrada, abrirOtSchema, CerrarReporteEntrada, CrearBacklogEntrada, datosBacklog, EditarBacklogEntrada, editarBacklogSchema, EstadoRequisicionEntrada (+8 more)

### Community 41 - "Flujo correctivo (docs)"
Cohesion: 0.14
Nodes (14): Nadie valida su propio cierre, salvo planificador autorizado, Codigos secuenciales BKL-, OT-AAAA-, RM-AAAA- (siguiente_codigo), Firmas: sin firma no se cierra; reabrir las invalida, Flujo correctivo: backlog, OT, RM, validacion, Cierre con clave de idempotencia y bloqueo de fila, Maquina de estados transicionar(estado, evento, rol, esPropio), Requisicion (RQ) con prefijo de empresa, Actividad OBSERVADO genera backlog origen PREVENTIVO (+6 more)

### Community 42 - "Acciones de equipos (2)"
Cohesion: 0.24
Nodes (15): CAMPOS, crearEquipoAction(), editarEquipoAction(), errorEquipo(), EstadoEquipo, EstadoImportacion, importarAction(), lecturaAction() (+7 more)

### Community 43 - "Casos de uso de preventivos (2)"
Cohesion: 0.18
Nodes (10): EjecutarEntrada, ejecutarSchema, programarSchema, DIAS_ALERTA, enAlerta(), estaVencido(), horometroEnAlerta(), MARGEN_HORAS (+2 more)

### Community 44 - "Membresia (docs)"
Cohesion: 0.16
Nodes (12): Funcion empresa_activa() usada por RLS, Bloqueo de login 3 intentos / 30 s en memoria, Membresia 30 dias con 3 de gracia y estados AL_DIA..INACTIVA, Modulo plataforma (superadmin), Pagos manuales registrados por superadmin, Validacion de RUC de 11 digitos unico, Cupo de cuentas por plan: Estandar 10, Pro 25, Matriz de permisos puede(rol, accion, recurso) (+4 more)

### Community 45 - "Pantalla de personal"
Cohesion: 0.30
Nodes (14): cambiarClaveAction(), EstadoClave, mensajeError(), asignarPersonaAction(), crearCuentaAction(), crearPersonaAction(), darBajaAction(), editarPersonaAction() (+6 more)

### Community 46 - "Catalogos (2)"
Cohesion: 0.23
Nodes (8): CatalogosRepositorio, Elemento, CodigoCatalogo, Valores, errorEn(), fakes(), form(), ok_()

### Community 47 - "Errores de dominio y personal (2)"
Cohesion: 0.21
Nodes (10): zod, CAMPOS_PERSONA, MENSAJES_CUENTA, asignarPersonaSchema, cambiarRolSchema, correo, crearCuentaSchema, darBajaSchema (+2 more)

### Community 48 - "UI modales de mantenimiento (4)"
Cohesion: 0.34
Nodes (14): ConfirmarCruce(), FormCerrar(), FormIniciar(), FormEjecutar(), AvisoFirma(), CampoFotos(), Clave(), conFotos() (+6 more)

### Community 49 - "Listado de preventivos"
Cohesion: 0.20
Nodes (13): FormProgramar(), ModalProgramar(), EN_VISTA, esVista(), Lista(), metadata, nf, PreventivosPage() (+5 more)

### Community 50 - "Estandares y base (docs)"
Cohesion: 0.22
Nodes (11): Capas por modulo: domain, application, infrastructure, ui, CI: lint, tipos, pruebas, npm audit, Dependabot, DomainError con codigo y Result, Next.js App Router + Tailwind + Vitest + Playwright + Supabase CLI, Autenticacion Supabase Auth sin MFA, Autorizacion: RLS denegar por defecto y doble barrera, Calidad de codigo senior (TS estricto, ADR), Guardia defineAction / defineRoute (pipeline de 11 pasos) (+3 more)

### Community 51 - "Catalogos y equipos (docs)"
Cohesion: 0.19
Nodes (11): Catalogos editables por empresa con seeds, categorias_equipo con tipo_medidor y nombre_flota, Regla: catalogo en uso se desactiva, no se borra, Correccion a la baja solo planificador con motivo y auditoria, Equipos: estado_operativo y estado_movilizacion, Horometro solo sube (dominio + trigger), Importacion Excel de equipos con errores por fila, Engrase: estados calculados al leer (+3 more)

### Community 52 - "Dependencias de produccion"
Cohesion: 0.15
Nodes (13): dependencies, fflate@0.8.3, lucide-react@^1.75.0, next@16.4.6, react@19.3.0, react-dom@19.3.0, server-only@^0.0.1, @supabase/ssr@^0.12.7 (+5 more)

### Community 53 - "Detalle de parada"
Cohesion: 0.26
Nodes (11): Dato(), Detalle(), hora(), metadata, nf, ParadaPage(), FormBacklog(), ModalBacklogHallazgo() (+3 more)

### Community 55 - "Providers de la app"
Cohesion: 0.24
Nodes (7): @tanstack/react-query@^5.108.0, @tanstack/react-query, geistMono, geistSans, metadata, RootLayout(), QueryProvider()

### Community 56 - "Scripts npm"
Cohesion: 0.20
Nodes (10): scripts, build, dev, format, format:check, lint, start, test (+2 more)

### Community 57 - "Componentes UI y modales (2)"
Cohesion: 0.36
Nodes (9): cambiarRolAction(), EstadoIdentidad, FormPersona(), FormRol(), ModalEditarPersona(), ModalRolCuenta(), Pie(), useModal() (+1 more)

### Community 58 - "Preventivos y paradas (docs)"
Cohesion: 0.25
Nodes (8): motivos_parada: MCI no planificado, PM1-PM4 planificados, Duracion con cruce de medianoche suma 24 h, Fechas del servidor deciden vencimiento, no el cliente, Preventivos PM1-PM4 con alerta a 7 dias, Vencido no es estado guardado: se evalua al leer, Paradas con revision al cerrar (revisarCierre), Proyeccion de desgaste (Pro, implementada aqui), Indicadores Pro: disponibilidad, MTTR, MTBF, Pareto

### Community 59 - "Pruebas E2E de trabajos"
Cohesion: 0.31
Nodes (4): firmaDesdePerfil(), registrarFirma(), jpg(), png()

### Community 60 - "Reportes de paradas"
Cohesion: 0.43
Nodes (7): Celda, columna(), crearXlsx(), Hoja, hojaXml(), neutralizar(), xml()

### Community 61 - "Pruebas E2E de paradas"
Cohesion: 0.33
Nodes (4): read-excel-file@9.3.14, read-excel-file, ir(), motivo()

### Community 63 - "Consultas de identidad"
Cohesion: 0.29
Nodes (4): CuentaFila, LectorIdentidad, MiPerfil, PersonaFila

### Community 65 - "Sesion y paginas protegidas (2)"
Cohesion: 0.50
Nodes (3): csp, nextConfig, securityHeaders

## Knowledge Gaps
- **34 isolated node(s):** `UNIQUE (empresa_id, id_importacion) para importar sin duplicar`, `Reportes diario (PDF) y mensual (Excel)`, `Umbral por vencer configurable (porcentaje, horas o dias)`, `Indices unicos parciales garantizan una cubierta por posicion`, `Exportaciones PDF, Excel, JSON` (+29 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 357 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `Sesion y paginas protegidas` to `Navegacion e iconos`, `Fechas y empresas`, `Componentes UI y modales`, `Paginas de equipos`, `UI modales de mantenimiento`, `Layout, perfil y clave`, `Acciones de trabajos`, `Listado de paradas`, `Catalogos`, `Dependencias de desarrollo`, `Variables de entorno`, `UI modales de mantenimiento (2)`, `Supabase server y errores`, `Acciones de preventivos`, `UI modales de mantenimiento (3)`, `Login`, `Detalle de preventivo`, `Acciones de equipos (2)`, `Errores de dominio y personal (2)`, `Listado de preventivos`, `Dependencias de produccion`, `Detalle de parada`, `Providers de la app`, `Sesion y paginas protegidas (2)`?**
  _High betweenness centrality (0.081) - this node is a cross-community bridge._
- **What connects `UNIQUE (empresa_id, id_importacion) para importar sin duplicar`, `Reportes diario (PDF) y mensual (Excel)`, `Umbral por vencer configurable (porcentaje, horas o dias)` to the rest of the system?**
  _34 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Navegacion e iconos` be split into smaller, more focused modules?**
  _Cohesion score 0.06151062867480778 - nodes in this community are weakly interconnected._
- **Why does `Result` connect `Identidad contratos y repositorios` to `Fechas y empresas`, `Errores de dominio y personal`, `Casos de uso de plataforma`, `Estados y permisos de trabajos`, `Repositorio de paradas`, `Acciones de trabajos`, `Listado de paradas`, `Repositorio de preventivos`, `Variables de entorno`, `UI modales de mantenimiento (2)`, `Acciones de equipos`, `Casos de uso de equipos`, `Importacion de equipos Excel`, `Supabase server y errores`, `Repositorio de preventivos (2)`, `Firmas y fotos`, `Cierre de paradas`, `Acciones de preventivos`, `Casos de uso de preventivos`, `Catalogos (2)`, `Consultas de identidad`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **Should `Fechas y empresas` be split into smaller, more focused modules?**
  _Cohesion score 0.06965174129353234 - nodes in this community are weakly interconnected._
- **Why does `react` connect `Layout, perfil y clave` to `Navegacion e iconos`, `Fechas y empresas`, `Componentes UI y modales`, `Paginas de equipos`, `Detalle de preventivo`, `Sesion y paginas protegidas`, `UI modales de mantenimiento`, `Listado de paradas`, `Dependencias de desarrollo`, `Listado de preventivos`, `UI modales de mantenimiento (2)`, `Dependencias de produccion`, `Detalle de parada`, `Providers de la app`, `Componentes UI y modales (2)`, `UI modales de mantenimiento (3)`, `Login`?**
  _High betweenness centrality (0.040) - this node is a cross-community bridge._
- **Should `Componentes UI y modales` be split into smaller, more focused modules?**
  _Cohesion score 0.0925589836660617 - nodes in this community are weakly interconnected._
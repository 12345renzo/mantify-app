# Graph Report - mantify-app  (2026-11-25)

## Corpus Check
- 264 files · ~145,240 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 6 file(s) not represented in the graph (top: (none) 4, .ico 1, .css 1)

## Summary
- 1839 nodes · 6651 edges · 87 communities (77 shown, 10 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 111 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4347e2d1`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- planes/page.tsx
- mensajeError
- modal-persona.tsx
- equipos/[id]/page.tsx
- modales-neumatico.tsx
- panel/page.tsx
- Casos de uso de plataforma
- err
- Estados y permisos de trabajos
- ParadasRepositorio
- iconos.tsx
- FormFirma
- Acciones de trabajos
- paradas/page.tsx
- Catalogos
- Dependencias de desarrollo
- trabajos-repositorio.ts
- Variables de entorno
- paradas/actions.ts
- neumaticos/application/repositorios.ts
- equipos/domain/importacion.ts
- trabajos/application/casos-uso.ts
- aDomainError
- preventivos/application/casos-uso.ts
- fotos.ts
- Importacion y duracion de paradas
- Tipos de base de datos
- paradas/application/casos-uso.ts
- Configuracion TypeScript
- personal/page.tsx
- engrase/application/casos-uso.ts
- ok
- Exportacion PDF
- Cortes 07 a 11
- Roadmap y cortes Pro
- permisos.ts
- react
- Casos de uso de preventivos
- Esquemas de preventivos
- fechas.ts
- engrase/application/esquemas.ts
- Flujo correctivo (docs)
- equipos/actions.ts
- Casos de uso de preventivos (2)
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
- Pruebas E2E de trabajos
- neumaticos/application/esquemas.ts
- Pruebas E2E de paradas
- Pruebas E2E de paradas (2)
- server.ts
- Lector de trabajos
- Sesion y paginas protegidas (2)
- AGENTS.md
- paradas.test.ts
- README
- Config MCP
- Tareas: Corte 9 — Neumáticos
- engrase-repositorio.ts
- Spec: Mantify — Corte 9: Neumáticos — V1
- diario/route.ts
- neumaticos/application/casos-uso.ts
- Plan de implementación: Corte 8 — Engrase
- estilos.ts
- FechaISO
- neumaticos.test.ts
- LectorNeumaticos
- eslint.config.mjs
- neumaticos.spec.ts
- engrase.spec.ts
- boton-persona.tsx
- LectorPreventivos
- LectorIdentidad

## God Nodes (most connected - your core abstractions)
1. `ok()` - 120 edges
2. `err()` - 116 edges
3. `DomainError` - 115 edges
4. `Result` - 112 edges
5. `obtenerActor` - 74 edges
6. `exigirPermiso()` - 58 edges
7. `react` - 56 edges
8. `Modal()` - 54 edges
9. `next` - 51 edges
10. `hoyEn()` - 49 edges

## Surprising Connections (you probably didn't know these)
- `3.2 Reglas de dominio (puras)` --references--> `saludCubierta()`  [INFERRED]
  SPEC-corte9-neumaticos.md → src/modules/neumaticos/domain/salud.ts
- `2. Lo que ya existe (cortes 1 a 8)` --references--> `parsearHorometro()`  [INFERRED]
  SPEC-corte9-neumaticos.md → src/modules/equipos/domain/horometro.ts
- `2. Lo que ya existe (cortes 1 a 8)` --references--> `hoyEn()`  [INFERRED]
  SPEC-corte9-neumaticos.md → src/shared/kernel/fechas.ts
- `7. Estilo de código` --references--> `Result`  [INFERRED]
  SPEC-corte9-neumaticos.md → src/shared/kernel/result.ts
- `7. Estilo de código` --references--> `Result`  [INFERRED]
  SPEC.md → src/shared/kernel/result.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Ciclo correctivo** — cortes_05_backlogs_ot_rm_firmas_flujo_correctivo, cortes_05_backlogs_ot_rm_firmas_maquina_estados, cortes_05_backlogs_ot_rm_firmas_firmas [EXTRACTED 1.00]
- **Flujo sin senal Pro** — cortes_12_sin_senal_pro_electricsql, cortes_12_sin_senal_pro_conflictos_version, cortes_12_sin_senal_pro_cola_offline [EXTRACTED 1.00]

## Communities (87 total, 10 thin omitted)

### Community 0 - "planes/page.tsx"
Cohesion: 0.06
Nodes (57): AppShell(), MenuCargando(), MenuConRuta(), MenuModulos(), SENAL, ShellContexto, Ubicacion(), cambiarClaveAction() (+49 more)

### Community 1 - "mensajeError"
Cohesion: 0.11
Nodes (26): CAMPOS_EMPRESA, crearEmpresaAction(), darDeBajaAction(), editarEmpresaAction(), EstadoFormulario, primerError(), renovarEmpresaAction(), valoresDe() (+18 more)

### Community 2 - "modal-persona.tsx"
Cohesion: 0.22
Nodes (11): crearPersonaAction(), EstadoIdentidad, FormularioPersona(), ModalPersona(), Campo(), CamposPersona(), Props, EstadoFormularioCuenta (+3 more)

### Community 3 - "equipos/[id]/page.tsx"
Cohesion: 0.13
Nodes (30): CatalogosPage(), Contenido(), metadata, EngrasePage(), esEstado(), Lista(), metadata, uno() (+22 more)

### Community 4 - "modales-neumatico.tsx"
Cohesion: 0.13
Nodes (41): Mapa(), MapaPage(), metadata, CubiertaPage(), Dato(), Detalle(), metadata, Accion (+33 more)

### Community 5 - "panel/page.tsx"
Cohesion: 0.12
Nodes (34): BotonNuevaEmpresa(), BotonNuevaEmpresaCargando(), Dato(), Detalle(), EmpresaPage(), metadata, Campo(), ModalNuevaEmpresa() (+26 more)

### Community 6 - "Casos de uso de plataforma"
Cohesion: 0.08
Nodes (23): resolverPersonaParaCuenta(), PersonasRepositorio, ServicioAuth, cambiarPrecioPlan(), crearEmpresa(), darDeBajaEmpresa(), editarEmpresa(), renovarEmpresa() (+15 more)

### Community 7 - "err"
Cohesion: 0.13
Nodes (33): 7. Estilo de código, 7. Estilo de código, unaFila(), cambiarClave(), cambiarRolCuenta(), CuentaCreada, darDeBajaPersona(), editarPersona() (+25 more)

### Community 8 - "Estados y permisos de trabajos"
Cohesion: 0.10
Nodes (20): puedeValidar(), crearBacklogSchema, ContextoTransicion, Criticidad, EstadoBacklog, ESTADOS_BACKLOG, EventoBacklog, EVENTOS (+12 more)

### Community 9 - "ParadasRepositorio"
Cohesion: 0.29
Nodes (4): DatosCierre, DatosInicio, ParadasRepositorio, FilaParada

### Community 10 - "iconos.tsx"
Cohesion: 0.10
Nodes (29): Modulos(), NAVEGACION, navegacionPara(), ROLES_EMPRESA, SOLO_SUPERADMIN, veItem(), LoginPage(), metadata (+21 more)

### Community 11 - "FormFirma"
Cohesion: 0.50
Nodes (3): FormFirma(), elegir(), prepararFirma()

### Community 12 - "Acciones de trabajos"
Cohesion: 0.22
Nodes (29): abrirOtAction(), CAMPOS_BACKLOG, cerrarReporteAction(), crearBacklogAction(), editarBacklogAction(), errorTrabajo(), estadoRequisicionAction(), fotosDe() (+21 more)

### Community 13 - "paradas/page.tsx"
Cohesion: 0.24
Nodes (16): Abiertas(), Contenido(), Diario(), metadata, nf, ParadasPage(), Params, Ranking() (+8 more)

### Community 14 - "Catalogos"
Cohesion: 0.09
Nodes (33): cambiarActivoAction(), EstadoCatalogo, guardarElementoAction(), primerError(), valoresDe(), CambiarActivoEntrada, cambiarActivoSchema, catalogoSchema (+25 more)

### Community 15 - "Dependencias de desarrollo"
Cohesion: 0.14
Nodes (19): devDependencies, prettier@^3.10.1, tailwindcss@4.3.3, @tailwindcss/turbopack@4.3.3, @types/node@^22.20.5, @types/react@^19, @types/react-dom@^19, typescript@^5 (+11 more)

### Community 16 - "trabajos-repositorio.ts"
Cohesion: 0.17
Nodes (15): crearLectorParadas(), crearLectorPreventivos(), crearPreventivosRepositorio(), fila(), FilaBase, num(), referencias(), columnas() (+7 more)

### Community 17 - "Variables de entorno"
Cohesion: 0.14
Nodes (16): @supabase/ssr, @supabase/supabase-js, register(), crearServicioAuth(), errorAuth(), config, PROTEGIDAS, proxy() (+8 more)

### Community 18 - "paradas/actions.ts"
Cohesion: 0.13
Nodes (17): EstadoImportacion, EstadoParada, importarAction(), MENSAJES, MENSAJES_ARCHIVO, LIMITES_IMPORTACION, importarParadas(), ResumenImportacion (+9 more)

### Community 19 - "neumaticos/application/repositorios.ts"
Cohesion: 0.09
Nodes (20): DesmontarEntrada, MedirEntrada, MontarEntrada, NeumaticoEntrada, RecaparEntrada, RotarEntrada, EquipoNeumaticos, EstadoNeumatico (+12 more)

### Community 20 - "equipos/domain/importacion.ts"
Cohesion: 0.06
Nodes (38): fflate, vitest, DatosEquipo, importarEquipos(), MOTIVO_BASE, EquipoDetalle, EquipoFila, EquiposRepositorio (+30 more)

### Community 21 - "trabajos/application/casos-uso.ts"
Cohesion: 0.11
Nodes (25): Repos, subirTodas(), VistaTrabajo, AbrirOtEntrada, abrirOtSchema, CerrarReporteEntrada, CrearBacklogEntrada, datosBacklog (+17 more)

### Community 22 - "aDomainError"
Cohesion: 0.22
Nodes (12): crearEquiposRepositorio(), crearLectorEquipos(), lectorExcel, Personal, nombreCompleto(), reposIdentidad(), crearLectorIdentidad(), crearPersonasRepositorio() (+4 more)

### Community 23 - "preventivos/application/casos-uso.ts"
Cohesion: 0.11
Nodes (26): MOTIVO_BASE, VistaPreventivo, BacklogObservacionEntrada, EjecutarEntrada, id, ProgramarEntrada, ReprogramarEntrada, ValidarPreventivoEntrada (+18 more)

### Community 24 - "fotos.ts"
Cohesion: 0.31
Nodes (9): ascii(), MAX_BYTES_IMAGEN, MAX_LADO, medidasImagen(), MIN_FIRMA, tipoImagen(), u16(), u32() (+1 more)

### Community 25 - "Importacion y duracion de paradas"
Cohesion: 0.17
Nodes (18): aMs(), duracionHoras(), esFechaHora(), ALIAS, Campo, clave(), ErrorFila, fechaHora() (+10 more)

### Community 26 - "Tipos de base de datos"
Cohesion: 0.10
Nodes (15): LectorParadas, crearParadasRepositorio(), FilaReporte, num(), parada(), CompositeTypes, Constants, Database (+7 more)

### Community 27 - "paradas/application/casos-uso.ts"
Cohesion: 0.17
Nodes (22): aplicarRevision(), backlogDesdeHallazgo(), cerrarParada(), contexto(), iniciarParada(), MAX_DIAS_REPORTE, MOTIVO_BASE, noEncontrada() (+14 more)

### Community 28 - "Configuracion TypeScript"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 29 - "personal/page.tsx"
Cohesion: 0.18
Nodes (21): CuentasEmpresa(), cambiarRolAction(), FormPersona(), FormRol(), ModalEditarPersona(), ModalRolCuenta(), Pie(), useModal() (+13 more)

### Community 30 - "engrase/application/casos-uso.ts"
Cohesion: 0.08
Nodes (37): configurarAvisoEngrase(), guardarPlanEngrase(), invalido(), registrarEngrase(), AvisoEntrada, PlanEntrada, RegistroEntrada, EmpresaEngrase (+29 more)

### Community 31 - "ok"
Cohesion: 0.19
Nodes (22): cambiarActivoElemento(), guardarElemento(), listarCatalogo(), armarFilas(), contexto(), listarEngrase(), verEngrase(), listarEquipos() (+14 more)

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
Cohesion: 0.15
Nodes (14): Accion, ESCRIBIR, ETIQUETA_ROL, LEER, MATRIZ, Recurso, Rol, ROLES (+6 more)

### Community 36 - "react"
Cohesion: 0.12
Nodes (30): next, react, Encabezado(), Contenido(), InicioPage(), metadata, metadata, nf (+22 more)

### Community 37 - "Casos de uso de preventivos"
Cohesion: 0.26
Nodes (14): contexto(), ejecutarPreventivo(), generarBacklogDesdeObservacion(), noEncontrado(), programarPreventivo(), reprogramarPreventivo(), validarPreventivo(), verPreventivo() (+6 more)

### Community 38 - "Esquemas de preventivos"
Cohesion: 0.15
Nodes (12): CAMPOS_PROGRAMAR, EstadoImportacion, EstadoPreventivo, json(), MENSAJES, MENSAJES_ARCHIVO, ResumenImportacion, backlogObservacionSchema (+4 more)

### Community 39 - "fechas.ts"
Cohesion: 0.24
Nodes (10): importarPreventivos(), ALIAS, Campo, clave(), ErrorFila, fecha(), leerCsv(), LIMITES_CSV (+2 more)

### Community 40 - "engrase/application/esquemas.ts"
Cohesion: 0.11
Nodes (19): avisoSchema, cadaDias, cadaHoras, MAX_PUNTOS, planSchema, registroSchema, vacioANulo, RANGO_AVISO (+11 more)

### Community 41 - "Flujo correctivo (docs)"
Cohesion: 0.14
Nodes (14): Nadie valida su propio cierre, salvo planificador autorizado, Codigos secuenciales BKL-, OT-AAAA-, RM-AAAA- (siguiente_codigo), Firmas: sin firma no se cierra; reabrir las invalida, Flujo correctivo: backlog, OT, RM, validacion, Cierre con clave de idempotencia y bloqueo de fila, Maquina de estados transicionar(estado, evento, rol, esPropio), Requisicion (RQ) con prefijo de empresa, Actividad OBSERVADO genera backlog origen PREVENTIVO (+6 more)

### Community 42 - "equipos/actions.ts"
Cohesion: 0.11
Nodes (31): CAMPOS, crearEquipoAction(), editarEquipoAction(), errorEquipo(), EstadoEquipo, lecturaAction(), MENSAJES_ARCHIVO, MENSAJES_LECTURA (+23 more)

### Community 43 - "Casos de uso de preventivos (2)"
Cohesion: 0.18
Nodes (11): duracionHoras(), HORA, minutos(), DIAS_ALERTA, enAlerta(), estaVencido(), horometroEnAlerta(), MARGEN_HORAS (+3 more)

### Community 44 - "Membresia (docs)"
Cohesion: 0.16
Nodes (12): Funcion empresa_activa() usada por RLS, Bloqueo de login 3 intentos / 30 s en memoria, Membresia 30 dias con 3 de gracia y estados AL_DIA..INACTIVA, Modulo plataforma (superadmin), Pagos manuales registrados por superadmin, Validacion de RUC de 11 digitos unico, Cupo de cuentas por plan: Estandar 10, Pro 25, Matriz de permisos puede(rol, accion, recurso) (+4 more)

### Community 45 - "personal/actions.ts"
Cohesion: 0.17
Nodes (17): zod, EstadoClave, asignarPersonaAction(), CAMPOS_PERSONA, crearCuentaAction(), editarPersonaAction(), leerPersona(), MENSAJES_CUENTA (+9 more)

### Community 46 - "fechas.ts"
Cohesion: 0.21
Nodes (19): 2. Lo que ya existe (cortes 1 a 7), AccionesFila(), FormBaja(), FormEditar(), FormRenovar(), Pie(), calcularEstadoMembresia(), DIAS_AVISO_POR_VENCER (+11 more)

### Community 47 - "neumaticos/actions.ts"
Cohesion: 0.20
Nodes (23): campos(), desmontarAction(), ejecutar(), errorNeumatico(), EstadoNeumaticoForm, guardarNeumaticoAction(), medirAction(), MENSAJES (+15 more)

### Community 48 - "modales-preventivo.tsx"
Cohesion: 0.05
Nodes (125): BotonActivo(), CampoFormulario(), FormActivo(), FormElemento(), ModalElemento(), OpcionCategoria, configurarAvisoAction(), errorEngrase() (+117 more)

### Community 49 - "trabajos/[id]/page.tsx"
Cohesion: 0.17
Nodes (21): Dato(), Detalle(), Fotos(), metadata, Requisiciones(), Seccion(), TrabajoPage(), Bandeja() (+13 more)

### Community 50 - "Estandares y base (docs)"
Cohesion: 0.22
Nodes (11): Capas por modulo: domain, application, infrastructure, ui, CI: lint, tipos, pruebas, npm audit, Dependabot, DomainError con codigo y Result, Next.js App Router + Tailwind + Vitest + Playwright + Supabase CLI, Autenticacion Supabase Auth sin MFA, Autorizacion: RLS denegar por defecto y doble barrera, Calidad de codigo senior (TS estricto, ADR), Guardia defineAction / defineRoute (pipeline de 11 pasos) (+3 more)

### Community 51 - "Catalogos y equipos (docs)"
Cohesion: 0.19
Nodes (11): Catalogos editables por empresa con seeds, categorias_equipo con tipo_medidor y nombre_flota, Regla: catalogo en uso se desactiva, no se borra, Correccion a la baja solo planificador con motivo y auditoria, Equipos: estado_operativo y estado_movilizacion, Horometro solo sube (dominio + trigger), Importacion Excel de equipos con errores por fila, Engrase: estados calculados al leer (+3 more)

### Community 52 - "Dependencias de produccion"
Cohesion: 0.17
Nodes (12): dependencies, fflate@0.8.3, lucide-react@^1.75.0, next@16.4.6, react@19.3.0, react-dom@19.3.0, server-only@^0.0.1, @supabase/ssr@^0.12.7 (+4 more)

### Community 53 - "engrase/page.tsx"
Cohesion: 0.25
Nodes (13): Detalle(), EngraseEquipoPage(), metadata, Medidor, EstadoEngrase, TipoAviso, ESTADO_ENGRASE, formatoFrecuencia() (+5 more)

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

### Community 59 - "Pruebas E2E de trabajos"
Cohesion: 0.31
Nodes (4): firmaDesdePerfil(), registrarFirma(), jpg(), png()

### Community 60 - "neumaticos/application/esquemas.ts"
Cohesion: 0.12
Nodes (18): decimal(), desmontarSchema, DESTINOS, id, medida, medirSchema, neumaticoSchema, posicionesSchema (+10 more)

### Community 61 - "Pruebas E2E de paradas"
Cohesion: 0.33
Nodes (4): read-excel-file@9.3.14, read-excel-file, ir(), motivo()

### Community 63 - "server.ts"
Cohesion: 0.18
Nodes (12): server-only, crearCatalogosRepositorio(), DetalleEmpresa, EmpresaResumen, ESTADOS_MEMBRESIA, aPlan(), crearLectorPlataforma(), FilaPlan (+4 more)

### Community 65 - "Sesion y paginas protegidas (2)"
Cohesion: 0.50
Nodes (3): csp, nextConfig, securityHeaders

### Community 67 - "paradas.test.ts"
Cohesion: 0.13
Nodes (20): filaDiario(), hojasMensual(), hora(), nf, pdfDiario(), FilaRanking, ParadaRanking, rankingFallas() (+12 more)

### Community 71 - "Tareas: Corte 9 — Neumáticos"
Cohesion: 0.13
Nodes (14): Punto de control A, Punto de control B, Punto de control C, - [ ] T10. Cierre (S), Tareas: Corte 9 — Neumáticos, - [x] T1. Dominio y permisos (M), - [x] T2. Tablas, índices y RLS (M), - [x] T3. Stock de cubiertas (L, en dos pasos) (+6 more)

### Community 72 - "engrase-repositorio.ts"
Cohesion: 0.24
Nodes (8): crearEngraseRepositorio(), crearLectorEngrase(), reposEngrase(), crearLectorNeumaticos(), crearNeumaticosRepositorio(), rpc(), una(), createSupabaseServerClient()

### Community 73 - "Spec: Mantify — Corte 9: Neumáticos — V1"
Cohesion: 0.11
Nodes (18): 10. Límites, 11. Diferencias con el corte 9, 12. Diferido, 13. Decisiones aprobadas, 14. Construido (2026-11-25), 15. Antes de empezar, 1. Objetivo, 2. Lo que ya existe (cortes 1 a 8) (+10 more)

### Community 74 - "diario/route.ts"
Cohesion: 0.26
Nodes (9): descargar(), ESTADO, GET(), GET(), Archivo, exportarDiario(), exportarMensual(), fechaUrl (+1 more)

### Community 75 - "neumaticos/application/casos-uso.ts"
Cohesion: 0.23
Nodes (18): contexto(), desmontarNeumatico(), evaluar(), invalido(), listarNeumaticos(), medirNeumaticos(), montarNeumatico(), operar() (+10 more)

### Community 76 - "Plan de implementación: Corte 8 — Engrase"
Cohesion: 0.29
Nodes (6): Decisiones, Dependencias, Plan de implementación: Corte 9 — Neumáticos, Preguntas abiertas, Resumen, Riesgos

### Community 77 - "estilos.ts"
Cohesion: 0.20
Nodes (13): ErrorPanel(), Dato(), Detalle(), hora(), metadata, nf, ParadaPage(), cabeceraSeccion (+5 more)

### Community 78 - "FechaISO"
Cohesion: 0.15
Nodes (7): DatosEjecucion, DatosProgramacion, PreventivosRepositorio, FilaPreventivo, Recurrencia, siguienteProgramacion(), FechaISO

### Community 79 - "neumaticos.test.ts"
Cohesion: 0.21
Nodes (9): costoPorHora(), PuntoDesgaste, redondear(), AHORA, cubierta(), DE_CATEGORIA, montaje(), repos() (+1 more)

### Community 81 - "eslint.config.mjs"
Cohesion: 0.25
Nodes (7): eslintConfig, eslint@^9, eslint-config-next@16.4.6, eslint-config-prettier@^10.1.8, eslint, eslint-config-next, eslint-config-prettier

### Community 83 - "engrase.spec.ts"
Cohesion: 0.47
Nodes (3): abrirEquipo(), fila(), ir()

### Community 84 - "boton-persona.tsx"
Cohesion: 0.60
Nodes (4): BotonPersona(), Dato(), Estado, Formulario()

## Knowledge Gaps
- **34 isolated node(s):** `UNIQUE (empresa_id, id_importacion) para importar sin duplicar`, `Reportes diario (PDF) y mensual (Excel)`, `Umbral por vencer configurable (porcentaje, horas o dias)`, `Indices unicos parciales garantizan una cubierta por posicion`, `Exportaciones PDF, Excel, JSON` (+29 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 449 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Result` connect `Casos de uso de plataforma` to `panel/page.tsx`, `err`, `Estados y permisos de trabajos`, `ParadasRepositorio`, `Acciones de trabajos`, `Catalogos`, `trabajos-repositorio.ts`, `Variables de entorno`, `paradas/actions.ts`, `neumaticos/application/repositorios.ts`, `equipos/domain/importacion.ts`, `trabajos/application/casos-uso.ts`, `preventivos/application/casos-uso.ts`, `paradas/application/casos-uso.ts`, `engrase/application/casos-uso.ts`, `ok`, `Esquemas de preventivos`, `equipos/actions.ts`, `neumaticos/actions.ts`, `modales-preventivo.tsx`, `TrabajosRepositorio`, `server.ts`, `diario/route.ts`, `neumaticos/application/casos-uso.ts`, `FechaISO`?**
  _High betweenness centrality (0.076) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `DomainError` (e.g. with `7. Estilo de código` and `7. Estilo de código`) actually correct?**
  _`DomainError` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `UNIQUE (empresa_id, id_importacion) para importar sin duplicar`, `Reportes diario (PDF) y mensual (Excel)`, `Umbral por vencer configurable (porcentaje, horas o dias)` to the rest of the system?**
  _34 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `planes/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05926251097453907 - nodes in this community are weakly interconnected._
- **Why does `next` connect `react` to `planes/page.tsx`, `mensajeError`, `equipos/[id]/page.tsx`, `modales-neumatico.tsx`, `panel/page.tsx`, `iconos.tsx`, `Acciones de trabajos`, `paradas/page.tsx`, `Catalogos`, `Dependencias de desarrollo`, `Variables de entorno`, `paradas/actions.ts`, `personal/page.tsx`, `Esquemas de preventivos`, `equipos/actions.ts`, `personal/actions.ts`, `neumaticos/actions.ts`, `modales-preventivo.tsx`, `trabajos/[id]/page.tsx`, `Dependencias de produccion`, `engrase/page.tsx`, `Providers de la app`, `server.ts`, `Sesion y paginas protegidas (2)`, `diario/route.ts`, `estilos.ts`?**
  _High betweenness centrality (0.069) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `Result` (e.g. with `7. Estilo de código` and `7. Estilo de código`) actually correct?**
  _`Result` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Should `mensajeError` be split into smaller, more focused modules?**
  _Cohesion score 0.10887096774193548 - nodes in this community are weakly interconnected._
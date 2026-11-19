# Graph Report - mantify-app  (2026-11-19)

## Corpus Check
- 189 files · ~83,811 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 6 file(s) not represented in the graph (top: (none) 4, .ico 1, .css 1)

## Summary
- 1136 nodes · 3989 edges · 55 communities (49 shown, 6 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 82 edges (avg confidence: 0.82)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Equipos casos de uso
- Supabase y servidor
- Catalogos acciones
- Esquemas de equipos
- Cuenta y equipos acciones
- Personal formularios
- Catalogos pagina
- Navegacion y login
- App shell
- Empresas acciones fila
- Nueva empresa
- Repositorios Supabase
- Ficha de equipo
- Casos de uso plataforma
- Esquemas de trabajos
- Dominio y cortes
- Dependencias dev
- Trabajos acciones
- Sin senal y offline
- Modales de trabajo
- Planes publicos
- Estados de backlog
- Config TypeScript
- Detalle de trabajo
- Consultas plataforma
- Arquitectura base
- Login
- Membresia empresas
- Pagos y reactivacion
- Dependencias runtime
- Pruebas de trabajos
- Estado de empresa
- Catalogos y validacion
- Modales de equipo
- Layout y react-query
- Scripts npm
- Firma
- Bandeja de trabajos
- Crear y editar empresa
- E2E trabajos
- Repositorio trabajos
- Compresion de fotos
- Dashboard y auditoria
- ESLint
- Importar equipos
- Boton persona
- Lector trabajos
- Neumaticos
- Next config y CSP
- Error panel
- Reglas AGENTS
- Playwright
- README
- MCP Supabase

## God Nodes (most connected - your core abstractions)
1. `Result` - 77 edges
2. `ok()` - 77 edges
3. `err()` - 76 edges
4. `DomainError` - 73 edges
5. `obtenerActor` - 46 edges
6. `react` - 44 edges
7. `exigirPermiso()` - 42 edges
8. `empresaDeTrabajo()` - 36 edges
9. `Modal()` - 36 edges
10. `next` - 34 edges

## Surprising Connections (you probably didn't know these)
- `fakes()` --calls--> `ok()`  [EXTRACTED]
  tests/unit/catalogos.test.ts → src/shared/kernel/result.ts
- `repos()` --calls--> `ok()`  [EXTRACTED]
  tests/unit/trabajos.test.ts → src/shared/kernel/result.ts
- `estado()` --calls--> `calcularEstadoMembresia()`  [EXTRACTED]
  tests/unit/plataforma-dominio.test.ts → src/modules/plataforma/domain/estado-membresia.ts
- `Duracion con cruce de medianoche suma 24 h` --semantically_similar_to--> `Paradas con revision al cerrar (revisarCierre)`  [INFERRED] [semantically similar]
  cortes/06-preventivos.md → cortes/07-paradas-reportes.md
- `FormularioClave()` --indirect_call--> `cambiarClaveAction()`  [INFERRED]
  src/app/(app)/cuenta/formulario-clave.tsx → src/app/(app)/cuenta/actions.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Flujo sin senal Pro** — cortes_12_sin_senal_pro_electricsql, cortes_12_sin_senal_pro_conflictos_version, cortes_12_sin_senal_pro_cola_offline [EXTRACTED 1.00]
- **Ciclo correctivo** — cortes_05_backlogs_ot_rm_firmas_flujo_correctivo, cortes_05_backlogs_ot_rm_firmas_maquina_estados, cortes_05_backlogs_ot_rm_firmas_firmas [EXTRACTED 1.00]

## Communities (55 total, 6 thin omitted)

### Community 0 - "Equipos casos de uso"
Cohesion: 0.05
Nodes (95): fflate, unaFila(), cambiarMovilizacion(), crearEquipo(), editarEquipo(), listarEquipos(), registrarLectura(), verEquipo() (+87 more)

### Community 1 - "Supabase y servidor"
Cohesion: 0.06
Nodes (56): server-only, @supabase/ssr, @supabase/supabase-js, register(), crearEquiposRepositorio(), crearLectorEquipos(), FilaEquipo, nombres() (+48 more)

### Community 2 - "Catalogos acciones"
Cohesion: 0.08
Nodes (44): cambiarActivoAction(), EstadoCatalogo, guardarElementoAction(), primerError(), valoresDe(), BotonActivo(), CampoFormulario(), FormActivo() (+36 more)

### Community 3 - "Esquemas de equipos"
Cohesion: 0.05
Nodes (43): campos, CrearEquipoEntrada, crearEquipoSchema, DatosEquipo, EditarEquipoEntrada, editarEquipoSchema, horometro, idOpcional (+35 more)

### Community 4 - "Cuenta y equipos acciones"
Cohesion: 0.10
Nodes (43): cambiarClaveAction(), CuentasEmpresa(), CAMPOS, crearEquipoAction(), editarEquipoAction(), errorEquipo(), EstadoEquipo, lecturaAction() (+35 more)

### Community 5 - "Personal formularios"
Cohesion: 0.12
Nodes (26): EstadoIdentidad, FormularioPersona(), ModalPersona(), FormPersona(), FormRol(), ModalEditarPersona(), ModalRolCuenta(), Pie() (+18 more)

### Community 6 - "Catalogos pagina"
Cohesion: 0.17
Nodes (27): react, CatalogosPage(), Contenido(), metadata, Encabezado(), Esqueleto(), Contenido(), InicioPage() (+19 more)

### Community 7 - "Navegacion y login"
Cohesion: 0.10
Nodes (27): ItemNav, ROLES_EMPRESA, SOLO_SUPERADMIN, LoginPage(), metadata, PUNTOS, CambiarTema(), leerTema() (+19 more)

### Community 8 - "App shell"
Cohesion: 0.14
Nodes (26): AppShell(), MenuCargando(), MenuConRuta(), MenuModulos(), SENAL, ShellContexto, Ubicacion(), EstadoClave (+18 more)

### Community 9 - "Empresas acciones fila"
Cohesion: 0.14
Nodes (24): zod, AccionesFila(), DatosEmpresaFila, FormEditar(), FormReactivar(), Pie(), CAMPOS_EMPRESA, crearEmpresaAction() (+16 more)

### Community 10 - "Nueva empresa"
Cohesion: 0.16
Nodes (24): BotonNuevaEmpresa(), BotonNuevaEmpresaCargando(), ModalNuevaEmpresa(), EmpresasPage(), metadata, TablaEmpresas(), Modulos(), NAVEGACION (+16 more)

### Community 11 - "Repositorios Supabase"
Cohesion: 0.12
Nodes (5): EmpresasRepositorio, DatosBacklog, TrabajosRepositorio, FechaISO, Result

### Community 12 - "Ficha de equipo"
Cohesion: 0.18
Nodes (19): Dato(), EquipoPage(), Ficha(), metadata, opcionesEquipo(), Contenido(), EquiposPage(), metadata (+11 more)

### Community 13 - "Casos de uso plataforma"
Cohesion: 0.15
Nodes (14): vitest, activarDesactivarEmpresa(), cambiarPrecioPlan(), CambiarPrecioEntrada, CambioEstadoEmpresa, DatosEmpresa, EmpresaParaMembresia, MembresiasRepositorio (+6 more)

### Community 14 - "Esquemas de trabajos"
Cohesion: 0.09
Nodes (17): AbrirOtEntrada, abrirOtSchema, CerrarReporteEntrada, clave, CrearBacklogEntrada, EditarBacklogEntrada, editarBacklogSchema, EstadoRequisicionEntrada (+9 more)

### Community 15 - "Dominio y cortes"
Cohesion: 0.14
Nodes (18): categorias_equipo con tipo_medidor y nombre_flota, motivos_parada: MCI no planificado, PM1-PM4 planificados, Equipos: estado_operativo y estado_movilizacion, Horometro solo sube (dominio + trigger), Actividad OBSERVADO genera backlog origen PREVENTIVO, Duracion con cruce de medianoche suma 24 h, Fechas del servidor deciden vencimiento, no el cliente, Preventivos PM1-PM4 con alerta a 7 dias (+10 more)

### Community 16 - "Dependencias dev"
Cohesion: 0.14
Nodes (19): devDependencies, prettier@^3.10.1, tailwindcss@4.3.3, @tailwindcss/turbopack@4.3.3, @types/node@^22.20.5, @types/react@^19, @types/react-dom@^19, typescript@^5 (+11 more)

### Community 17 - "Trabajos acciones"
Cohesion: 0.28
Nodes (19): abrirOtAction(), CAMPOS_BACKLOG, cerrarReporteAction(), crearBacklogAction(), editarBacklogAction(), errorTrabajo(), estadoRequisicionAction(), EstadoTrabajo (+11 more)

### Community 18 - "Sin senal y offline"
Cohesion: 0.15
Nodes (15): Maquina de estados transicionar(estado, evento, rol, esPropio), Cola offline y /api/sync con idempotencia, Conflictos por version: WHERE id AND version, ElectricSQL en Railway, replicacion logica con Supabase, Revisar LICENSE de ElectricSQL antes de empezar, Formulas en domain, no en SQL, Verificacion de plan Pro en el servidor, Cobro manual por transferencia; sin cobro antes de cerrar el corte (+7 more)

### Community 19 - "Modales de trabajo"
Cohesion: 0.33
Nodes (17): FormLectura(), AvisoFirma(), CampoFotos(), Clave(), conFotos(), FormAbrirOt(), FormBacklog(), FormCerrar() (+9 more)

### Community 20 - "Planes publicos"
Cohesion: 0.18
Nodes (15): FUNCIONES, GARANTIAS, metadata, PlanesPage(), TarjetasCargando(), TarjetasPlanes(), aPlan(), leerPlanesActivos() (+7 more)

### Community 21 - "Estados de backlog"
Cohesion: 0.14
Nodes (16): puedeValidar(), ContextoTransicion, Criticidad, EstadoBacklog, ESTADOS_BACKLOG, EventoBacklog, EVENTOS, puedeEditar() (+8 more)

### Community 22 - "Config TypeScript"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 23 - "Detalle de trabajo"
Cohesion: 0.27
Nodes (17): Dato(), Detalle(), Fotos(), metadata, Requisiciones(), Seccion(), TrabajoPage(), BotonRequisicion() (+9 more)

### Community 24 - "Consultas plataforma"
Cohesion: 0.16
Nodes (11): DetalleEmpresa, EmpresaResumen, LectorPlataforma, PagoRegistrado, Plan, DIAS_AVISO_POR_VENCER, empresaActiva(), EstadoMembresia (+3 more)

### Community 25 - "Arquitectura base"
Cohesion: 0.15
Nodes (15): Capas por modulo: domain, application, infrastructure, ui, CI: lint, tipos, pruebas, npm audit, Dependabot, DomainError con codigo y Result, Next.js App Router + Tailwind + Vitest + Playwright + Supabase CLI, Importacion Excel de equipos con errores por fila, Firmas: sin firma no se cierra; reabrir las invalida, Archivos: validacion binaria, 2MB, bucket privado, URL firmada, Autenticacion Supabase Auth sin MFA (+7 more)

### Community 26 - "Login"
Cohesion: 0.21
Nodes (13): cerrarSesion(), iniciarSesion(), ResultadoLogin, BotonIngresar(), ERRORES_URL, LoginForm(), enviar(), loginSchema (+5 more)

### Community 27 - "Membresia empresas"
Cohesion: 0.16
Nodes (13): Funcion empresa_activa() usada por RLS, Bloqueo de login 3 intentos / 30 s en memoria, Membresia 30 dias con 3 de gracia y estados AL_DIA..INACTIVA, Modulo plataforma (superadmin), Pagos manuales registrados por superadmin, Validacion de RUC de 11 digitos unico, Cupo de cuentas por plan: Estandar 10, Pro 25, Matriz de permisos puede(rol, accion, recurso) (+5 more)

### Community 28 - "Pagos y reactivacion"
Cohesion: 0.38
Nodes (11): reactivarEmpresa(), registrarPagoManual(), calcularEstadoMembresia(), calcularFinMembresia(), calcularInicioNuevaMembresia(), aUtc(), diasEntre(), esFechaISO() (+3 more)

### Community 29 - "Dependencias runtime"
Cohesion: 0.14
Nodes (14): dependencies, fflate@0.8.3, lucide-react@^1.75.0, next@16.4.6, react@19.3.0, react-dom@19.3.0, read-excel-file@9.3.14, server-only@^0.0.1 (+6 more)

### Community 30 - "Pruebas de trabajos"
Cohesion: 0.15
Nodes (8): crearBacklogSchema, validarSchema, formatearCodigo(), AHORA, ESTADOS, JPG, repos(), ROLES

### Community 31 - "Estado de empresa"
Cohesion: 0.32
Nodes (10): cambiarEstadoAction(), Aviso(), CambiarEstadoForm(), RegistrarPagoForm(), Dato(), Detalle(), EmpresaPage(), metadata (+2 more)

### Community 32 - "Catalogos y validacion"
Cohesion: 0.22
Nodes (8): Catalogos editables por empresa con seeds, Regla: catalogo en uso se desactiva, no se borra, Correccion a la baja solo planificador con motivo y auditoria, Nadie valida su propio cierre, salvo planificador autorizado, Codigos secuenciales BKL-, OT-AAAA-, RM-AAAA- (siguiente_codigo), Cierre con clave de idempotencia y bloqueo de fila, Requisicion (RQ) con prefijo de empresa, Hito 1 (cortes 0-5)

### Community 33 - "Modales de equipo"
Cohesion: 0.29
Nodes (9): BotonMovilizacion(), FormEquipo(), FormMovilizacion(), ModalEquipo(), ModalLectura(), opciones(), boton, Estado (+1 more)

### Community 34 - "Layout y react-query"
Cohesion: 0.24
Nodes (7): @tanstack/react-query@^5.108.0, @tanstack/react-query, geistMono, geistSans, metadata, RootLayout(), QueryProvider()

### Community 35 - "Scripts npm"
Cohesion: 0.20
Nodes (10): scripts, build, dev, format, format:check, lint, start, test (+2 more)

### Community 36 - "Firma"
Cohesion: 0.31
Nodes (8): guardarFirmaAction(), miFirmaAction(), FormFirma(), elegir(), ModalFirma(), PanelFirma(), prepararFirma(), TIPOS

### Community 37 - "Bandeja de trabajos"
Cohesion: 0.36
Nodes (9): Bandeja(), esVista(), metadata, TrabajosPage(), uno(), VISTAS, sanearBusqueda(), atraso() (+1 more)

### Community 38 - "Crear y editar empresa"
Cohesion: 0.33
Nodes (6): crearEmpresa(), editarEmpresa(), CrearEmpresaEntrada, EditarEmpresaEntrada, validarRuc(), crearSlugEmpresa()

### Community 39 - "E2E trabajos"
Cohesion: 0.31
Nodes (4): firmaDesdePerfil(), registrarFirma(), jpg(), png()

### Community 40 - "Repositorio trabajos"
Cohesion: 0.22
Nodes (7): datosBacklog, BacklogDetalle, BacklogFila, EstadoRequisicion, OpcionesTrabajo, VistaBandeja, TipoImagen

### Community 41 - "Compresion de fotos"
Cohesion: 0.36
Nodes (8): ascii(), MAX_LADO, medidasImagen(), MIN_FIRMA, tipoImagen(), u16(), u32(), u32le()

### Community 42 - "Dashboard y auditoria"
Cohesion: 0.29
Nodes (6): Flujo correctivo: backlog, OT, RM, validacion, Bandeja de pendientes ordenada por urgencia, Exportaciones PDF, Excel, JSON, Respaldo de empresa por superadmin con reautenticacion, Auditoria por trigger, solo insercion, Notificaciones: validacion, devuelto, membresia

### Community 43 - "ESLint"
Cohesion: 0.25
Nodes (7): eslintConfig, eslint@^9, eslint-config-next@16.4.6, eslint-config-prettier@^10.1.8, eslint, eslint-config-next, eslint-config-prettier

### Community 44 - "Importar equipos"
Cohesion: 0.43
Nodes (6): EstadoImportacion, importarAction(), Cifra(), COLUMNAS, FormImportar(), ModalImportar()

### Community 45 - "Boton persona"
Cohesion: 0.38
Nodes (5): BotonPersona(), Dato(), Estado, Formulario(), IconoCerrar

### Community 47 - "Neumaticos"
Cohesion: 0.40
Nodes (5): Indices unicos parciales garantizan una cubierta por posicion, Neumaticos: montaje, medicion, rotacion, recapado, Proyeccion de desgaste (Pro, implementada aqui), Salud de cubierta: cambiar, alerta, medir, OK, Indicadores Pro: disponibilidad, MTTR, MTBF, Pareto

### Community 48 - "Next config y CSP"
Cohesion: 0.40
Nodes (4): csp, nextConfig, securityHeaders, next

### Community 49 - "Error panel"
Cohesion: 0.67
Nodes (3): ErrorPanel(), tarjeta, IconoParada

## Knowledge Gaps
- **34 isolated node(s):** `Next.js agent rules (breaking changes, read node_modules docs)`, `Next.js agent feedback reporting pass`, `create-next-app boilerplate (Next.js, Geist, Vercel)`, `Logs y observabilidad`, `Next.js App Router + Tailwind + Vitest + Playwright + Supabase CLI` (+29 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 264 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Result` connect `Repositorios Supabase` to `Equipos casos de uso`, `Supabase y servidor`, `Catalogos acciones`, `Esquemas de equipos`, `Crear y editar empresa`, `Repositorio trabajos`, `Casos de uso plataforma`, `Trabajos acciones`, `Estados de backlog`, `Consultas plataforma`, `Pagos y reactivacion`?**
  _High betweenness centrality (0.071) - this node is a cross-community bridge._
- **What connects `Next.js agent rules (breaking changes, read node_modules docs)`, `Next.js agent feedback reporting pass`, `create-next-app boilerplate (Next.js, Geist, Vercel)` to the rest of the system?**
  _34 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Equipos casos de uso` be split into smaller, more focused modules?**
  _Cohesion score 0.05404055538907202 - nodes in this community are weakly interconnected._
- **Why does `next` connect `Next config y CSP` to `Supabase y servidor`, `Catalogos acciones`, `Cuenta y equipos acciones`, `Personal formularios`, `Catalogos pagina`, `Navegacion y login`, `App shell`, `Empresas acciones fila`, `Nueva empresa`, `Ficha de equipo`, `Dependencias dev`, `Trabajos acciones`, `Planes publicos`, `Detalle de trabajo`, `Login`, `Dependencias runtime`, `Estado de empresa`, `Layout y react-query`, `Bandeja de trabajos`, `Importar equipos`?**
  _High betweenness centrality (0.070) - this node is a cross-community bridge._
- **Should `Supabase y servidor` be split into smaller, more focused modules?**
  _Cohesion score 0.055077452667814115 - nodes in this community are weakly interconnected._
- **Why does `react` connect `Catalogos pagina` to `Catalogos acciones`, `Cuenta y equipos acciones`, `Personal formularios`, `Navegacion y login`, `App shell`, `Empresas acciones fila`, `Nueva empresa`, `Ficha de equipo`, `Dependencias dev`, `Modales de trabajo`, `Planes publicos`, `Detalle de trabajo`, `Login`, `Dependencias runtime`, `Estado de empresa`, `Modales de equipo`, `Layout y react-query`, `Firma`, `Bandeja de trabajos`, `Importar equipos`, `Boton persona`, `Error panel`?**
  _High betweenness centrality (0.053) - this node is a cross-community bridge._
- **Should `Catalogos acciones` be split into smaller, more focused modules?**
  _Cohesion score 0.07923497267759563 - nodes in this community are weakly interconnected._
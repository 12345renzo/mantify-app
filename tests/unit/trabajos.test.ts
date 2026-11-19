import { describe, expect, it } from "vitest";
import {
  abrirOrdenTrabajo,
  cerrarReporte,
  crearBacklog,
  editarBacklog,
  guardarMiFirma,
  validarTrabajo,
  verTrabajo,
} from "@/modules/trabajos/application/casos-uso";
import {
  cerrarReporteSchema,
  crearBacklogSchema,
  validarSchema,
} from "@/modules/trabajos/application/esquemas";
import type {
  BacklogDetalle,
  LectorTrabajos,
  TrabajosRepositorio,
} from "@/modules/trabajos/application/repositorios";
import {
  EVENTOS,
  ESTADOS_BACKLOG,
  eventosDisponibles,
  puedeEditar,
  transicionar,
  type EstadoBacklog,
  type EventoBacklog,
} from "@/modules/trabajos/domain/backlog-estado";
import { atraso, ordenarBandeja } from "@/modules/trabajos/domain/bandeja";
import { formatearCodigo } from "@/modules/trabajos/domain/codigos";
import { medidasImagen, tipoImagen } from "@/modules/trabajos/domain/fotos";
import { puedeCerrar } from "@/modules/trabajos/domain/reglas-cierre";
import type { Actor } from "@/shared/kernel/actor";
import { ok } from "@/shared/kernel/result";
import { jpg, png } from "../imagenes";

const ESTADOS = Object.keys(ESTADOS_BACKLOG) as EstadoBacklog[];
const ROLES = [
  "PLANIFICADOR",
  "SUPERVISOR",
  "TECNICO",
  "GERENTE",
  "SUPERADMIN",
  null,
];

// Tabla escrita a mano a partir del corte 5, independiente de la implementación.
function esperado(
  estado: EstadoBacklog,
  evento: EventoBacklog,
  rol: string | null,
  esPropio: boolean,
  planValida: boolean,
): EstadoBacklog | "FORBIDDEN" | "CONFLICT" {
  const validador =
    rol === "SUPERVISOR" || (rol === "PLANIFICADOR" && planValida);
  const permitido = {
    ABRIR_OT: rol === "PLANIFICADOR" || rol === "SUPERVISOR",
    CERRAR_RM:
      rol === "PLANIFICADOR" || rol === "SUPERVISOR" || rol === "TECNICO",
    APROBAR: validador && (!esPropio || rol === "PLANIFICADOR"),
    DEVOLVER: validador && (!esPropio || rol === "PLANIFICADOR"),
    REABRIR: validador,
  }[evento];
  if (!permitido) return "FORBIDDEN";
  const t = {
    ABRIR_OT: ["PENDIENTE", "EN_PROCESO"],
    CERRAR_RM: ["EN_PROCESO", "PENDIENTE_VALIDACION"],
    APROBAR: ["PENDIENTE_VALIDACION", "COMPLETADO"],
    DEVOLVER: ["PENDIENTE_VALIDACION", "EN_PROCESO"],
    REABRIR: ["COMPLETADO", "EN_PROCESO"],
  }[evento] as [EstadoBacklog, EstadoBacklog];
  return estado === t[0] ? t[1] : "CONFLICT";
}

describe("transicionar: cada estado × evento × rol × propio × autorización", () => {
  for (const estado of ESTADOS)
    for (const evento of EVENTOS)
      for (const rol of ROLES)
        for (const esPropio of [false, true])
          for (const planValida of [false, true]) {
            const quiere = esperado(estado, evento, rol, esPropio, planValida);
            it(`${estado} ${evento} ${rol} propio=${esPropio} plan=${planValida} → ${quiere}`, () => {
              const r = transicionar(estado, evento, rol, {
                esPropio,
                planificadorPuedeValidar: planValida,
              });
              if (r.ok) expect(r.value).toBe(quiere);
              else expect(r.error.code).toBe(quiere);
            });
          }

  it("auto-validación: el supervisor que cerró no valida; el planificador autorizado sí", () => {
    const ctx = { esPropio: true, planificadorPuedeValidar: true };
    const sup = transicionar(
      "PENDIENTE_VALIDACION",
      "APROBAR",
      "SUPERVISOR",
      ctx,
    );
    expect(!sup.ok && sup.error.message).toBe("propio_cierre");
    expect(
      transicionar("PENDIENTE_VALIDACION", "APROBAR", "PLANIFICADOR", ctx).ok,
    ).toBe(true);
    expect(
      transicionar("PENDIENTE_VALIDACION", "APROBAR", "PLANIFICADOR", {
        ...ctx,
        planificadorPuedeValidar: false,
      }).ok,
    ).toBe(false);
  });

  it("eventosDisponibles muestra solo lo posible", () => {
    const ctx = { esPropio: false, planificadorPuedeValidar: false };
    expect(eventosDisponibles("PENDIENTE", "SUPERVISOR", ctx)).toEqual([
      "ABRIR_OT",
    ]);
    expect(
      eventosDisponibles("PENDIENTE_VALIDACION", "SUPERVISOR", ctx),
    ).toEqual(["APROBAR", "DEVOLVER"]);
    expect(
      eventosDisponibles("PENDIENTE_VALIDACION", "PLANIFICADOR", ctx),
    ).toEqual([]);
    expect(eventosDisponibles("COMPLETADO", "TECNICO", ctx)).toEqual([]);
    expect(eventosDisponibles("EN_PROCESO", "GERENTE", ctx)).toEqual([]);
  });
});

describe("puedeEditar", () => {
  const ctx = { planificadorPuedeValidar: false };
  it("abierto: planificador, supervisor o el técnico creador, sin motivo", () => {
    expect(puedeEditar("PENDIENTE", "TECNICO", true, ctx)).toEqual({
      permitido: true,
      exigeMotivo: false,
    });
    expect(puedeEditar("EN_PROCESO", "TECNICO", false, ctx).permitido).toBe(
      false,
    );
    expect(puedeEditar("EN_PROCESO", "SUPERVISOR", false, ctx).permitido).toBe(
      true,
    );
    expect(puedeEditar("PENDIENTE", "GERENTE", true, ctx).permitido).toBe(
      false,
    );
  });
  it("cerrado: solo validador y con motivo", () => {
    expect(puedeEditar("COMPLETADO", "SUPERVISOR", false, ctx)).toEqual({
      permitido: true,
      exigeMotivo: true,
    });
    expect(puedeEditar("COMPLETADO", "PLANIFICADOR", true, ctx).permitido).toBe(
      false,
    );
    expect(
      puedeEditar("PENDIENTE_VALIDACION", "PLANIFICADOR", true, {
        planificadorPuedeValidar: true,
      }).permitido,
    ).toBe(true);
    expect(puedeEditar("COMPLETADO", "TECNICO", true, ctx).permitido).toBe(
      false,
    );
  });
});

describe("puedeCerrar", () => {
  const tec = { id: "u1", rol: "TECNICO", personaId: "p1", tieneFirma: true };
  const trabajo = {
    estado: "EN_PROCESO" as const,
    ot: { responsableId: "p1", abierta: true },
    fotosDespues: 0,
  };
  const emp = { planificadorPuedeValidar: false };
  const motivo = (r: ReturnType<typeof puedeCerrar>) =>
    r.ok ? "ok" : r.error.message;

  it("el técnico responsable con firma cierra", () => {
    expect(motivo(puedeCerrar(tec, trabajo, emp, 3))).toBe("ok");
  });
  it("sin OT no pasa a validación", () => {
    expect(motivo(puedeCerrar(tec, { ...trabajo, ot: null }, emp))).toBe(
      "sin_ot",
    );
    expect(
      motivo(
        puedeCerrar(
          tec,
          { ...trabajo, ot: { responsableId: "p1", abierta: false } },
          emp,
        ),
      ),
    ).toBe("sin_ot");
  });
  it("sin firma no se cierra", () => {
    expect(
      motivo(puedeCerrar({ ...tec, tieneFirma: false }, trabajo, emp)),
    ).toBe("sin_firma");
  });
  it("el técnico no cierra la OT de otro; el supervisor sí", () => {
    const otro = { ...trabajo, ot: { responsableId: "p2", abierta: true } };
    expect(motivo(puedeCerrar(tec, otro, emp))).toBe("no_responsable");
    expect(motivo(puedeCerrar({ ...tec, rol: "SUPERVISOR" }, otro, emp))).toBe(
      "ok",
    );
  });
  it("máximo 3 fotos después, contando las que ya tiene", () => {
    expect(motivo(puedeCerrar(tec, trabajo, emp, 4))).toBe("fotos_maximo");
    expect(
      motivo(puedeCerrar(tec, { ...trabajo, fotosDespues: 2 }, emp, 2)),
    ).toBe("fotos_maximo");
    expect(
      motivo(puedeCerrar(tec, { ...trabajo, fotosDespues: 2 }, emp, 1)),
    ).toBe("ok");
  });
  it("fuera de EN_PROCESO, o el gerente, no cierra", () => {
    expect(
      motivo(
        puedeCerrar(tec, { ...trabajo, estado: "PENDIENTE_VALIDACION" }, emp),
      ),
    ).toBe("estado_cambio");
    expect(motivo(puedeCerrar({ ...tec, rol: "GERENTE" }, trabajo, emp))).toBe(
      "no autorizado",
    );
  });
});

describe("formatearCodigo", () => {
  it("mismo formato que la base", () => {
    expect(formatearCodigo("BKL", 1)).toBe("BKL-000001");
    expect(formatearCodigo("OT", 7, 2026)).toBe("OT-2026-007");
    expect(formatearCodigo("RQ", 1234, 2026)).toBe("RQ-2026-1234");
  });
});

describe("tipoImagen por firma binaria", () => {
  const bytes = (...b: number[]) =>
    new Uint8Array([...b, ...Array(16).fill(0)]);
  it("reconoce JPG, PNG y WEBP", () => {
    expect(tipoImagen(bytes(0xff, 0xd8, 0xff, 0xe0))?.mime).toBe("image/jpeg");
    expect(
      tipoImagen(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a))?.ext,
    ).toBe("png");
    expect(
      tipoImagen(
        new Uint8Array([...new TextEncoder().encode("RIFF\0\0\0\0WEBPVP8 ")]),
      )?.mime,
    ).toBe("image/webp");
  });
  it("rechaza lo demás aunque diga .jpg", () => {
    expect(
      tipoImagen(new TextEncoder().encode("<svg onload=alert(1)>...")),
    ).toBeNull();
    expect(tipoImagen(bytes(0x47, 0x49, 0x46, 0x38))).toBeNull(); // GIF
    expect(tipoImagen(new Uint8Array([0xff, 0xd8]))).toBeNull();
  });
});

describe("medidasImagen", () => {
  it("lee ancho y alto de PNG, JPG y WEBP", () => {
    const P = { mime: "image/png", ext: "png" } as const;
    const J = { mime: "image/jpeg", ext: "jpg" } as const;
    const W = { mime: "image/webp", ext: "webp" } as const;
    expect(medidasImagen(png(320, 90), P)).toEqual({ ancho: 320, alto: 90 });
    expect(medidasImagen(jpg(4032, 3024), J)).toEqual({
      ancho: 4032,
      alto: 3024,
    });
    // VP8X: ancho-1 y alto-1 en 24 bits little endian.
    const vp8x = new Uint8Array(30);
    vp8x.set(new TextEncoder().encode("RIFF"), 0);
    vp8x.set([22, 0, 0, 0], 4);
    vp8x.set(new TextEncoder().encode("WEBPVP8X"), 8);
    vp8x.set([0x3f, 0x01, 0x00, 0xc7, 0x00, 0x00], 24);
    expect(medidasImagen(vp8x, W)).toEqual({ ancho: 320, alto: 200 });
  });
  it("rechaza archivos cortados o con algo pegado al final", () => {
    const P = { mime: "image/png", ext: "png" } as const;
    const J = { mime: "image/jpeg", ext: "jpg" } as const;
    const bueno = png(10, 10);
    expect(medidasImagen(bueno.slice(0, -6), P)).toBeNull();
    expect(
      medidasImagen(new Uint8Array([...bueno, 0x50, 0x4b, 3, 4]), P),
    ).toBeNull();
    expect(medidasImagen(new Uint8Array([...jpg(10, 10), 0x3c]), J)).toBeNull();
    const sinSof = new Uint8Array([
      0xff, 0xd8, 0xff, 0xe0, 0, 4, 0, 0, 0, 0, 0, 0, 0xff, 0xd9,
    ]);
    expect(medidasImagen(sinSof, J)).toBeNull();
  });
});

describe("bandeja", () => {
  const item = (
    codigo: string,
    extra: Partial<Parameters<typeof atraso>[0]> = {},
  ) => ({
    codigo,
    estado: "PENDIENTE" as EstadoBacklog,
    criticidad: "MEDIA" as const,
    fechaProgramada: "2026-11-10",
    devuelto: false,
    ...extra,
  });
  it("atraso solo cuenta en abiertos", () => {
    expect(atraso(item("a"), "2026-11-19")).toBe(9);
    expect(
      atraso(item("a", { fechaProgramada: "2026-11-25" }), "2026-11-19"),
    ).toBe(0);
    expect(atraso(item("a", { estado: "COMPLETADO" }), "2026-11-19")).toBe(0);
  });
  it("devueltos primero, luego criticidad, luego atraso, luego código", () => {
    const lista = [
      item("BKL-5", { criticidad: "BAJA" }),
      item("BKL-4", { criticidad: "ALTA", fechaProgramada: "2026-11-18" }),
      item("BKL-3", { criticidad: "ALTA", fechaProgramada: "2026-11-01" }),
      item("BKL-2", {
        criticidad: "BAJA",
        devuelto: true,
        estado: "EN_PROCESO",
      }),
      item("BKL-1", { criticidad: "ALTA", fechaProgramada: "2026-11-01" }),
    ];
    expect(ordenarBandeja(lista, "2026-11-19").map((i) => i.codigo)).toEqual([
      "BKL-2",
      "BKL-1",
      "BKL-3",
      "BKL-4",
      "BKL-5",
    ]);
  });
});

const UUID = "0190a1b2-0000-7000-8000-000000000001";

describe("esquemas", () => {
  const backlog = {
    equipoId: UUID,
    sistemaId: "",
    componente: " Bomba ",
    criticidad: "ALTA",
    descripcion: "Fuga\nen el sello",
    fechaObservacion: "2026-11-18",
    fechaProgramada: "2026-11-20",
    costoEstimado: "",
    clave: UUID,
  };
  it("crear backlog: recorta, costo vacío = 0, saltos de línea permitidos", () => {
    const r = crearBacklogSchema.parse(backlog);
    expect(r.componente).toBe("Bomba");
    expect(r.costoEstimado).toBe(0);
    expect(r.sistemaId).toBeNull();
  });
  it("crear backlog: programada antes de observada, criticidad rara o costo con coma no pasan", () => {
    expect(
      crearBacklogSchema.safeParse({
        ...backlog,
        fechaProgramada: "2026-11-01",
      }).success,
    ).toBe(false);
    expect(
      crearBacklogSchema.safeParse({ ...backlog, criticidad: "URGENTE" })
        .success,
    ).toBe(false);
    expect(
      crearBacklogSchema.safeParse({ ...backlog, costoEstimado: "1,500" })
        .success,
    ).toBe(false);
    expect(
      crearBacklogSchema.safeParse({ ...backlog, clave: "x" }).success,
    ).toBe(false);
  });
  it("devolver exige observación; aprobar no", () => {
    const v = { backlogId: UUID, nota: "", clave: UUID };
    expect(
      validarSchema.safeParse({ ...v, decision: "DEVOLVER" }).success,
    ).toBe(false);
    expect(validarSchema.safeParse({ ...v, decision: "APROBAR" }).success).toBe(
      true,
    );
    expect(
      validarSchema.safeParse({
        ...v,
        decision: "DEVOLVER",
        nota: "Ajustar pernos",
      }).success,
    ).toBe(true);
  });
  it("RM: horómetro con punto decimal, sin comas", () => {
    const rm = { backlogId: UUID, fecha: "2026-11-18", notas: "", clave: UUID };
    expect(
      cerrarReporteSchema.parse({ ...rm, horometro: "1600.5" }).horometro,
    ).toBe(1600.5);
    expect(
      cerrarReporteSchema.safeParse({ ...rm, horometro: "1,600" }).success,
    ).toBe(false);
  });
});

// ---- Casos de uso con repositorios falsos ----

const A = "0190a1b2-0000-7000-8000-00000000000a";
const AHORA = new Date("2026-11-19T15:00:00Z"); // 19 nov, 10:00 en Lima
const JPG = jpg(640, 480);

const actor = (rol: string, extra: Partial<Actor> = {}): Actor => ({
  id: `u-${rol}`,
  email: "x@a.pe",
  rol,
  empresaId: A,
  personaId: `p-${rol}`,
  habilitado: true,
  motivo: null,
  debeCambiarClave: false,
  ...extra,
});

function detalle(extra: Partial<BacklogDetalle> = {}): BacklogDetalle {
  return {
    id: UUID,
    codigo: "BKL-000001",
    equipo: "EQ-1",
    componente: "Bomba",
    criticidad: "ALTA",
    estado: "EN_PROCESO",
    fechaProgramada: "2026-11-20",
    devuelto: false,
    equipoId: UUID,
    sistemaId: null,
    sistema: null,
    descripcion: "Fuga",
    fechaObservacion: "2026-11-18",
    costoEstimado: 0,
    version: 1,
    creadoPorId: "u-TECNICO",
    creadoPor: "Tito",
    creadoEn: "2026-11-18T10:00:00Z",
    cerradoPorId: null,
    notaDevolucion: null,
    ot: {
      id: UUID,
      codigo: "OT-2026-001",
      abierta: true,
      responsableId: "p-TECNICO",
      responsable: "Tito",
    },
    rm: null,
    requisiciones: [],
    historial: [],
    firmas: [],
    fotos: [],
    ...extra,
  };
}

function repos(
  b: BacklogDetalle | null,
  opciones: { firma?: boolean; planValida?: boolean } = {},
) {
  const llamadas: string[] = [];
  const lector: LectorTrabajos = {
    listar: async () => [],
    obtener: async () => b,
    opciones: async () => ({ equipos: [], sistemas: [] }),
    responsables: async () => [],
    empresa: async () => ({
      planificadorPuedeValidar: opciones.planValida ?? false,
      zonaHoraria: "America/Lima",
    }),
    miFirma: async () => (opciones.firma === false ? null : "https://firma"),
  };
  const registrar = (nombre: string) => async () => {
    llamadas.push(nombre);
    return ok(undefined);
  };
  const trabajos: TrabajosRepositorio = {
    subirImagen: async (_e, carpeta) => {
      llamadas.push(`subir:${carpeta}`);
      return ok(`${A}/${carpeta}/x.jpg`);
    },
    crear: async () => {
      llamadas.push("crear");
      return ok({ id: UUID });
    },
    editar: registrar("editar"),
    abrirOt: registrar("abrirOt"),
    crearRequisicion: registrar("crearRequisicion"),
    cambiarRequisicion: registrar("cambiarRequisicion"),
    cerrar: registrar("cerrar"),
    validar: registrar("validar"),
    reabrir: registrar("reabrir"),
    guardarFirma: registrar("guardarFirma"),
  };
  return { r: { lector, trabajos }, llamadas };
}

const codigo = (
  r: { ok: boolean; error?: { code: string; message: string } } | { ok: true },
) =>
  r.ok
    ? "ok"
    : `${(r as { error: { code: string } }).error.code}:${(r as { error: { message: string } }).error.message}`;

describe("casos de uso", () => {
  const entradaBacklog = crearBacklogSchema.parse({
    equipoId: UUID,
    sistemaId: "",
    componente: "Bomba",
    criticidad: "ALTA",
    descripcion: "Fuga",
    fechaObservacion: "2026-11-19",
    fechaProgramada: "2026-11-20",
    costoEstimado: "0",
    clave: UUID,
  });

  it("crear backlog: sube las fotos y luego crea", async () => {
    const { r, llamadas } = repos(null);
    expect(
      codigo(
        await crearBacklog(actor("TECNICO"), entradaBacklog, [JPG], r, AHORA),
      ),
    ).toBe("ok");
    expect(llamadas).toEqual(["subir:backlogs", "crear"]);
  });
  it("crear backlog: más de 3 fotos o una que no es imagen no sube nada", async () => {
    const { r, llamadas } = repos(null);
    expect(
      codigo(
        await crearBacklog(
          actor("TECNICO"),
          entradaBacklog,
          [JPG, JPG, JPG, JPG],
          r,
          AHORA,
        ),
      ),
    ).toBe("VALIDATION:fotos_maximo");
    expect(
      codigo(
        await crearBacklog(
          actor("TECNICO"),
          entradaBacklog,
          [JPG, new TextEncoder().encode("<html>hola mundo</html>")],
          r,
          AHORA,
        ),
      ),
    ).toBe("VALIDATION:foto_no_valida");
    expect(llamadas).toEqual([]);
  });
  it("crear backlog: el gerente no; sin sesión no; fecha futura no", async () => {
    const { r } = repos(null);
    expect(
      codigo(
        await crearBacklog(actor("GERENTE"), entradaBacklog, [], r, AHORA),
      ),
    ).toMatch(/^FORBIDDEN/);
    expect(
      codigo(await crearBacklog(null, entradaBacklog, [], r, AHORA)),
    ).toMatch(/^UNAUTHENTICATED/);
    expect(
      codigo(
        await crearBacklog(
          actor("TECNICO", { habilitado: false }),
          entradaBacklog,
          [],
          r,
          AHORA,
        ),
      ),
    ).toMatch(/^UNAUTHENTICATED/);
    expect(
      codigo(
        await crearBacklog(
          actor("TECNICO"),
          { ...entradaBacklog, fechaObservacion: "2026-11-20" },
          [],
          r,
          AHORA,
        ),
      ),
    ).toBe("VALIDATION:fecha_futura");
  });

  it("abrir OT: backlog de otra empresa = no encontrado", async () => {
    const { r, llamadas } = repos(null);
    expect(
      codigo(
        await abrirOrdenTrabajo(
          actor("SUPERVISOR"),
          { backlogId: UUID, responsableId: UUID, clave: UUID },
          r,
        ),
      ),
    ).toBe("NOT_FOUND:backlog no existe");
    expect(llamadas).toEqual([]);
  });
  it("abrir OT: el técnico no; si ya está en proceso, conflicto", async () => {
    const pend = repos(detalle({ estado: "PENDIENTE", ot: null })).r;
    expect(
      codigo(
        await abrirOrdenTrabajo(
          actor("TECNICO"),
          { backlogId: UUID, responsableId: UUID, clave: UUID },
          pend,
        ),
      ),
    ).toMatch(/^FORBIDDEN/);
    const { r } = repos(detalle());
    expect(
      codigo(
        await abrirOrdenTrabajo(
          actor("SUPERVISOR"),
          { backlogId: UUID, responsableId: UUID, clave: UUID },
          r,
        ),
      ),
    ).toBe("CONFLICT:estado_cambio");
  });

  const rm = {
    backlogId: UUID,
    fecha: "2026-11-19",
    horometro: 1600,
    notas: null,
    clave: UUID,
  };
  it("cerrar RM: el técnico responsable con firma cierra (fotos primero)", async () => {
    const { r, llamadas } = repos(detalle());
    expect(
      codigo(await cerrarReporte(actor("TECNICO"), rm, [JPG], r, AHORA)),
    ).toBe("ok");
    expect(llamadas).toEqual(["subir:backlogs", "cerrar"]);
  });
  it("cerrar RM: sin firma, fecha futura o antes de observar, no", async () => {
    expect(
      codigo(
        await cerrarReporte(
          actor("TECNICO"),
          rm,
          [],
          repos(detalle(), { firma: false }).r,
          AHORA,
        ),
      ),
    ).toBe("VALIDATION:sin_firma");
    expect(
      codigo(
        await cerrarReporte(
          actor("TECNICO"),
          { ...rm, fecha: "2026-11-20" },
          [],
          repos(detalle()).r,
          AHORA,
        ),
      ),
    ).toBe("VALIDATION:fecha_futura");
    expect(
      codigo(
        await cerrarReporte(
          actor("TECNICO"),
          { ...rm, fecha: "2026-11-17" },
          [],
          repos(detalle()).r,
          AHORA,
        ),
      ),
    ).toBe("VALIDATION:fecha_antes_observacion");
  });
  it("cerrar RM: con 2 fotos después ya guardadas, 2 más no entran", async () => {
    const fotos = [
      { id: "1", rol: "DESPUES" as const, url: null },
      { id: "2", rol: "DESPUES" as const, url: null },
    ];
    const { r, llamadas } = repos(detalle({ fotos }));
    expect(
      codigo(await cerrarReporte(actor("TECNICO"), rm, [JPG, JPG], r, AHORA)),
    ).toBe("VALIDATION:fotos_maximo");
    expect(llamadas).toEqual([]);
  });

  const pv = detalle({
    estado: "PENDIENTE_VALIDACION",
    cerradoPorId: "u-TECNICO",
  });
  const aprobar = {
    backlogId: UUID,
    decision: "APROBAR" as const,
    nota: "",
    clave: UUID,
  };
  it("validar: el supervisor aprueba con firma", async () => {
    const { r, llamadas } = repos(pv);
    expect(codigo(await validarTrabajo(actor("SUPERVISOR"), aprobar, r))).toBe(
      "ok",
    );
    expect(llamadas).toEqual(["validar"]);
  });
  it("validar: sin firma no aprueba, pero sí puede devolver", async () => {
    const { r } = repos(pv, { firma: false });
    expect(codigo(await validarTrabajo(actor("SUPERVISOR"), aprobar, r))).toBe(
      "VALIDATION:sin_firma",
    );
    expect(
      codigo(
        await validarTrabajo(
          actor("SUPERVISOR"),
          { ...aprobar, decision: "DEVOLVER", nota: "Faltan pernos" },
          r,
        ),
      ),
    ).toBe("ok");
  });
  it("validar: el propio cierre del supervisor no; el planificador solo autorizado", async () => {
    const propio = repos(
      detalle({ estado: "PENDIENTE_VALIDACION", cerradoPorId: "u-SUPERVISOR" }),
    ).r;
    expect(
      codigo(await validarTrabajo(actor("SUPERVISOR"), aprobar, propio)),
    ).toBe("FORBIDDEN:propio_cierre");
    expect(
      codigo(await validarTrabajo(actor("PLANIFICADOR"), aprobar, repos(pv).r)),
    ).toMatch(/^FORBIDDEN/);
    expect(
      codigo(
        await validarTrabajo(
          actor("PLANIFICADOR"),
          aprobar,
          repos(pv, { planValida: true }).r,
        ),
      ),
    ).toBe("ok");
    expect(
      codigo(await validarTrabajo(actor("TECNICO"), aprobar, repos(pv).r)),
    ).toMatch(/^FORBIDDEN/);
  });

  it("editar cerrado: exige motivo", async () => {
    const { r } = repos(detalle({ estado: "COMPLETADO" }));
    const e = {
      id: UUID,
      version: 3,
      motivo: null,
      sistemaId: null,
      componente: "Bomba",
      criticidad: "ALTA" as const,
      descripcion: "Fuga",
      fechaObservacion: "2026-11-18",
      fechaProgramada: "2026-11-20",
      costoEstimado: 0,
    };
    expect(codigo(await editarBacklog(actor("SUPERVISOR"), e, r))).toBe(
      "VALIDATION:nota_obligatoria",
    );
    expect(
      codigo(
        await editarBacklog(
          actor("SUPERVISOR"),
          { ...e, motivo: "Corrijo el componente" },
          r,
        ),
      ),
    ).toBe("ok");
    expect(
      codigo(
        await editarBacklog(
          actor("TECNICO"),
          { ...e, motivo: "Corrijo el componente" },
          r,
        ),
      ),
    ).toMatch(/^FORBIDDEN/);
  });

  it("firma: solo PNG o JPG completos y de tamaño razonable", async () => {
    const { r, llamadas } = repos(null);
    const pegado = new Uint8Array([
      ...png(300, 80),
      ...new TextEncoder().encode("<script>alert(1)</script>"),
    ]);
    const cortado = JPG.slice(0, JPG.length - 2);
    const webp = new TextEncoder().encode(
      "RIFF\x16\0\0\0WEBPVP8X0000000000000000",
    );
    for (const mala of [webp, pegado, cortado, png(50, 20), jpg(9000, 100)]) {
      expect(codigo(await guardarMiFirma(actor("TECNICO"), mala, r))).toBe(
        "VALIDATION:foto_no_valida",
      );
    }
    expect(llamadas).toEqual([]);
    expect(
      codigo(await guardarMiFirma(actor("TECNICO"), png(300, 80), r)),
    ).toBe("ok");
    expect(llamadas).toEqual(["subir:firmas", "guardarFirma"]);
  });

  it("firma: el gerente no sube firma", async () => {
    const { r } = repos(null);
    expect(
      codigo(await guardarMiFirma(actor("GERENTE"), png(300, 80), r)),
    ).toMatch(/^FORBIDDEN/);
  });

  it("ver: el técnico solo ve «Cerrar con RM» en su OT; el gerente no ve acciones", async () => {
    const mio = await verTrabajo(actor("TECNICO"), UUID, repos(detalle()).r);
    expect(mio.ok && mio.value?.eventos).toEqual(["CERRAR_RM"]);
    const ajeno = await verTrabajo(
      actor("TECNICO", { personaId: "otra" }),
      UUID,
      repos(detalle()).r,
    );
    expect(ajeno.ok && ajeno.value?.eventos).toEqual([]);
    const ger = await verTrabajo(actor("GERENTE"), UUID, repos(detalle()).r);
    expect(ger.ok && ger.value?.eventos).toEqual([]);
    expect(ger.ok && ger.value?.edicion.permitido).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import {
  ejecutarPreventivo,
  generarBacklogDesdeObservacion,
  importarPreventivos,
  programarPreventivo,
  validarPreventivo,
  verPreventivo,
} from "@/modules/preventivos/application/casos-uso";
import {
  ejecutarSchema,
  programarSchema,
  type EjecutarEntrada,
} from "@/modules/preventivos/application/esquemas";
import type {
  PreventivoDetalle,
  ReposPreventivos,
} from "@/modules/preventivos/application/repositorios";
import { revisarActividades } from "@/modules/preventivos/domain/actividad-observada";
import { duracionHoras } from "@/modules/preventivos/domain/duracion";
import {
  leerCsv,
  prepararCsv,
} from "@/modules/preventivos/domain/importacion-csv";
import { siguienteProgramacion } from "@/modules/preventivos/domain/plan-recurrencia";
import {
  puedeEjecutar,
  puedeValidarPreventivo,
} from "@/modules/preventivos/domain/preventivo-estado";
import {
  enAlerta,
  estaVencido,
  horometroEnAlerta,
  situacion,
} from "@/modules/preventivos/domain/vencimiento";
import type { Actor } from "@/shared/kernel/actor";
import { ok } from "@/shared/kernel/result";
import { jpg } from "../imagenes";

const HOY = "2026-11-19";

describe("vencimiento y alerta", () => {
  it("vencido: solo PROGRAMADO con fecha ya pasada; el día límite aún no vence", () => {
    expect(
      estaVencido({ estado: "PROGRAMADO", fechaProgramada: HOY }, HOY),
    ).toBe(false);
    expect(
      estaVencido({ estado: "PROGRAMADO", fechaProgramada: "2026-11-18" }, HOY),
    ).toBe(true);
    expect(
      estaVencido({ estado: "DEVUELTO", fechaProgramada: "2026-11-01" }, HOY),
    ).toBe(false);
    expect(
      estaVencido({ estado: "COMPLETADO", fechaProgramada: "2026-11-01" }, HOY),
    ).toBe(false);
  });

  it("alerta a 7 y 6 días sí; a 8 días no; el mismo día sí; pasado no", () => {
    expect(enAlerta("2026-11-26", HOY)).toBe(true);
    expect(enAlerta("2026-11-25", HOY)).toBe(true);
    expect(enAlerta("2026-11-27", HOY)).toBe(false);
    expect(enAlerta(HOY, HOY)).toBe(true);
    expect(enAlerta("2026-11-18", HOY)).toBe(false);
  });

  it("alerta por horómetro dentro del margen de 50 h", () => {
    expect(horometroEnAlerta(1449, 1500)).toBe(false);
    expect(horometroEnAlerta(1450, 1500)).toBe(true);
    expect(horometroEnAlerta(1600, 1500)).toBe(true);
    expect(horometroEnAlerta(null, 1500)).toBe(false);
    expect(horometroEnAlerta(1600, null)).toBe(false);
  });

  it("situación: vencido gana; alerta por fecha u horómetro; ejecutado no tiene", () => {
    const p = (fecha: string, horo: number | null = null) => ({
      estado: "PROGRAMADO" as const,
      fechaProgramada: fecha,
      horometroProgramado: horo,
    });
    expect(situacion(p("2026-11-10", 2000), HOY, 1000)).toBe("VENCIDO");
    expect(situacion(p("2026-11-20"), HOY, null)).toBe("ALERTA");
    expect(situacion(p("2026-12-30", 1500), HOY, 1480)).toBe("ALERTA");
    expect(situacion(p("2026-12-30", 1500), HOY, 1000)).toBe("AL_DIA");
    expect(
      situacion({ ...p("2026-11-10"), estado: "COMPLETADO" }, HOY, null),
    ).toBeNull();
  });
});

describe("duración", () => {
  it("sin cruce y con cruce de medianoche (+24 h)", () => {
    expect(duracionHoras("08:00", "12:30")).toBe(4.5);
    expect(duracionHoras("22:00", "02:00")).toBe(4);
    expect(duracionHoras("23:45", "00:15")).toBe(0.5);
    expect(duracionHoras("08:00", "08:00")).toBe(0);
  });
});

describe("actividades", () => {
  const ids = ["a", "b"];
  it("observada sin observación se rechaza", () => {
    const r = revisarActividades(ids, [
      { id: "a", resultado: "OK", observacion: null },
      { id: "b", resultado: "OBSERVADO", observacion: "  " },
    ]);
    expect(r.ok || r.error.message).toBe("observacion_obligatoria");
  });
  it("falta una actividad se rechaza; completas pasan", () => {
    const r = revisarActividades(ids, [
      { id: "a", resultado: "OK", observacion: null },
    ]);
    expect(r.ok || r.error.message).toBe("actividades_incompletas");
    expect(
      revisarActividades(ids, [
        { id: "a", resultado: "NO_APLICA", observacion: null },
        { id: "b", resultado: "OBSERVADO", observacion: "Fuga leve" },
      ]).ok,
    ).toBe(true);
  });
});

describe("recurrencia", () => {
  it("propone fecha y horómetro del siguiente desde la última ejecución", () => {
    expect(
      siguienteProgramacion(
        { cadaDias: 30, cadaHoras: 250 },
        { fecha: "2026-11-19", horometro: 1760 },
      ),
    ).toEqual({ fecha: "2026-12-19", horometro: 2010 });
    expect(
      siguienteProgramacion(
        { cadaDias: null, cadaHoras: 250 },
        { fecha: "2026-11-19", horometro: null },
      ),
    ).toEqual({ fecha: null, horometro: null });
  });
});

describe("reglas de rol", () => {
  it("ejecutar: programado o devuelto; el técnico solo el suyo; gerente nunca", () => {
    expect(puedeEjecutar("PROGRAMADO", "TECNICO", true)).toBe(true);
    expect(puedeEjecutar("PROGRAMADO", "TECNICO", false)).toBe(false);
    expect(puedeEjecutar("DEVUELTO", "SUPERVISOR", false)).toBe(true);
    expect(puedeEjecutar("COMPLETADO", "SUPERVISOR", false)).toBe(false);
    expect(puedeEjecutar("PROGRAMADO", "GERENTE", true)).toBe(false);
  });
  it("validar: solo COMPLETADO; nadie lo propio salvo el planificador autorizado", () => {
    const ctx = (esPropio: boolean, plan = false) => ({
      esPropio,
      planificadorPuedeValidar: plan,
    });
    expect(puedeValidarPreventivo("COMPLETADO", "SUPERVISOR", ctx(false))).toBe(
      true,
    );
    expect(puedeValidarPreventivo("COMPLETADO", "SUPERVISOR", ctx(true))).toBe(
      false,
    );
    expect(
      puedeValidarPreventivo("COMPLETADO", "PLANIFICADOR", ctx(true)),
    ).toBe(false);
    expect(
      puedeValidarPreventivo("COMPLETADO", "PLANIFICADOR", ctx(true, true)),
    ).toBe(true);
    expect(puedeValidarPreventivo("COMPLETADO", "TECNICO", ctx(false))).toBe(
      false,
    );
    expect(puedeValidarPreventivo("PROGRAMADO", "SUPERVISOR", ctx(false))).toBe(
      false,
    );
  });
});

describe("CSV", () => {
  it("lee comillas, comillas escapadas, punto y coma, BOM y CRLF", () => {
    expect(leerCsv('﻿a;b\r\n"x;1";"di ""y"""\r\n\r\n')).toEqual([
      ["a", "b"],
      ["x;1", 'di "y"'],
    ]);
  });

  const enc = "EQUIPO,PLAN,TIPO,FECHA,RESPONSABLE,HOROMETRO\n";
  it("fórmulas, fechas imposibles y duplicados quedan con error por fila", () => {
    const r = prepararCsv(
      enc +
        "EQ-1,250 h,PM1,2026-12-01,Tito Tec,1500\n" +
        "=HYPERLINK(1),250 h,PM1,2026-12-01,x,\n" +
        "EQ-2,250 h,PM1,31/02/2026,Tito Tec,\n" +
        "eq-1,250 H,pm2,01/12/2026,Otro,\n" +
        "EQ-3,250 h,PM9,2026-12-01,Tito Tec,\n" +
        "EQ-4,250 h,PM1,2026-12-01,Tito Tec,1,500\n" +
        "EQ-5,250 h,PM1,2026-12-01,@SUM(A1),\n",
    );
    if (!r.ok) throw new Error(r.error);
    expect(r.validas.map((v) => v.fila)).toEqual([2]);
    expect(r.validas[0]).toMatchObject({ tipo: "PM1", horometro: 1500 });
    expect(r.errores.map((e) => e.fila)).toEqual([3, 4, 5, 6, 7, 8]);
    expect(r.errores[4].motivo).toMatch(/más columnas/);
    expect(r.errores[0].motivo).toMatch(/fórmula/);
    expect(r.errores[1].motivo).toMatch(/Fecha/);
    expect(r.errores[2].motivo).toMatch(/Repite/);
  });

  it("sin columnas obligatorias, vacío o demasiado grande se rechaza entero", () => {
    expect(prepararCsv("EQUIPO,PLAN\nA,B\n")).toEqual({
      ok: false,
      error: "COLUMNAS",
    });
    expect(prepararCsv(enc)).toEqual({ ok: false, error: "VACIO" });
    expect(
      prepararCsv(enc + "EQ,P,PM1,2026-12-01,Tito\n".repeat(1001)),
    ).toEqual({ ok: false, error: "DEMASIADAS_FILAS" });
  });
});

const UUID = "0190a1b2-0000-7000-8000-000000000001";
const A = "0190a1b2-0000-7000-8000-00000000000a";
const AHORA = new Date("2026-11-19T15:00:00Z");

describe("esquemas", () => {
  const base = {
    equipoId: UUID,
    nombrePlanId: UUID,
    tipo: "PM1",
    fechaProgramada: "2026-11-26",
    horometroProgramado: "",
    responsableId: UUID,
    tercero: "",
    cadaDias: "",
    cadaHoras: "",
    clave: UUID,
  };
  it("programar: responsable o tercero, nunca los dos ni ninguno", () => {
    expect(programarSchema.safeParse(base).success).toBe(true);
    expect(
      programarSchema.safeParse({
        ...base,
        responsableId: "",
        tercero: "Taller X",
      }).success,
    ).toBe(true);
    expect(
      programarSchema.safeParse({ ...base, tercero: "Taller X" }).success,
    ).toBe(false);
    expect(
      programarSchema.safeParse({ ...base, responsableId: "" }).success,
    ).toBe(false);
    expect(programarSchema.safeParse({ ...base, cadaDias: "0" }).success).toBe(
      false,
    );
  });
  it("ejecutar: hora fin igual a inicio no; horas mal escritas no", () => {
    const e = {
      preventivoId: UUID,
      fechaEjecucion: "2026-11-19",
      horaInicio: "22:00",
      horaFin: "02:00",
      turno: "NOCHE",
      horometroEjecucion: "",
      notas: "",
      actividades: [],
      repuestos: [{ descripcion: "Aceite", cantidad: "4", unidad: "gal" }],
      personal: [],
      clave: UUID,
    };
    const r = ejecutarSchema.safeParse(e);
    expect(r.success && r.data.repuestos[0].cantidad).toBe(4);
    expect(ejecutarSchema.safeParse({ ...e, horaFin: "22:00" }).success).toBe(
      false,
    );
    expect(
      ejecutarSchema.safeParse({ ...e, horaInicio: "25:00" }).success,
    ).toBe(false);
    expect(
      ejecutarSchema.safeParse({
        ...e,
        repuestos: [{ descripcion: "x", cantidad: "0" }],
      }).success,
    ).toBe(false);
  });
});

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

function detalle(extra: Partial<PreventivoDetalle> = {}): PreventivoDetalle {
  return {
    id: UUID,
    codigo: "PM-000001",
    equipoId: "eq",
    equipo: "EQ-1",
    plan: "250 h",
    tipo: "PM1",
    estado: "PROGRAMADO",
    fechaProgramada: "2026-11-26",
    horometroProgramado: null,
    horometroActual: 1500,
    responsable: "Tito Tec",
    nombrePlanId: "np",
    cadaDias: 30,
    cadaHoras: null,
    responsableId: "p-TECNICO",
    esTercero: false,
    version: 1,
    fechaEjecucion: null,
    horaInicio: null,
    horaFin: null,
    duracionHoras: null,
    turno: null,
    horometroEjecucion: null,
    notas: null,
    ejecutadoPorId: null,
    ejecutadoPor: null,
    validadoPor: null,
    notaDevolucion: null,
    actividades: [
      {
        id: "act-1",
        descripcion: "Frenos",
        resultado: null,
        observacion: null,
        backlog: null,
      },
    ],
    repuestos: [],
    personal: [],
    firmas: [],
    fotos: [],
    historial: [],
    ...extra,
  };
}

function repos(
  p: PreventivoDetalle | null,
  opciones: { firma?: boolean } = {},
) {
  const llamadas: string[] = [];
  const datosCrear: unknown[] = [];
  const r: ReposPreventivos = {
    lector: {
      listar: async () => [],
      obtener: async () => p,
      opciones: async () => ({
        equipos: [],
        planes: [],
        personas: [],
        duraciones: {},
      }),
      personas: async () => [{ id: "p-1", nombre: "Uno" }],
    },
    preventivos: {
      programar: async () => {
        llamadas.push("programar");
        return ok({ id: UUID });
      },
      importar: async (filas) => {
        llamadas.push("importar");
        return ok([
          { fila: filas[0].fila, accion: "CREADO" as const },
          { fila: filas[1].fila, accion: "OMITIDO" as const },
          { fila: filas[2].fila, error: "EQUIPO" as const },
        ]);
      },
      ejecutar: async (_id, _d, fotos) => {
        llamadas.push(`ejecutar:${fotos.length}`);
        return ok(undefined);
      },
      validar: async (_id, aprobar) => {
        llamadas.push(aprobar ? "aprobar" : "devolver");
        return ok(undefined);
      },
      reprogramar: async () => ok(undefined),
    },
    trabajos: {
      lector: {
        listar: async () => [],
        obtener: async () => null,
        opciones: async () => ({ equipos: [], sistemas: [] }),
        responsables: async () => [],
        empresa: async () => ({
          planificadorPuedeValidar: false,
          zonaHoraria: "America/Lima",
        }),
        miFirma: async () =>
          opciones.firma === false ? null : "https://firma",
      },
      trabajos: {
        subirImagen: async (_e, carpeta) => {
          llamadas.push(`subir:${carpeta}`);
          return ok(`${A}/${carpeta}/x.jpg`);
        },
        crear: async (datos, _f, clave) => {
          llamadas.push(`crear:${clave}`);
          datosCrear.push(datos);
          return ok({ id: "bk" });
        },
        editar: async () => ok(undefined),
        abrirOt: async () => ok(undefined),
        crearRequisicion: async () => ok(undefined),
        cambiarRequisicion: async () => ok(undefined),
        cerrar: async () => ok(undefined),
        validar: async () => ok(undefined),
        reabrir: async () => ok(undefined),
        guardarFirma: async () => ok(undefined),
      },
    },
  };
  return { r, llamadas, datosCrear };
}

const ejecucion = (
  actividades: EjecutarEntrada["actividades"] = [
    { id: "act-1", resultado: "OK", observacion: null },
  ],
): EjecutarEntrada => ({
  preventivoId: UUID,
  fechaEjecucion: "2026-11-19",
  horaInicio: "22:00",
  horaFin: "02:00",
  turno: "NOCHE",
  horometroEjecucion: null,
  notas: null,
  actividades,
  repuestos: [],
  personal: [],
  clave: UUID,
});

describe("casos de uso", () => {
  it("el técnico no programa; el planificador sí", async () => {
    const { r, llamadas } = repos(null);
    const entrada = programarSchema.parse({
      equipoId: UUID,
      nombrePlanId: UUID,
      tipo: "PM1",
      fechaProgramada: "2026-11-26",
      horometroProgramado: "",
      responsableId: UUID,
      tercero: "",
      cadaDias: "",
      cadaHoras: "",
      clave: UUID,
    });
    const t = await programarPreventivo(actor("TECNICO"), entrada, r);
    expect(t.ok || t.error.code).toBe("FORBIDDEN");
    expect(
      (await programarPreventivo(actor("PLANIFICADOR"), entrada, r)).ok,
    ).toBe(true);
    expect(llamadas).toEqual(["programar"]);
  });

  it("ejecutar: sin firma no; técnico ajeno no; fecha futura no; con foto sube a preventivos", async () => {
    const sinFirma = repos(detalle(), { firma: false });
    const a = await ejecutarPreventivo(
      actor("TECNICO"),
      ejecucion(),
      [],
      sinFirma.r,
      AHORA,
    );
    expect(a.ok || a.error.message).toBe("sin_firma");

    const { r, llamadas } = repos(detalle());
    const b = await ejecutarPreventivo(
      actor("TECNICO", { personaId: "otro" }),
      ejecucion(),
      [],
      r,
      AHORA,
    );
    expect(b.ok || b.error.message).toBe("no_responsable");
    const c = await ejecutarPreventivo(
      actor("TECNICO"),
      { ...ejecucion(), fechaEjecucion: "2026-11-20" },
      [],
      r,
      AHORA,
    );
    expect(c.ok || c.error.message).toBe("fecha_futura");
    const d = await ejecutarPreventivo(
      actor("TECNICO"),
      ejecucion([{ id: "act-1", resultado: "OBSERVADO", observacion: null }]),
      [],
      r,
      AHORA,
    );
    expect(d.ok || d.error.message).toBe("observacion_obligatoria");
    expect(
      (
        await ejecutarPreventivo(
          actor("TECNICO"),
          ejecucion(),
          [jpg(640, 480)],
          r,
          AHORA,
        )
      ).ok,
    ).toBe(true);
    expect(llamadas).toEqual(["subir:preventivos", "ejecutar:1"]);
  });

  it("ejecutar algo ya completado es conflicto", async () => {
    const { r } = repos(detalle({ estado: "COMPLETADO" }));
    const x = await ejecutarPreventivo(
      actor("SUPERVISOR"),
      ejecucion(),
      [],
      r,
      AHORA,
    );
    expect(x.ok || x.error.code).toBe("CONFLICT");
  });

  it("validar: el que ejecutó no valida; el supervisor aprueba con firma", async () => {
    const p = detalle({ estado: "COMPLETADO", ejecutadoPorId: "u-SUPERVISOR" });
    const { r, llamadas } = repos(p);
    const entrada = {
      preventivoId: UUID,
      decision: "APROBAR" as const,
      nota: "",
      clave: UUID,
    };
    const x = await validarPreventivo(actor("SUPERVISOR"), entrada, r);
    expect(x.ok || x.error.message).toBe("propio_cierre");
    const otro = repos({ ...p, ejecutadoPorId: "u-TECNICO" });
    expect(
      (await validarPreventivo(actor("SUPERVISOR"), entrada, otro.r)).ok,
    ).toBe(true);
    expect(otro.llamadas).toEqual(["aprobar"]);
    expect(llamadas).toEqual([]);
  });

  it("backlog desde observación: clave = actividad, con actividadId y origen en el preventivo", async () => {
    const p = detalle({
      estado: "COMPLETADO",
      fechaEjecucion: "2026-11-18",
      actividades: [
        {
          id: "act-1",
          descripcion: "Frenos",
          resultado: "OBSERVADO",
          observacion: "Pastillas",
          backlog: null,
        },
        {
          id: "act-2",
          descripcion: "Aceite",
          resultado: "OK",
          observacion: null,
          backlog: null,
        },
      ],
    });
    const { r, llamadas, datosCrear } = repos(p);
    const ok1 = await generarBacklogDesdeObservacion(
      actor("TECNICO"),
      { preventivoId: UUID, actividadId: "act-1", criticidad: "ALTA" },
      r,
      AHORA,
    );
    expect(ok1.ok).toBe(true);
    expect(llamadas).toEqual(["crear:act-1"]);
    expect(datosCrear[0]).toMatchObject({
      equipoId: "eq",
      actividadId: "act-1",
      componente: "Frenos",
      criticidad: "ALTA",
      fechaObservacion: "2026-11-18",
      descripcion: "Pastillas (PM-000001)",
    });
    const no = await generarBacklogDesdeObservacion(
      actor("TECNICO"),
      { preventivoId: UUID, actividadId: "act-2", criticidad: "ALTA" },
      r,
      AHORA,
    );
    expect(no.ok || no.error.message).toBe("actividad_no_valida");
  });

  it("importar: resume creados, omitidos y errores por fila (de la app y de la base)", async () => {
    const { r } = repos(null);
    const csv =
      "EQUIPO;PLAN;TIPO;FECHA;RESPONSABLE\n" +
      "EQ-1;250 h;PM1;2026-12-01;Tito\n" +
      "EQ-1;250 h;PM1;2026-12-02;Tito\n" +
      "=1+1;250 h;PM1;2026-12-03;Tito\n" +
      "NO;250 h;PM1;2026-12-04;Tito\n";
    const x = await importarPreventivos(actor("SUPERVISOR"), csv, r);
    expect(x.ok && x.value).toMatchObject({
      creados: 1,
      omitidos: 1,
      errores: [{ fila: 4 }, { fila: 5 }],
    });
    const t = await importarPreventivos(actor("TECNICO"), csv, r);
    expect(t.ok || t.error.code).toBe("FORBIDDEN");
  });

  it("ver: propone el siguiente solo si está validado y tiene recurrencia", async () => {
    const p = detalle({
      estado: "VALIDADO",
      fechaEjecucion: "2026-11-19",
      horometroEjecucion: 1760,
    });
    const { r } = repos(p);
    const v = await verPreventivo(actor("PLANIFICADOR"), UUID, r, AHORA);
    expect(v.ok && v.value?.siguiente).toEqual({
      fecha: "2026-12-19",
      horometro: null,
    });
    expect(v.ok && v.value?.ejecuta).toBe(false);
    const prog = await verPreventivo(
      actor("TECNICO"),
      UUID,
      repos(detalle()).r,
      AHORA,
    );
    expect(prog.ok && prog.value).toMatchObject({
      ejecuta: true,
      siguiente: null,
      hoy: HOY,
    });
  });
});

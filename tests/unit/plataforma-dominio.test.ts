import { describe, expect, it } from "vitest";
import {
  calcularEstadoMembresia,
  empresaActiva,
} from "@/modules/plataforma/domain/estado-membresia";
import {
  calcularFinMembresia,
  calcularInicioNuevaMembresia,
} from "@/modules/plataforma/domain/regla-nueva-membresia";
import { validarRuc } from "@/modules/plataforma/domain/ruc";
import { crearSlugEmpresa } from "@/modules/plataforma/domain/slug";
import { esFechaISO, hoyEn } from "@/shared/kernel/fechas";

const FIN = "2026-11-30";
const GRACIA = 3;
const estado = (hoy: string, fin: string | null = FIN, inactiva = false) =>
  calcularEstadoMembresia({ fin, empresaInactiva: inactiva }, GRACIA, hoy);

describe("calcularEstadoMembresia", () => {
  it("más de 7 días restantes: AL_DIA", () => {
    expect(estado("2026-11-22")).toBe("AL_DIA");
  });
  it("exactamente 7 días restantes: POR_VENCER", () => {
    expect(estado("2026-11-23")).toBe("POR_VENCER");
  });
  it("día del vencimiento: POR_VENCER", () => {
    expect(estado("2026-11-30")).toBe("POR_VENCER");
  });
  it("primer día de gracia: EN_GRACIA", () => {
    expect(estado("2026-12-01")).toBe("EN_GRACIA");
  });
  it("último día de gracia: EN_GRACIA", () => {
    expect(estado("2026-12-03")).toBe("EN_GRACIA");
  });
  it("primer día vencido: VENCIDA", () => {
    expect(estado("2026-12-04")).toBe("VENCIDA");
  });
  it("sin membresía: INACTIVA", () => {
    expect(estado("2026-11-01", null)).toBe("INACTIVA");
  });
  it("INACTIVA manual gana aunque esté al día", () => {
    expect(estado("2026-11-01", FIN, true)).toBe("INACTIVA");
  });
  it("gracia 0: el día siguiente al fin ya está VENCIDA", () => {
    expect(
      calcularEstadoMembresia(
        { fin: FIN, empresaInactiva: false },
        0,
        "2026-12-01",
      ),
    ).toBe("VENCIDA");
  });
  it("empresa activa solo en AL_DIA, POR_VENCER y EN_GRACIA", () => {
    expect(empresaActiva("AL_DIA")).toBe(true);
    expect(empresaActiva("POR_VENCER")).toBe(true);
    expect(empresaActiva("EN_GRACIA")).toBe(true);
    expect(empresaActiva("VENCIDA")).toBe(false);
    expect(empresaActiva("INACTIVA")).toBe(false);
  });
});

describe("calcularInicioNuevaMembresia", () => {
  it("primer pago: empieza hoy", () => {
    expect(calcularInicioNuevaMembresia(null, "2026-11-17", GRACIA)).toBe(
      "2026-11-17",
    );
  });
  it("pago antes del vencimiento: día siguiente al fin", () => {
    expect(calcularInicioNuevaMembresia(FIN, "2026-11-20", GRACIA)).toBe(
      "2026-12-01",
    );
  });
  it("pago el día del vencimiento: día siguiente al fin", () => {
    expect(calcularInicioNuevaMembresia(FIN, FIN, GRACIA)).toBe("2026-12-01");
  });
  it("pago durante la gracia: al terminar la gracia", () => {
    expect(calcularInicioNuevaMembresia(FIN, "2026-12-02", GRACIA)).toBe(
      "2026-12-04",
    );
  });
  it("pago el último día de gracia: al terminar la gracia", () => {
    expect(calcularInicioNuevaMembresia(FIN, "2026-12-03", GRACIA)).toBe(
      "2026-12-04",
    );
  });
  it("pago después de la gracia: día del pago", () => {
    expect(calcularInicioNuevaMembresia(FIN, "2026-12-04", GRACIA)).toBe(
      "2026-12-04",
    );
  });
  it("la membresía dura 30 días contando el de inicio", () => {
    expect(calcularFinMembresia("2026-11-01")).toBe("2026-11-30");
    expect(calcularFinMembresia("2026-12-01")).toBe("2026-12-30");
    expect(calcularFinMembresia("2027-02-01")).toBe("2027-03-02");
  });
});

describe("validarRuc", () => {
  it("acepta 11 dígitos y recorta espacios", () => {
    const r = validarRuc(" 20123456789 ");
    expect(r.ok && r.value).toBe("20123456789");
  });
  it.each(["2012345678", "201234567890", "2012345678A", "", "20-12345678"])(
    "rechaza %j",
    (texto) => {
      const r = validarRuc(texto);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.code).toBe("VALIDATION");
    },
  );
});

describe("crearSlugEmpresa", () => {
  it("quita tildes y símbolos y agrega el RUC", () => {
    expect(crearSlugEmpresa("Minería Andina S.A.C.", "20123456789")).toBe(
      "mineria-andina-s-a-c-20123456789",
    );
  });
  it("nombre sin letras: solo el RUC", () => {
    expect(crearSlugEmpresa("¡¡¡", "20123456789")).toBe("20123456789");
  });
});

describe("fechas", () => {
  it("hoy en Lima aunque en UTC ya sea el día siguiente", () => {
    expect(hoyEn("America/Lima", new Date("2026-11-18T03:00:00Z"))).toBe(
      "2026-11-17",
    );
  });
  it("valida fechas reales", () => {
    expect(esFechaISO("2026-02-28")).toBe(true);
    expect(esFechaISO("2026-02-30")).toBe(false);
    expect(esFechaISO("26-02-01")).toBe(false);
  });
});

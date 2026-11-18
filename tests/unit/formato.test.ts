import { describe, expect, it } from "vitest";
import { formatoFecha, formatoMoneda } from "@/shared/ui/formato";

describe("formato", () => {
  it("dólares como US$ y soles como S/", () => {
    expect(formatoMoneda(380, "USD")).toMatch(/^US\$\s?380$/);
    expect(formatoMoneda(1250.5, "PEN")).toMatch(/^S\/\s?1,250\.50$/);
  });
  it("fecha de calendario sin correrse de día", () => {
    expect(formatoFecha("2026-12-01")).toBe("01 dic 2026");
    expect(formatoFecha(null)).toBe("—");
  });
});

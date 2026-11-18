import { describe, expect, it } from "vitest";
import { paginar } from "@/shared/ui/paginacion";

const doce = Array.from({ length: 12 }, (_, i) => i + 1);

describe("paginar", () => {
  it("5 por página", () => {
    expect(paginar(doce, "1").items).toEqual([1, 2, 3, 4, 5]);
    expect(paginar(doce, "3")).toMatchObject({ items: [11, 12], paginas: 3 });
  });
  it("valores raros caen en una página válida", () => {
    expect(paginar(doce, undefined).pagina).toBe(1);
    expect(paginar(doce, "abc").pagina).toBe(1);
    expect(paginar(doce, "-4").pagina).toBe(1);
    expect(paginar(doce, "99").pagina).toBe(3);
  });
  it("lista vacía: una página sin items", () => {
    expect(paginar([], "2")).toMatchObject({
      items: [],
      pagina: 1,
      paginas: 1,
    });
  });
});

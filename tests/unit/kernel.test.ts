import { describe, expect, it } from "vitest";
import { DomainError } from "@/shared/kernel/errors";
import { err, ok } from "@/shared/kernel/result";

describe("DomainError", () => {
  it("guarda código y se identifica como DomainError", () => {
    const error = new DomainError("NOT_FOUND", "equipo no existe");
    expect(error).toBeInstanceOf(Error);
    expect(error.code).toBe("NOT_FOUND");
    expect(error.name).toBe("DomainError");
  });
});

describe("Result", () => {
  it("ok y err distinguen el resultado", () => {
    const success = ok(42);
    const failure = err(new DomainError("VALIDATION", "dato inválido"));
    expect(success).toEqual({ ok: true, value: 42 });
    expect(failure.ok).toBe(false);
    if (!failure.ok) expect(failure.error.code).toBe("VALIDATION");
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";
import { getPublicEnv, getServerEnv } from "@/shared/env/env";

const valid = {
  NEXT_PUBLIC_SUPABASE_URL: "https://proyecto.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
  SUPABASE_SERVICE_ROLE_KEY: "service",
};

afterEach(() => vi.unstubAllEnvs());

describe("validación de entorno", () => {
  it("acepta un entorno completo", () => {
    for (const [name, value] of Object.entries(valid)) vi.stubEnv(name, value);
    expect(getServerEnv().SUPABASE_SERVICE_ROLE_KEY).toBe("service");
    expect(getPublicEnv().NEXT_PUBLIC_SUPABASE_URL).toBe(
      valid.NEXT_PUBLIC_SUPABASE_URL,
    );
  });

  it("falla nombrando la variable faltante, sin mostrar valores", () => {
    for (const [name, value] of Object.entries(valid)) vi.stubEnv(name, value);
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    expect(() => getServerEnv()).toThrow(/SUPABASE_SERVICE_ROLE_KEY/);
    expect(() => getServerEnv()).not.toThrow(/service/);
  });

  it("rechaza una URL de Supabase que no es URL", () => {
    for (const [name, value] of Object.entries(valid)) vi.stubEnv(name, value);
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "no-es-url");
    expect(() => getPublicEnv()).toThrow(/NEXT_PUBLIC_SUPABASE_URL/);
  });
});

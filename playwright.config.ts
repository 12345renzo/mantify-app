import { defineConfig, devices } from "@playwright/test";

// E2E contra la app ya levantada (`next build && next start -p 3100`) y la base real,
// con una empresa de prueba aparte. Credenciales por variables: E2E_CLAVE y los correos.
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 120_000,
  workers: 1,
  // Subir fotos y cerrar un RM toma unos segundos contra la base real.
  expect: { timeout: 15_000 },
  use: {
    baseURL: process.env.E2E_URL ?? "http://localhost:3100",
    ...devices["Desktop Firefox"],
  },
  projects: [{ name: "firefox", use: { browserName: "firefox" } }],
});

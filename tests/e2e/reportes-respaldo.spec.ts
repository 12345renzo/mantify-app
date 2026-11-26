import { readFile } from "node:fs/promises";
import { expect, test, type Page } from "@playwright/test";
import { claveDe } from "./claves";

// Respaldo de la empresa de prueba (RUC 20999999995) desde el superadmin (E2E_SUPERADMIN):
// clave mala no descarga; clave buena baja un JSON solo de esa empresa; el planificador no puede.
// Cada corrida deja un registro RESPALDO en eventos_auditoria (es lo esperado).
const SA = process.env.E2E_SUPERADMIN ?? "";
const PLAN = process.env.E2E_PLAN ?? "e2e.plan@prueba.pe";
const RUC = "20999999995";

test.skip(!SA || !claveDe(SA), "Faltan E2E_SUPERADMIN y E2E_CLAVE_SUPERADMIN");

async function entrar(page: Page, correo: string, destino: string) {
  await page.context().clearCookies();
  await page.goto("/login");
  await page.getByLabel("Correo").fill(correo);
  await page.getByLabel("Contraseña", { exact: true }).fill(claveDe(correo));
  await page.getByRole("button", { name: "Ingresar" }).click();
  await page.waitForURL(`**${destino}`);
  await page.waitForLoadState("networkidle");
}

test("respaldo: clave mala no baja, clave buena baja solo esa empresa; el planificador no", async ({
  page,
}) => {
  await entrar(page, SA, "/panel");
  await page.goto("/empresas");
  await page.waitForLoadState("networkidle");
  await page.locator("tr", { hasText: RUC }).getByRole("link").first().click();
  await page.waitForURL(/\/empresas\/[0-9a-f-]{36}$/);
  await page.waitForLoadState("networkidle");
  const empresaId = page.url().split("/").pop()!;

  const dialogo = page.getByRole("dialog", { name: "Descargar respaldo" });
  await page.getByRole("button", { name: "Respaldo (JSON)" }).click();
  await dialogo.getByLabel("Tu contraseña").fill("no-es-la-clave");
  await dialogo.getByRole("button", { name: "Descargar" }).click();
  await expect(
    dialogo.getByText("La contraseña no es correcta."),
  ).toBeVisible();

  await dialogo.getByLabel("Tu contraseña").fill(claveDe(SA));
  const [descarga] = await Promise.all([
    page.waitForEvent("download"),
    dialogo.getByRole("button", { name: "Descargar" }).click(),
  ]);
  const json = JSON.parse(await readFile((await descarga.path())!, "utf8"));
  expect(json.completo).toBe(true);
  expect(json.tablas.empresas[0].ruc).toBe(RUC);
  expect(Array.isArray(json.tablas.membresias)).toBe(true);
  // Ninguna fila de otra empresa.
  const ajenas = Object.values(
    json.tablas as Record<string, { empresa_id?: string; id?: string }[]>,
  )
    .flat()
    .filter((f) => f.empresa_id !== undefined && f.empresa_id !== empresaId);
  expect(ajenas).toHaveLength(0);

  // El planificador no ve la pantalla ni puede pedir el respaldo por la API.
  await entrar(page, PLAN, "/inicio");
  const r = await page.request.post("/api/reportes/respaldo", {
    headers: { origin: new URL(page.url()).origin },
    multipart: { empresaId, clave: claveDe(PLAN) },
  });
  expect(r.status()).toBe(403);
  await page.goto(`/empresas/${empresaId}`);
  await expect(page).not.toHaveURL(/\/empresas\//);
});

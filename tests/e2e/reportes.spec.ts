import { expect, test, type Page } from "@playwright/test";
import { claveDe } from "./claves";

// Corte 10 en la empresa de prueba: cada número del dashboard es el mismo que el contador de su
// módulo; la bandeja pone primero lo devuelto; el técnico solo ve lo suyo, sin bloques ni validaciones.
const PLAN = process.env.E2E_PLAN ?? "e2e.plan@prueba.pe";
const SUP = process.env.E2E_SUP ?? "e2e.sup@prueba.pe";
const TEC = process.env.E2E_TEC ?? "e2e.tec@prueba.pe";

test.skip(!claveDe(PLAN), "Faltan las claves E2E_CLAVE_*");

async function entrar(page: Page, correo: string) {
  await page.context().clearCookies();
  await page.goto("/login");
  await page.getByLabel("Correo").fill(correo);
  await page.getByLabel("Contraseña", { exact: true }).fill(claveDe(correo));
  await page.getByRole("button", { name: "Ingresar" }).click();
  await page.waitForURL("**/inicio");
  await page.waitForLoadState("networkidle");
}

const numero = async (p: Promise<string>) =>
  Number((await p).replace(/[^\d.-]/g, ""));

// Cifra de un bloque del dashboard.
const cifra = (page: Page, bloque: string, etiqueta: string) =>
  numero(
    page
      .locator(`[data-bloque="${bloque}"] [data-cifra="${etiqueta}"]`)
      .innerText(),
  );

// Contador de un módulo: tarjeta cuyo texto es exactamente `texto`; el número es su primer <p>.
const contador = (page: Page, texto: string) =>
  numero(
    page
      .locator("a, div")
      .filter({ has: page.getByText(texto, { exact: true }) })
      .filter({ has: page.locator("p.font-mono") })
      .last()
      .locator("p.font-mono")
      .innerText(),
  );

async function ir(page: Page, url: string) {
  await page.goto(url);
  await page.waitForLoadState("networkidle");
}

test("los números del dashboard coinciden con cada módulo y la bandeja pone primero lo devuelto", async ({
  page,
}) => {
  await entrar(page, PLAN);
  const dash = {
    engrase: {
      "Al día": await cifra(page, "Engrase", "Al día"),
      "Por vencer": await cifra(page, "Engrase", "Por vencer"),
      Vencido: await cifra(page, "Engrase", "Vencidos"),
      "Sin registro": await cifra(page, "Engrase", "Sin registro"),
    },
    neumaticos: {
      Cambiar: await cifra(page, "Neumáticos", "Cambiar"),
      Alerta: await cifra(page, "Neumáticos", "Alerta"),
      Medir: await cifra(page, "Neumáticos", "Medir"),
      OK: await cifra(page, "Neumáticos", "OK"),
    },
    preventivos: {
      Vencidos: await cifra(page, "Preventivos", "Vencidos"),
      "Próximos (7 días u horómetro)": await cifra(
        page,
        "Preventivos",
        "Por vencer",
      ),
    },
  };

  // Bandeja: ningún ítem devuelto después de uno que no lo está.
  const devueltos = await page
    .locator("[data-item]")
    .evaluateAll((els) => els.map((e) => e.textContent?.includes("Devuelto")));
  const primeroNo = devueltos.indexOf(false);
  expect(primeroNo === -1 || !devueltos.slice(primeroNo).includes(true)).toBe(
    true,
  );

  await ir(page, "/engrase");
  for (const [texto, valor] of Object.entries(dash.engrase)) {
    expect(await contador(page, texto), `engrase ${texto}`).toBe(valor);
  }
  await ir(page, "/neumaticos");
  for (const [texto, valor] of Object.entries(dash.neumaticos)) {
    expect(await contador(page, texto), `neumáticos ${texto}`).toBe(valor);
  }
  await ir(page, "/preventivos");
  for (const [texto, valor] of Object.entries(dash.preventivos)) {
    expect(await contador(page, texto), `preventivos ${texto}`).toBe(valor);
  }

  // Supervisor: su cola de validaciones coincide con "Por validar" de preventivos.
  await entrar(page, SUP);
  const porValidar = await cifra(page, "Por validar", "Preventivos");
  await ir(page, "/preventivos");
  expect(await contador(page, "Por validar")).toBe(porValidar);
});

test("técnico: su bandeja, sin bloques de gestión, sin validaciones ni costos", async ({
  page,
}) => {
  await entrar(page, TEC);
  await expect(
    page.getByRole("region", { name: "Pendientes", exact: true }),
  ).toBeVisible();
  await expect(page.locator("[data-bloque]")).toHaveCount(0);
  await expect(page.locator('[data-item^="VALIDACION:"]')).toHaveCount(0);
  await expect(page.getByText(/costo/i)).toHaveCount(0);
  await expect(
    page.getByRole("navigation", { name: "Acciones rápidas" }),
  ).toBeVisible();
  // No exporta.
  expect(
    (await page.request.get("/api/reportes/excel?modulo=equipos")).status(),
  ).toBe(403);
});

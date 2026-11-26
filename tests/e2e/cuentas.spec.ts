import { expect, test, type Page } from "@playwright/test";
import { claveDe } from "./claves";

// Desactivar y reactivar cuentas en la empresa de prueba (E2E_PLAN): crea una cuenta con persona
// nueva, la desactiva (baja el cupo y la persona queda libre), la reactiva con esa persona y entra
// con la clave nueva. Al final la deja inactiva para no gastar cupo. Cada corrida deja una cuenta
// inactiva y una persona.
const PLAN = process.env.E2E_PLAN ?? "e2e.plan@prueba.pe";
const SELLO = Date.now().toString(36);
const CORREO = `e2e.cuenta.${SELLO}@prueba.pe`;
const APELLIDO = `Cuenta ${SELLO}`;

test.skip(!claveDe(PLAN), "Faltan las claves E2E_CLAVE_*");

async function entrar(page: Page, correo: string, clave: string) {
  await page.context().clearCookies();
  await page.goto("/login");
  await page.getByLabel("Correo").fill(correo);
  await page.getByLabel("Contraseña", { exact: true }).fill(clave);
  await page.getByRole("button", { name: "Ingresar" }).click();
  await page.waitForURL("**/inicio");
}

async function cupo(page: Page) {
  const texto = await page.locator(".cifra").first().innerText();
  return Number.parseInt(texto, 10);
}

const fila = (page: Page) => page.locator("tbody tr", { hasText: CORREO });

// Las cuentas paginan de a 5 y cada corrida deja una inactiva: busca la página de esta cuenta.
async function irAFila(page: Page) {
  for (let n = 1; n <= 30; n++) {
    // Tras cerrar un modal la página se refresca y Firefox aborta el goto (NS_BINDING_ABORTED): reintentar.
    await page
      .goto(`/personal?cuentas=${n}`)
      .catch(() => page.goto(`/personal?cuentas=${n}`));
    await page.waitForLoadState("networkidle");
    if (await fila(page).count()) return;
  }
  throw new Error(`${CORREO} no aparece en las cuentas`);
}

async function claveMostrada(page: Page, dialogo: string) {
  const dlg = page.getByRole("dialog", { name: dialogo });
  const clave = await dlg.locator("code").nth(1).innerText();
  await dlg.getByRole("button", { name: "Listo, ya la copié" }).click();
  await expect(dlg).toBeHidden();
  await page.waitForLoadState("networkidle");
  return clave;
}

test("crear → desactivar (baja el cupo) → reactivar con persona → entrar", async ({
  page,
}) => {
  await entrar(page, PLAN, claveDe(PLAN));
  await page.goto("/personal");
  const inicial = await cupo(page);

  // Nadie se desactiva a sí mismo.
  await expect(
    page
      .locator("tbody tr", { hasText: PLAN })
      .getByRole("button", { name: "Desactivar" }),
  ).toHaveCount(0);

  // 1. Cuenta nueva con persona nueva.
  await page.getByRole("button", { name: "Nueva cuenta" }).click();
  const nueva = page.getByRole("dialog", { name: "Nueva cuenta" });
  await nueva.getByLabel("Rol").selectOption({ label: "Técnico" });
  await nueva.getByLabel("Correo para ingresar").fill(CORREO);
  await nueva.getByLabel("Nombres").fill("Eva");
  await nueva.getByLabel("Apellidos").fill(APELLIDO);
  await nueva.getByRole("button", { name: "Crear cuenta" }).click();
  await claveMostrada(page, "Nueva cuenta");
  await irAFila(page);
  await expect(fila(page)).toContainText(`Eva ${APELLIDO}`);
  expect(await cupo(page)).toBe(inicial + 1);

  // 2. Desactivar: queda inactiva, sin persona, y libera el cupo.
  await fila(page).getByRole("button", { name: "Desactivar" }).click();
  const aviso = page.getByRole("dialog", { name: "Desactivar cuenta" });
  await aviso.getByRole("button", { name: "Sí, desactivar" }).click();
  await expect(aviso).toBeHidden();
  await expect(fila(page)).toContainText("Inactiva");
  await expect(
    fila(page).getByRole("button", { name: "Asignar personal" }),
  ).toHaveCount(0);
  expect(await cupo(page)).toBe(inicial);

  // 3. Reactivar con la persona que quedó libre; el correo viene ya escrito.
  await fila(page).getByRole("button", { name: "Reactivar" }).click();
  const reactivar = page.getByRole("dialog", { name: "Reactivar cuenta" });
  await expect(reactivar.getByLabel("Correo para ingresar")).toHaveValue(
    CORREO,
  );
  await reactivar
    .getByLabel("Persona del personal")
    .selectOption({ label: `${APELLIDO}, Eva` });
  await reactivar
    .getByRole("button", { name: "Reactivar y generar contraseña" })
    .click();
  const clave = await claveMostrada(page, "Reactivar cuenta");
  await expect(fila(page)).toContainText(`Eva ${APELLIDO}`);
  await expect(fila(page)).not.toContainText("Inactiva");
  expect(await cupo(page)).toBe(inicial + 1);

  // 4. La cuenta reactivada entra con la clave nueva.
  await entrar(page, CORREO, clave);

  // 5. Limpieza: la deja inactiva para no gastar cupo.
  await entrar(page, PLAN, claveDe(PLAN));
  await irAFila(page);
  await fila(page).getByRole("button", { name: "Desactivar" }).click();
  await page
    .getByRole("dialog", { name: "Desactivar cuenta" })
    .getByRole("button", { name: "Sí, desactivar" })
    .click();
  await expect(fila(page)).toContainText("Inactiva");
});

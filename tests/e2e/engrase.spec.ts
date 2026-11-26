import { expect, test, type Page } from "@playwright/test";
import { claveDe } from "./claves";

// Flujo del corte 8 en la empresa de prueba (E2E_PLAN, E2E_SUP, E2E_TEC con E2E_CLAVE):
// planificador crea el plan → técnico registra un engrase incompleto (no queda al día) y uno completo
// (al día) → el planificador cambia el aviso y el estado cambia → supervisor y técnico no ven el aviso.
const PLAN = process.env.E2E_PLAN ?? "e2e.plan@prueba.pe";
const SUP = process.env.E2E_SUP ?? "e2e.sup@prueba.pe";
const TEC = process.env.E2E_TEC ?? "e2e.tec@prueba.pe";
const EQUIPO = process.env.E2E_EQUIPO_ENGRASE ?? "E2E01";
const GRASA = "EP2 E2E";

test.skip(!claveDe(TEC), "Faltan las claves E2E_CLAVE_*");

async function entrar(page: Page, correo: string) {
  await page.context().clearCookies();
  await page.goto("/login");
  await page.getByLabel("Correo").fill(correo);
  await page.getByLabel("Contraseña", { exact: true }).fill(claveDe(correo));
  await page.getByRole("button", { name: "Ingresar" }).click();
  await page.waitForURL("**/inicio");
  await page.waitForLoadState("networkidle");
}

async function ir(page: Page, url: string) {
  await page.goto(url);
  await page.waitForLoadState("networkidle");
}

const fila = (page: Page) => page.locator("tbody tr", { hasText: EQUIPO });

async function abrirEquipo(page: Page) {
  await ir(page, `/engrase?q=${EQUIPO}`);
  await expect(fila(page)).toBeVisible();
}

async function aviso(page: Page, tipo: string, valor: string) {
  await page.getByRole("button", { name: "Aviso de engrase" }).click();
  const dlg = page.getByRole("dialog", { name: "Aviso de engrase" });
  await dlg.getByLabel("Se mide en").selectOption(tipo);
  await dlg.getByLabel(/Porcentaje|Cantidad/).fill(valor);
  await dlg.getByRole("button", { name: "Guardar aviso" }).click();
  await expect(dlg).toBeHidden();
  await page.waitForLoadState("networkidle");
}

test("plan → incompleto no queda al día → completo al día → aviso cambia el estado → solo el planificador ve el aviso", async ({
  page,
}) => {
  // 0. Planificador: tipo de grasa (si falta).
  await entrar(page, PLAN);
  await ir(page, "/catalogos?c=tipos_grasa");
  if (!(await page.locator("tbody tr", { hasText: GRASA }).count())) {
    await page.getByRole("button", { name: "Nuevo", exact: true }).click();
    const dlg = page.getByRole("dialog", { name: /Nuevo/ });
    await dlg.getByLabel("Nombre").fill(GRASA);
    await dlg.getByRole("button", { name: "Crear" }).click();
    await expect(dlg).toBeHidden();
  }

  // 1. Plan cada 250 h con dos puntos; el aviso vuelve a 20 % por si quedó de otra corrida.
  await abrirEquipo(page);
  await aviso(page, "PORCENTAJE", "20");
  await fila(page).getByRole("button", { name: /plan/i }).click();
  const plan = page.getByRole("dialog", {
    name: `Plan de engrase · ${EQUIPO}`,
  });
  await plan.getByLabel("Cada cuántas horas").fill("250");
  await plan.getByLabel("Cada cuántos días").fill("");
  await plan.getByLabel("Tipo de grasa").selectOption({ label: GRASA });
  while (await plan.getByRole("button", { name: "Quitar punto 2" }).count()) {
    await plan.getByRole("button", { name: "Quitar punto 2" }).click();
  }
  await plan.getByLabel("Punto 1").fill("Tolva E2E");
  await plan.getByRole("button", { name: "Agregar punto" }).click();
  await plan.getByLabel("Punto 2").fill("Cardán E2E");
  await plan.getByRole("button", { name: "Guardar plan" }).click();
  await expect(plan).toBeHidden();
  await page.waitForLoadState("networkidle");
  await expect(fila(page)).not.toContainText("Sin plan");

  // 2. Técnico: no ve el aviso ni el plan; un registro incompleto exige observación y no deja al día.
  await entrar(page, TEC);
  await abrirEquipo(page);
  await expect(
    page.getByRole("button", { name: "Aviso de engrase" }),
  ).toHaveCount(0);
  await expect(fila(page).getByRole("button", { name: /plan/i })).toHaveCount(
    0,
  );
  const antes = await fila(page).locator("td").nth(3).innerText();
  await fila(page).getByRole("button", { name: "Registrar" }).click();
  const reg = page.getByRole("dialog", {
    name: `Registrar engrase · ${EQUIPO}`,
  });
  await reg.getByLabel("Tipo de grasa").selectOption({ label: GRASA });
  await reg.getByLabel("Tolva E2E").check();
  await reg.getByRole("button", { name: "Guardar incompleto" }).click();
  await expect(reg.getByText(/escribe la observación/i)).toBeVisible();
  await reg.getByLabel(/Observación/).fill("Cardán sin acceso");
  await reg.getByRole("button", { name: "Guardar incompleto" }).click();
  await expect(reg).toBeHidden();
  await page.waitForLoadState("networkidle");
  await expect(fila(page).locator("td").nth(3)).toHaveText(antes);

  // 3. Registro completo: queda al día.
  await fila(page).getByRole("button", { name: "Registrar" }).click();
  await reg.getByLabel("Tipo de grasa").selectOption({ label: GRASA });
  await reg.getByRole("button", { name: "Marcar todos" }).click();
  await reg.getByRole("button", { name: "Guardar engrase" }).click();
  await expect(reg).toBeHidden();
  await page.waitForLoadState("networkidle");
  await expect(fila(page)).toContainText("Al día");

  // 4. Historial: los dos registros, con el incompleto y su observación.
  await fila(page).getByRole("link", { name: EQUIPO }).click();
  await page.waitForLoadState("networkidle");
  await expect(
    page.getByText("Observación: Cardán sin acceso").first(),
  ).toBeVisible();

  // 5. Supervisor: ve el plan pero no el aviso.
  await entrar(page, SUP);
  await abrirEquipo(page);
  await expect(
    page.getByRole("button", { name: "Aviso de engrase" }),
  ).toHaveCount(0);
  await expect(fila(page).getByRole("button", { name: /plan/i })).toBeVisible();

  // 6. Planificador: aviso a 300 h fijas → por vencer; de vuelta a 20 % → al día.
  await entrar(page, PLAN);
  await abrirEquipo(page);
  await aviso(page, "HORAS", "300");
  await expect(fila(page)).toContainText("Por vencer");
  await aviso(page, "PORCENTAJE", "20");
  await expect(fila(page)).toContainText("Al día");
});

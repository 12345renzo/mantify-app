import { expect, test, type Page } from "@playwright/test";
import { claveDe } from "./claves";

// Flujo del corte 9 en la empresa de prueba (E2E_PLAN, E2E_SUP, E2E_TEC con E2E_CLAVE):
// planificador define umbrales del equipo, carga dos cubiertas y posiciones → técnico monta, mide
// (una queda "cambiar"), rota con intercambio y desmonta → supervisor recapa → nadie más ve umbrales
// y el técnico no ve costos.
const PLAN = process.env.E2E_PLAN ?? "e2e.plan@prueba.pe";
const SUP = process.env.E2E_SUP ?? "e2e.sup@prueba.pe";
const TEC = process.env.E2E_TEC ?? "e2e.tec@prueba.pe";
const EQUIPO = process.env.E2E_EQUIPO_NEUMATICOS ?? "E2E01";
const MOTIVO = "Desgaste E2E";

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

// Las listas paginan de a 5 y cada corrida suma cubiertas: busca la página donde está la fila.
async function irAFila(page: Page, url: string, texto: string) {
  for (let n = 1; n <= 30; n++) {
    await ir(page, `${url}&pagina=${n}`);
    if (await page.locator("tbody tr", { hasText: texto }).count()) return;
  }
  throw new Error(`${texto} no aparece en ${url}`);
}

async function ir(page: Page, url: string) {
  await page.goto(url);
  await page.waitForLoadState("networkidle");
}

async function guardar(page: Page, dialogo: string | RegExp, boton: string) {
  const dlg = page.getByRole("dialog", { name: dialogo });
  await dlg.getByRole("button", { name: boton }).click();
  await expect(dlg).toBeHidden();
  await page.waitForLoadState("networkidle");
}

async function irAlMapa(page: Page) {
  await ir(page, "/neumaticos");
  await page.getByRole("link", { name: EQUIPO, exact: true }).click();
  await page.waitForLoadState("networkidle");
}

const posicion = (page: Page, codigo: string) =>
  page.locator("li", {
    has: page.locator("p", { hasText: new RegExp(`^${codigo}$`) }),
  });

// Elige la opción cuyo texto contiene el código (las opciones llevan marca y cocada).
async function elegir(
  page: Page,
  dialogo: string,
  etiqueta: string,
  texto: string,
) {
  const dlg = page.getByRole("dialog", { name: dialogo });
  const valor = await dlg
    .getByLabel(etiqueta)
    .locator("option", { hasText: texto })
    .getAttribute("value");
  await dlg.getByLabel(etiqueta).selectOption(valor ?? "");
}

test("umbrales → cargar → posiciones → montar → medir → rotar → desmontar → recapar", async ({
  page,
}) => {
  const ts = Date.now().toString().slice(-6);
  const C1 = `E2E-N${ts}-1`;
  const C2 = `E2E-N${ts}-2`;

  // 0. Planificador: motivo de retiro (si falta).
  await entrar(page, PLAN);
  await ir(page, "/catalogos?c=motivos_retiro_neumatico");
  if (!(await page.locator("tbody tr", { hasText: MOTIVO }).count())) {
    await page.getByRole("button", { name: "Nuevo", exact: true }).click();
    const dlg = page.getByRole("dialog", { name: /Nuevo/ });
    await dlg.getByLabel("Nombre").fill(MOTIVO);
    await dlg.getByRole("button", { name: "Crear" }).click();
    await expect(dlg).toBeHidden();
  }

  // 1. Umbrales propios del equipo: mínima 3, alerta 6.
  await ir(page, "/neumaticos");
  await page.getByRole("button", { name: "Umbrales" }).click();
  const umb = page.getByRole("dialog", { name: "Umbrales de neumáticos" });
  await elegir(page, "Umbrales de neumáticos", "Aplicar a", EQUIPO);
  await umb.getByLabel(/Cocada mínima/).fill("3");
  await umb.getByLabel(/Cocada de alerta/).fill("6");
  await umb.getByLabel(/Medir cada/).fill("30");
  await umb.getByLabel(/Desgaste irregular/).fill("3");
  await guardar(page, "Umbrales de neumáticos", "Guardar umbrales");

  // 2. Dos cubiertas nuevas.
  for (const codigo of [C1, C2]) {
    await page.getByRole("button", { name: "Nueva cubierta" }).click();
    const dlg = page.getByRole("dialog", { name: "Nueva cubierta" });
    await dlg.getByLabel("Código").fill(codigo);
    await dlg.getByLabel("Marca").fill("Michelin");
    await dlg.getByLabel("Medida").fill("12R22.5");
    await dlg.getByLabel("Cocada nueva (mm)").fill("18");
    await dlg.getByLabel(/Costo/).fill("1200");
    await guardar(page, "Nueva cubierta", "Guardar");
  }
  await irAFila(page, "/neumaticos?vista=stock", C1);
  await expect(page.locator("tbody tr", { hasText: C1 })).toBeVisible();

  // 3. Posiciones del equipo.
  await irAlMapa(page);
  await page.getByRole("button", { name: "Posiciones" }).click();
  await page
    .getByRole("dialog", { name: "Posiciones del equipo" })
    .getByLabel("Posiciones")
    .fill("DEL-I | DEL-D");
  await guardar(page, "Posiciones del equipo", "Guardar posiciones");

  // 4. Técnico: sin umbrales, sin carga y sin costos; monta las dos.
  await entrar(page, TEC);
  await ir(page, "/neumaticos");
  await expect(page.getByRole("button", { name: "Umbrales" })).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Nueva cubierta" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("columnheader", { name: "Costo por hora" }),
  ).toHaveCount(0);
  await irAlMapa(page);
  for (const [pos, codigo] of [
    ["DEL-I", C1],
    ["DEL-D", C2],
  ]) {
    await posicion(page, pos).getByRole("button", { name: "Montar" }).click();
    await elegir(page, `Montar en ${pos}`, "Cubierta", codigo);
    await guardar(page, `Montar en ${pos}`, "Montar");
    await expect(posicion(page, pos)).toContainText(codigo);
  }

  // 5. Medir: la primera en el mínimo queda "cambiar"; la segunda OK.
  await page.getByRole("button", { name: "Medir" }).click();
  const med = page.getByRole("dialog", { name: "Medir cocada" });
  for (const p of ["interno", "centro", "externo"]) {
    await med.getByLabel(`${p} DEL-I`).fill("3");
    await med.getByLabel(`${p} DEL-D`).fill("10");
  }
  await guardar(page, "Medir cocada", "Guardar medición");
  await expect(posicion(page, "DEL-I")).toContainText("Cambiar");
  await expect(posicion(page, "DEL-D")).toContainText("OK");

  // 6. Rotar DEL-I → DEL-D: se intercambian.
  await posicion(page, "DEL-I").getByRole("button", { name: "Rotar" }).click();
  await elegir(page, "Rotar desde DEL-I", "Posición de destino", "DEL-D");
  await guardar(page, "Rotar desde DEL-I", "Rotar");
  await expect(posicion(page, "DEL-D")).toContainText(C1);
  await expect(posicion(page, "DEL-I")).toContainText(C2);

  // 7. Desmontar: la gastada a recapado, la otra a stock.
  for (const [pos, codigo, destino] of [
    ["DEL-D", C1, "RECAPADO"],
    ["DEL-I", C2, "STOCK"],
  ]) {
    await posicion(page, pos)
      .getByRole("button", { name: "Desmontar" })
      .click();
    const dlg = page.getByRole("dialog", { name: `Desmontar ${codigo}` });
    await dlg.getByLabel("Motivo").selectOption({ label: MOTIVO });
    await dlg.getByLabel("Destino").selectOption(destino);
    await guardar(page, `Desmontar ${codigo}`, "Desmontar");
    await expect(posicion(page, pos)).toContainText("Libre");
  }

  // 8. Supervisor: no ve umbrales; recapa y la cubierta vuelve a stock.
  await entrar(page, SUP);
  await irAFila(page, "/neumaticos?vista=otros", C1);
  await expect(page.getByRole("button", { name: "Umbrales" })).toHaveCount(0);
  await page
    .locator("tbody tr", { hasText: C1 })
    .getByRole("button", { name: "Recapar" })
    .click();
  const rec = page.getByRole("dialog", { name: `Recapar ${C1}` });
  await rec.getByLabel("Cocada nueva (mm)").fill("16");
  await rec.getByLabel(/Costo del recapado/).fill("300");
  await guardar(page, `Recapar ${C1}`, "Registrar recapado");
  await irAFila(page, "/neumaticos?vista=stock", C1);
  await expect(page.locator("tbody tr", { hasText: C1 })).toBeVisible();
});

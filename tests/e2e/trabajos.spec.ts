import { expect, test, type Page } from "@playwright/test";
import { claveDe } from "./claves";
import { png } from "../imagenes";

// Flujo completo del corte 5: técnico crea backlog → supervisor abre OT → técnico cierra RM
// → supervisor aprueba → COMPLETADO con historial. Usa una empresa de prueba con un técnico
// y un supervisor (E2E_TEC, E2E_SUP) con la misma clave (E2E_CLAVE) y un equipo movilizado (E2E_EQUIPO).
const TEC = process.env.E2E_TEC ?? "e2e.tec@prueba.pe";
const SUP = process.env.E2E_SUP ?? "e2e.sup@prueba.pe";
const EQUIPO = process.env.E2E_EQUIPO ?? "E2E01";

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

// Sube una imagen de firma (si ya tenía, la reemplaza). Antes prueba que un archivo que no es imagen no pasa.
async function registrarFirma(page: Page) {
  const dialogo = page.getByRole("dialog", { name: "Mi firma" });
  const archivo = dialogo.locator('input[type="file"]');
  await archivo.setInputFiles({
    name: "firma.png",
    mimeType: "text/html",
    buffer: Buffer.from("<script>alert(1)</script>"),
  });
  await expect(dialogo.getByText("Solo imágenes PNG o JPG.")).toBeVisible();
  await expect(
    dialogo.getByRole("button", { name: "Guardar firma" }),
  ).toBeDisabled();
  await archivo.setInputFiles({
    name: "firma.png",
    mimeType: "image/png",
    buffer: Buffer.from(png(300, 80)),
  });
  await expect(dialogo.getByAltText("Vista previa de tu firma")).toBeVisible();
  await dialogo.getByRole("button", { name: "Guardar firma" }).click();
  await expect(dialogo).toBeHidden();
}

async function firmaDesdePerfil(page: Page) {
  await page
    .locator("header")
    .getByRole("button", { expanded: false })
    .last()
    .click();
  await page.getByRole("menuitem", { name: "Mi firma" }).click();
  await registrarFirma(page);
}

const jpg = () => ({
  name: "foto.jpg",
  mimeType: "image/jpeg",
  // JPEG mínimo válido de 1×1 px.
  buffer: Buffer.from(
    "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=",
    "base64",
  ),
});

test("backlog → OT → RM → aprobado, con firmas e historial", async ({
  page,
}) => {
  const componente = `Bomba E2E ${Date.now()}`;

  // 1. Técnico: registra su firma y crea el backlog con una foto "antes".
  await entrar(page, TEC);
  await firmaDesdePerfil(page);
  await page.goto("/trabajos");
  await page.getByRole("button", { name: "Nuevo backlog" }).click();
  const nuevo = page.getByRole("dialog", { name: "Nuevo backlog" });
  await nuevo.getByLabel("Equipo").selectOption({ label: EQUIPO });
  await nuevo.getByLabel("Componente").fill(componente);
  await nuevo.getByLabel("Criticidad").selectOption("ALTA");
  await nuevo.getByLabel("Descripción").fill("Fuga de aceite en el sello");
  await nuevo.locator('input[type="file"]').setInputFiles(jpg());
  await nuevo.getByRole("button", { name: "Crear backlog" }).click();
  await page.waitForURL(/\/trabajos\/[0-9a-f-]{36}$/);
  const url = page.url();
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Pendiente",
  );
  // El técnico no abre OT.
  await expect(page.getByRole("button", { name: "Abrir OT" })).toHaveCount(0);

  // 2. Supervisor: abre la OT con el técnico.
  await entrar(page, SUP);
  await page.goto(url);
  await page.getByRole("button", { name: "Abrir OT" }).click();
  const ot = page.getByRole("dialog", { name: "Abrir orden de trabajo" });
  await ot
    .getByLabel("Responsable")
    .selectOption({ label: "Tito Técnico E2E" });
  await ot.getByRole("button", { name: "Abrir OT" }).click();
  await expect(ot).toBeHidden();
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "En proceso",
  );
  await expect(page.getByText(/Orden de trabajo OT-\d{4}-\d{3}/)).toBeVisible();

  // 3. Técnico: pide un repuesto y cierra con RM.
  await entrar(page, TEC);
  await page.goto(url);
  await page.getByRole("button", { name: "Pedir repuesto" }).click();
  const rq = page.getByRole("dialog", { name: "Nueva requisición" });
  await rq.getByLabel("Repuesto o material").fill("Sello de bomba");
  await rq.getByRole("button", { name: "Crear requisición" }).click();
  await expect(rq).toBeHidden();
  await expect(page.getByText(/RQ-\d{4}-\d{3}/)).toBeVisible();
  await page.getByRole("button", { name: "Cerrar con RM" }).click();
  const cierre = page.getByRole("dialog", { name: /Reporte de mantenimiento/ });
  await cierre.getByLabel("Horómetro").fill("1900");
  await cierre.getByLabel("Trabajo realizado").fill("Cambio de sello");
  await cierre.locator('input[type="file"]').setInputFiles(jpg());
  await cierre.getByRole("button", { name: "Cerrar y firmar" }).click();
  await expect(cierre).toBeHidden();
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Por validar",
  );
  // Quien cerró no valida.
  await expect(page.getByRole("button", { name: "Validar" })).toHaveCount(0);

  // 4. Supervisor: registra firma y aprueba.
  await entrar(page, SUP);
  await firmaDesdePerfil(page);
  await page.goto(url);
  await page.getByRole("button", { name: "Validar" }).click();
  const val = page.getByRole("dialog", { name: "Validar trabajo" });
  await val.getByRole("button", { name: "Aprobar y firmar" }).click();
  await expect(val).toBeHidden();
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Completado",
  );

  // Historial completo y dos firmas vigentes.
  const historial = page
    .locator("section", { hasText: "Historial" })
    .locator("li");
  await expect(historial).toHaveCount(4);
  for (const t of [
    "Backlog creado",
    "OT abierta",
    "Cerrado con RM",
    "Aprobado",
  ]) {
    await expect(historial.filter({ hasText: t })).toHaveCount(1);
  }
  const firmas = page
    .locator("section", { hasText: "Firmas" })
    .getByRole("img");
  await expect(firmas).toHaveCount(2);
  await expect(page.getByAltText("Fotos antes")).toHaveCount(1);
  await expect(page.getByAltText("Fotos después")).toHaveCount(1);
});

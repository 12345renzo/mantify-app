import { expect, test, type Page } from "@playwright/test";
import { claveDe } from "./claves";

// Flujo del corte 6 en la empresa de prueba (cuentas E2E_PLAN, E2E_SUP, E2E_TEC con E2E_CLAVE):
// planificador crea plan y actividad → programa (alerta a 5 días) → importa CSV dos veces sin duplicar
// → técnico ejecuta cruzando la medianoche y observa una actividad → backlog en la bandeja → supervisor valida.
const PLAN = process.env.E2E_PLAN ?? "e2e.plan@prueba.pe";
const SUP = process.env.E2E_SUP ?? "e2e.sup@prueba.pe";
const TEC = process.env.E2E_TEC ?? "e2e.tec@prueba.pe";
const EQUIPO = process.env.E2E_EQUIPO ?? "E2E01";
const TECNICO = "Tito Técnico E2E";

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

// "YYYY-MM-DD" de hoy + n días en Lima (la app decide con la fecha del servidor en esa zona).
function dia(n: number) {
  const hoy = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Lima",
  }).format(new Date());
  const d = new Date(`${hoy}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

test("programar → alerta → importar sin duplicar → ejecutar con cruce de medianoche → backlog → validar", async ({
  page,
}) => {
  const ts = Date.now();
  const plan = `Plan E2E ${ts}`;
  const actividad = `Revisar frenos ${ts}`;

  // 1. Planificador: nombre de plan y actividad de plantilla (tipo PM3).
  await entrar(page, PLAN);
  await ir(page, "/catalogos?c=nombres_plan_preventivo");
  await page.getByRole("button", { name: "Nuevo", exact: true }).click();
  let dlg = page.getByRole("dialog", { name: /Nuevo/ });
  await dlg.getByLabel("Nombre").fill(plan);
  await dlg.getByRole("button", { name: "Crear" }).click();
  await expect(dlg).toBeHidden();
  await ir(page, "/catalogos?c=plantillas_actividades");
  await page.getByRole("button", { name: "Nuevo", exact: true }).click();
  dlg = page.getByRole("dialog", { name: /Nuevo/ });
  await dlg.getByLabel("Descripción").fill(actividad);
  await dlg.getByLabel("Plan").selectOption("PM3");
  await dlg.getByRole("button", { name: "Crear" }).click();
  await expect(dlg).toBeHidden();

  // 2. Programa a 5 días: aparece como "Próximo".
  await ir(page, "/preventivos");
  await page.getByRole("button", { name: "Programar" }).click();
  dlg = page.getByRole("dialog", { name: "Programar preventivo" });
  await dlg.getByLabel("Equipo").selectOption({ label: EQUIPO });
  await dlg.getByLabel("Plan").selectOption({ label: plan });
  await dlg.getByLabel("Tipo").selectOption("PM3");
  await dlg.getByLabel("Fecha").fill(dia(5));
  await dlg.getByLabel("Responsable").selectOption({ label: TECNICO });
  await dlg.getByLabel("Repetir cada (días)").fill("30");
  await dlg.getByRole("button", { name: "Programar" }).click();
  await page.waitForURL(/\/preventivos\/[0-9a-f-]{36}$/);
  const url = page.url();
  const titulo = page.getByRole("heading", { level: 1 });
  await expect(titulo).toContainText("Programado");
  await expect(titulo).toContainText("Próximo");
  await expect(page.getByText(actividad)).toBeVisible();

  // 3. CSV: la misma fila ya existe (se omite), una nueva a 12 días y una con fórmula (error).
  //    Importarlo otra vez no crea nada.
  const csv = Buffer.from(
    "EQUIPO;PLAN;TIPO;FECHA;RESPONSABLE\n" +
      `${EQUIPO};${plan};PM3;${dia(5)};${TECNICO}\n` +
      `${EQUIPO};${plan};PM3;${dia(12)};Taller Externo SAC\n` +
      `=HYPERLINK("x");${plan};PM3;${dia(20)};${TECNICO}\n`,
  );
  for (const [creados, omitidos] of [
    ["1", "1"],
    ["0", "2"],
  ]) {
    await ir(page, "/preventivos");
    await page.getByRole("button", { name: "Importar CSV" }).click();
    dlg = page.getByRole("dialog", { name: "Importar preventivos desde CSV" });
    await dlg.locator('input[type="file"]').setInputFiles({
      name: "preventivos.csv",
      mimeType: "text/csv",
      buffer: csv,
    });
    await dlg.getByRole("button", { name: "Importar" }).click();
    await expect(dlg.getByText("creados")).toBeVisible();
    const cifra = (t: string) =>
      dlg.locator("div", { hasText: t }).locator("p").first();
    await expect(cifra("creados")).toHaveText(creados);
    await expect(cifra("ya existían")).toHaveText(omitidos);
    await expect(cifra("con error")).toHaveText("1");
    await expect(dlg.getByText(/fórmula/)).toBeVisible();
    await dlg.getByRole("button", { name: "Listo" }).click();
    await expect(dlg).toBeHidden();
  }
  // El de 12 días no está en alerta; el de 5 sí.
  const filas = page.locator("tbody tr", { hasText: plan });
  await expect(filas).toHaveCount(2);
  await expect(filas.filter({ hasText: "Taller Externo" })).not.toContainText(
    "Próximo",
  );
  await expect(filas.filter({ hasText: TECNICO })).toContainText("Próximo");

  // 4. Técnico: ejecuta 22:00 → 02:00 (4 h) y observa la actividad.
  await entrar(page, TEC);
  await ir(page, url);
  await page.getByRole("button", { name: "Ejecutar" }).click();
  dlg = page.getByRole("dialog", { name: /Ejecutar/ });
  await dlg.getByLabel("Turno").selectOption("NOCHE");
  await dlg.getByLabel("Hora de inicio").fill("22:00");
  await dlg.getByLabel("Hora de fin").fill("02:00");
  await expect(
    dlg.getByText("Duración: 4 h (cruza la medianoche)"),
  ).toBeVisible();
  // Todas OK (la plantilla de la empresa puede tener otras PM3) y la nuestra observada.
  const grupos = dlg.getByRole("radiogroup");
  for (let i = 0; i < (await grupos.count()); i++) {
    await grupos.nth(i).getByText("OK", { exact: true }).click();
  }
  const nuestra = dlg.getByRole("radiogroup", {
    name: `Resultado de ${actividad}`,
  });
  await nuestra.getByText("Observado").click();
  // Sin observación no pasa.
  await dlg.getByRole("button", { name: "Guardar y firmar" }).click();
  await expect(dlg.getByText(/necesita su observación/)).toBeVisible();
  await dlg
    .getByLabel(`Observación de ${actividad}`)
    .fill("Pastillas gastadas al 20 %");
  await dlg.getByRole("button", { name: "+ Agregar" }).click();
  await dlg.getByLabel("Repuesto", { exact: true }).fill("Pastillas de freno");
  await dlg.getByLabel("Cantidad").fill("4");
  await dlg.getByRole("button", { name: "Guardar y firmar" }).click();
  await expect(dlg).toBeHidden();
  await expect(titulo).toContainText("Por validar");
  await expect(page.getByText("22:00 → 02:00 · 4 h")).toBeVisible();
  await expect(page.getByText("Pastillas de freno")).toBeVisible();

  // 5. La observación genera un backlog que aparece en la bandeja de trabajos.
  await page.getByRole("button", { name: "Crear backlog" }).click();
  dlg = page.getByRole("dialog", { name: /Crear backlog/ });
  await dlg.getByLabel("Criticidad").selectOption("ALTA");
  await dlg.getByRole("button", { name: "Crear backlog" }).click();
  await expect(dlg).toBeHidden();
  const enlace = page.getByRole("link", { name: /Backlog BKL-/ });
  await expect(enlace).toBeVisible();
  const codigo = (await enlace.textContent())!.replace("Backlog ", "").trim();
  await ir(page, `/trabajos?q=${encodeURIComponent(codigo)}`);
  await expect(page.locator("tbody tr", { hasText: codigo })).toContainText(
    actividad,
  );

  // 6. Supervisor valida con su firma.
  await entrar(page, SUP);
  await ir(page, url);
  await page.getByRole("button", { name: "Validar" }).click();
  dlg = page.getByRole("dialog", { name: "Validar preventivo" });
  await dlg.getByRole("button", { name: "Aprobar y firmar" }).click();
  await expect(dlg).toBeHidden();
  await expect(titulo).toContainText("Validado");
  await expect(
    page.locator("section", { hasText: "Firmas" }).getByRole("img"),
  ).toHaveCount(2);
});

import { readSheet } from "read-excel-file/node";
import { expect, test, type Page } from "@playwright/test";
import { claveDe } from "./claves";
import { crearXlsx } from "../../src/shared/exportar/xlsx";

// Flujo del corte 7 en la empresa de prueba (E2E_PLAN, E2E_TEC con E2E_CLAVE):
// técnico registra una MCI (equipo en mantenimiento) y otra parada que se cruza (se confirma) →
// cierra ambas → el reporte diario muestra esas paradas y el PDF y el Excel las traen →
// hallazgo a backlog → planificador importa un Excel dos veces sin duplicar → ranking.
const PLAN = process.env.E2E_PLAN ?? "e2e.plan@prueba.pe";
const TEC = process.env.E2E_TEC ?? "e2e.tec@prueba.pe";
const EQUIPO = process.env.E2E_EQUIPO_PARADAS ?? "E2E-02";
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

// Hora local de Lima, n minutos atrás, en formato datetime-local.
function hace(min: number) {
  const d = new Date(Date.now() - min * 60_000 - 5 * 3_600_000);
  return d.toISOString().slice(0, 16);
}

// El catálogo no tiene datos por defecto: crea el motivo si aún no existe.
async function motivo(page: Page, codigo: string, nombre: string) {
  await ir(page, "/catalogos?c=motivos_parada");
  if (await page.locator("tbody tr", { hasText: nombre }).count()) return;
  await page.getByRole("button", { name: "Nuevo", exact: true }).click();
  const dlg = page.getByRole("dialog", { name: /Nuevo/ });
  await dlg.getByLabel("Código").selectOption(codigo);
  await dlg.getByLabel("Nombre").fill(nombre);
  if (codigo.startsWith("PM")) {
    await dlg.getByLabel("Duración estándar (h)").fill("4");
  }
  await dlg.getByRole("button", { name: "Crear" }).click();
  await expect(dlg).toBeHidden();
}

test("parada MCI → cruce confirmado → cierre → reporte, PDF y Excel → backlog → importar sin duplicar → ranking", async ({
  page,
  request,
}) => {
  const ts = Date.now();

  // 0. Planificador: motivos MCI y PM1 (si faltan).
  await entrar(page, PLAN);
  await motivo(page, "MCI", "Correctivo inmediato E2E");
  await motivo(page, "PM1", "Preventivo 1 E2E");

  // 1. Técnico registra una MCI hace 3 h: el equipo queda en mantenimiento.
  await entrar(page, TEC);
  await ir(page, "/paradas");
  await page.getByRole("button", { name: "Registrar parada" }).click();
  let dlg = page.getByRole("dialog", { name: "Registrar parada" });
  await dlg.getByLabel("Equipo").selectOption({ label: EQUIPO });
  await dlg
    .getByLabel("Motivo")
    .selectOption({ label: "MCI — Correctivo inmediato E2E" });
  await expect(dlg.getByText(/no planificada/)).toBeVisible();
  await dlg.getByLabel("Fecha y hora de parada").fill(hace(180));
  await dlg.getByLabel("Horómetro").fill(String(500 + (ts % 100000) / 1000));
  await dlg.getByLabel("Responsable").selectOption({ label: TECNICO });
  await dlg.getByRole("button", { name: "Registrar" }).click();
  await page.waitForURL(/\/paradas\/[0-9a-f-]{36}$/);
  const url1 = page.url();
  const titulo = page.getByRole("heading", { level: 1 });
  await expect(titulo).toContainText("Abierta");
  await expect(titulo).toContainText("No planificada");

  // 2. Una PM1 hace 2 h en el mismo equipo se cruza: se avisa y se confirma.
  await ir(page, "/paradas");
  await page.getByRole("button", { name: "Registrar parada" }).click();
  dlg = page.getByRole("dialog", { name: "Registrar parada" });
  await dlg.getByLabel("Equipo").selectOption({ label: EQUIPO });
  await dlg
    .getByLabel("Motivo")
    .selectOption({ label: "PM1 — Preventivo 1 E2E" });
  await dlg.getByLabel("Fecha y hora de parada").fill(hace(120));
  await dlg.getByLabel("Horómetro").fill("1");
  await dlg
    .getByLabel("Responsable")
    .selectOption({ label: "Externo (taller, proveedor)…" });
  await dlg.getByLabel("Nombre del externo").fill("Taller E2E");
  await dlg.getByRole("button", { name: "Registrar" }).click();
  await expect(dlg.getByText(/Se cruza con otra parada/)).toBeVisible();
  await dlg.getByLabel(/Confirmo el cruce/).check();
  await dlg.getByRole("button", { name: "Registrar" }).click();
  await page.waitForURL(
    (u) => /\/paradas\/[0-9a-f-]{36}$/.test(u.pathname) && u.href !== url1,
  );
  const url2 = page.url();
  await expect(page.getByText(/Se cruza con otra parada/)).toBeVisible();

  // 3. Cierra la MCI: salida antes no pasa; luego con hallazgo y cruce confirmado.
  await ir(page, url1);
  const codigo1 = (await titulo
    .locator(".font-mono")
    .first()
    .textContent())!.trim();
  await page.getByRole("button", { name: "Cerrar parada" }).click();
  dlg = page.getByRole("dialog", { name: /Cerrar/ });
  await dlg.getByLabel("Fecha y hora de salida").fill(hace(240));
  await dlg.getByLabel("Tarea realizada").fill("Cambio de manguera hidráulica");
  await dlg.getByRole("button", { name: "Cerrar parada" }).click();
  await expect(dlg.getByText(/posterior a la hora de parada/)).toBeVisible();
  await dlg.getByLabel("Fecha y hora de salida").fill(hace(30));
  await dlg.getByLabel("Hallazgo").fill(`Abrazadera rota ${ts}`);
  await dlg.getByRole("button", { name: "Cerrar parada" }).click();
  await dlg.getByLabel(/Confirmo el cruce/).check();
  await dlg.getByRole("button", { name: "Cerrar parada" }).click();
  await expect(dlg).toBeHidden();
  await expect(titulo).toContainText("Cerrada");
  await expect(page.getByText("2.5 h")).toBeVisible();

  // 4. Hallazgo → backlog con origen parada.
  await page.getByRole("button", { name: "Crear backlog" }).click();
  dlg = page.getByRole("dialog", { name: /Crear backlog/ });
  await dlg.getByLabel("Componente").fill("Abrazadera");
  await dlg.getByRole("button", { name: "Crear backlog" }).click();
  await expect(dlg).toBeHidden();
  await expect(page.getByRole("link", { name: /Backlog BKL-/ })).toBeVisible();

  // 5. Cierra la PM1.
  await ir(page, url2);
  const codigo2 = (await titulo
    .locator(".font-mono")
    .first()
    .textContent())!.trim();
  await page.getByRole("button", { name: "Cerrar parada" }).click();
  dlg = page.getByRole("dialog", { name: /Cerrar/ });
  await dlg.getByLabel("Tarea realizada").fill("PM1 completo");
  await dlg.getByRole("button", { name: "Cerrar parada" }).click();
  await dlg.getByLabel(/Confirmo el cruce/).check();
  await dlg.getByRole("button", { name: "Cerrar parada" }).click();
  await expect(dlg).toBeHidden();

  // 6. Reporte diario: las dos están; el PDF y el Excel del mes las traen.
  const hoy = hace(0).slice(0, 10);
  await ir(page, `/paradas?vista=diario&fecha=${hoy}`);
  for (const c of [codigo1, codigo2]) {
    await expect(page.locator("tbody tr", { hasText: c })).toBeVisible();
  }
  const filasPantalla = await page.locator("tbody tr").count();
  const cookies = (await page.context().cookies())
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");
  const pdf = await request.get(`/api/paradas/diario?fecha=${hoy}`, {
    headers: { cookie: cookies },
  });
  expect(pdf.status()).toBe(200);
  expect(pdf.headers()["content-type"]).toBe("application/pdf");
  const textoPdf = (await pdf.body()).toString("latin1");
  for (const c of [codigo1, codigo2]) expect(textoPdf).toContain(`(${c})`);
  expect(textoPdf.match(/\(ST-\d{6}\)/g)?.length).toBe(filasPantalla);
  const xl = await request.get(`/api/paradas/mensual?mes=${hoy.slice(0, 7)}`, {
    headers: { cookie: cookies },
  });
  expect(xl.status()).toBe(200);
  const detalle = await readSheet(await xl.body(), 2);
  const codigos = detalle.slice(1).map((f) => f[0]);
  expect(codigos).toEqual(expect.arrayContaining([codigo1, codigo2]));

  // 7. Planificador importa un Excel dos veces: la segunda no duplica y avisa de las repetidas.
  await entrar(page, PLAN);
  const archivo = Buffer.from(
    crearXlsx([
      {
        nombre: "Paradas",
        filas: [
          [
            "ID_IMPORTACION",
            "EQUIPO",
            "MOTIVO",
            "INICIO",
            "FIN",
            "HOROMETRO_INICIO",
            "HOROMETRO_FIN",
            "DESCRIPCION",
            "RESPONSABLE",
          ],
          [
            `E2E-${ts}-1`,
            EQUIPO,
            "MCI",
            "2026-01-10 08:00",
            "2026-01-10 10:00",
            1,
            2,
            "Fuga",
            TECNICO,
          ],
          [
            `E2E-${ts}-2`,
            EQUIPO,
            "MCI",
            "2026-01-11 08:00",
            "2026-01-11 07:00",
            1,
            2,
            "Mal",
            TECNICO,
          ],
        ],
      },
    ]),
  );
  for (const [creadas, repetidas] of [
    ["1", "0"],
    ["0", "1"],
  ]) {
    await ir(page, "/paradas");
    await page.getByRole("button", { name: "Importar Excel" }).click();
    dlg = page.getByRole("dialog", { name: "Importar paradas desde Excel" });
    await dlg.locator('input[type="file"]').setInputFiles({
      name: "paradas.xlsx",
      mimeType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      buffer: archivo,
    });
    await dlg.getByRole("button", { name: "Importar" }).click();
    const cifra = (t: string) =>
      dlg.locator("div", { hasText: t }).locator("p").first();
    await expect(cifra("creadas")).toHaveText(creadas);
    await expect(cifra("ya importadas")).toHaveText(repetidas);
    await expect(cifra("con error")).toHaveText("1");
    await dlg.getByRole("button", { name: "Listo" }).click();
    await expect(dlg).toBeHidden();
  }

  // 8. Ranking del mes: el equipo aparece con sus fallas no planificadas.
  await ir(page, "/paradas?vista=ranking");
  await expect(page.locator("tbody tr", { hasText: EQUIPO })).toBeVisible();
});

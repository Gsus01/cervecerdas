import { expect, test } from "@playwright/test";

test("registro, login y primera cerveza", async ({ page }) => {
  const unique = Date.now();
  const username = `Cervecerdo${unique}`;
  const email = `cervecerdo${unique}@example.com`;
  const password = "cerveza-segura-123";

  await page.goto("/register");
  await page.getByLabel("Nombre de usuario").fill(username);
  await page.getByLabel("Correo electrónico").fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill(password);
  await page.getByLabel("Confirmar contraseña").fill(password);
  await page.getByRole("button", { name: "Crear mi cuenta" }).click();

  await expect(page).toHaveURL(/\/login\?registered=1/);
  await page.getByLabel("Correo electrónico").fill(email);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();

  await expect(page).toHaveURL(/\/home/);
  await expect(page.getByLabel("0 cervezas registradas")).toBeVisible();
  await page.getByRole("button", { name: "Tipos de cerveza" }).click();
  await page.getByLabel("Nombre").fill("Lager");
  await page.getByLabel("Foto").setInputFiles({
    name: "lager.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M/wHwAF/gL+X9q7WQAAAABJRU5ErkJggg==",
      "base64",
    ),
  });
  await page.getByRole("button", { name: "Añadir tipo" }).click();
  await expect(page.getByText("Tipo Lager añadido")).toBeVisible();
  await expect(page.getByLabel("Tipo de cerveza")).toHaveValue(/.+/);
  await page.getByRole("button", { name: "Registrar cerveza" }).click();

  await expect(page.getByLabel("1 cerveza registrada")).toBeVisible();
  await expect(page.getByText("Cerveza registrada. ¡Salud!")).toBeVisible();
  await expect(page.getByText(`${username} registró una cerveza`, { exact: false })).toBeVisible();
  await expect(page.getByText("· Lager")).toBeVisible();

  await page.getByRole("link", { name: "Estadísticas" }).click();
  await expect(page).toHaveURL(/\/statistics/);
  await expect(page.getByRole("heading", { name: `Así brinda ${username}` })).toBeVisible();
  await expect(page.getByText("Total registrado")).toBeVisible();
  await expect(page.getByText("Lager").first()).toBeVisible();
  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(hasHorizontalOverflow).toBe(false);

  await page.getByRole("link", { name: "Grupo" }).click();
  await expect(page).toHaveURL(/\/competition/);
  await expect(
    page.getByRole("heading", { name: `La liga de ${username} y compañía` }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Clasificación completa" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Mapa de rondas" })).toBeVisible();
  const groupHasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(groupHasHorizontalOverflow).toBe(false);
});

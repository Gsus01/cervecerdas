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
  await page.getByRole("button", { name: "Registrar cerveza" }).click();

  await expect(page.getByLabel("1 cerveza registrada")).toBeVisible();
  await expect(page.getByText("Cerveza registrada. ¡Salud!")).toBeVisible();
  await expect(page.getByText(`${username} registró una cerveza`)).toBeVisible();
});

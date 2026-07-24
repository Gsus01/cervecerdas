import { expect, test } from "@playwright/test";

test("registro, evento y primera bebida", async ({ page }) => {
  const unique = Date.now();
  const username = `Cervecerdo${unique}`;
  const email = `cervecerdo${unique}@example.com`;
  const password = "cerveza-segura-123";
  const eventName = `Quedada E2E ${unique}`;
  const beerTypeName = `Lager ${unique}`;

  await page.goto("/register");
  await page.getByLabel("Nombre de usuario").fill(username);
  await page.getByLabel("Correo electrónico").fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill(password);
  await page.getByLabel("Confirmar contraseña").fill(password);
  await page.getByRole("button", { name: "Crear mi cuenta" }).click();

  await expect(page).toHaveURL(/\/login\?registered=1/);
  await page.getByLabel("Correo electrónico").fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();

  await expect(page).toHaveURL(/\/home/);
  await expect(
    page.getByRole("heading", { name: "Necesitas un evento para empezar" }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Gestionar eventos" })
    .first()
    .click();

  await expect(page).toHaveURL(/\/events/);
  const eventWindow = await page.evaluate(() => {
    const asLocalInputValue = (date: Date) =>
      new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
        .toISOString()
        .slice(0, 16);

    return {
      startsAt: asLocalInputValue(new Date(Date.now() - 15 * 60_000)),
      endsAt: asLocalInputValue(new Date(Date.now() + 2 * 60 * 60_000)),
    };
  });
  await page.getByLabel("Nombre", { exact: true }).fill(eventName);
  await page.getByLabel("Empieza").fill(eventWindow.startsAt);
  await page.getByLabel("Termina").fill(eventWindow.endsAt);
  await page.getByRole("button", { name: "Crear evento" }).click();

  await expect(page).toHaveURL(/\/competition\?eventId=.+/);
  await expect(
    page.getByRole("heading", { name: `La carrera de ${eventName}` }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Ir al contador" }).click();

  await expect(page).toHaveURL(/\/home\?eventId=.+/);
  const eventSelector = page.getByRole("combobox", { name: "Evento" });
  await expect(eventSelector.locator("option:checked")).toHaveText(eventName);
  await expect(page.getByText("En curso", { exact: true })).toBeVisible();
  await expect(
    page.getByLabel(`0 consumiciones registradas en ${eventName}`),
  ).toBeVisible();

  await page.getByRole("button", { name: "Catálogo de bebidas" }).click();
  const catalog = page.getByRole("dialog", { name: "Tipos de bebida" });
  await catalog.getByLabel("Nombre").fill(beerTypeName);
  await catalog.getByLabel("Foto").setInputFiles({
    name: "lager.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M/wHwAF/gL+X9q7WQAAAABJRU5ErkJggg==",
      "base64",
    ),
  });
  await catalog.getByRole("button", { name: "Añadir bebida" }).click();

  await expect(
    page.getByText(`${beerTypeName} se ha añadido al catálogo compartido`),
  ).toBeVisible();
  await expect(
    page.getByRole("combobox", { name: "Tipo de bebida" }),
  ).toHaveValue(/.+/);
  await page.getByRole("button", { name: "Registrar bebida" }).click();

  await expect(
    page.getByLabel(`1 consumición registrada en ${eventName}`),
  ).toBeVisible();
  await expect(
    page.getByText("Bebida registrada en este evento. ¡Salud!"),
  ).toBeVisible();
  await expect(
    page.getByText(`${username} registró 1 bebida`, { exact: false }),
  ).toBeVisible();
  await expect(page.getByText(`· ${beerTypeName}`)).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Ranking del evento" }),
  ).toBeVisible();

  await page.getByRole("link", { name: "Evento" }).click();
  await expect(page).toHaveURL(/\/competition\?eventId=.+/);
  await expect(
    page.getByRole("heading", { name: `La carrera de ${eventName}` }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Filtros de comparación" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Carrera acumulada" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Qué se está bebiendo" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Ritmo por hora" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Quién bebe qué" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Clasificación del evento" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: beerTypeName }),
  ).toBeVisible();

  await page.getByRole("link", { name: "Mis estadísticas" }).click();
  await expect(page).toHaveURL(/\/statistics/);
  await expect(
    page.getByRole("heading", { name: `Así brinda ${username}` }),
  ).toBeVisible();
  await expect(page.getByText("Total registrado")).toBeVisible();
  await expect(page.getByText(beerTypeName).first()).toBeVisible();

  const hasHorizontalOverflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth,
  );
  expect(hasHorizontalOverflow).toBe(false);
});

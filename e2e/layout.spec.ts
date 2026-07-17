import { expect, test } from "@playwright/test";

async function expectNoHorizontalOverflow(page: import("@playwright/test").Page) {
  const hasOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(hasOverflow).toBe(false);
}

test("login accesible en móvil, paisaje y con movimiento reducido", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/login");

  await expect(page.getByRole("heading", { name: "Inicia sesión" })).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Saltar al contenido" })).toBeFocused();
  await expect(page.getByRole("link", { name: "Saltar al contenido" })).toBeVisible();

  const transitionDuration = await page
    .getByRole("button", { name: "Entrar" })
    .evaluate((button) => Number.parseFloat(getComputedStyle(button).transitionDuration));
  expect(transitionDuration).toBeLessThanOrEqual(0.01);

  await page.evaluate(() => {
    document.documentElement.style.fontSize = "200%";
  });
  await expectNoHorizontalOverflow(page);

  await page.evaluate(() => {
    document.documentElement.style.fontSize = "";
  });
  await page.setViewportSize({ width: 667, height: 375 });
  await expect(page.getByRole("button", { name: "Entrar" })).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

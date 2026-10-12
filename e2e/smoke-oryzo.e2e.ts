import { expect, test } from "@playwright/test";

// Projet « smoke-oryzo » (port 3001, NEXT_PUBLIC_THEME_HARBOR=false) : le drapeau éteint doit servir
// l'accueil ORYZO actuel, sans changement. Lecture seule.

test("drapeau éteint : l'accueil ORYZO (champ date, entête cuivré) est servi", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "Jammix" })).toBeVisible();
  await expect(page.getByText("Les jams à Lyon, ce soir.")).toBeVisible();
  await expect(page.getByLabel("Date", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Connexion organisateur" })).toBeVisible();
  await expect(page.locator(".theme-harbor")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Aujourd'hui" })).toHaveCount(0);
});

test("drapeau éteint : une page non migrée n'est pas touchée", async ({ page }) => {
  await page.goto("/connexion");
  await expect(page.locator(".theme-harbor")).toHaveCount(0);
});

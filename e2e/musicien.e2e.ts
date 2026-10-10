import { expect, test } from "@playwright/test";

test("l'accueil affiche le titre et le choix de la date", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "Jammix" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Date" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Connexion organisateur" })).toBeVisible();
});

test("une date avec des jams les liste et mène à la page d'une jam", async ({ page }) => {
  await page.goto("/");
  // Les données changent avec le temps : on part de la première date proposée, s'il y en a une.
  const prochaineDate = page.locator('a[href^="/?date="]').first();
  test.skip((await prochaineDate.count()) === 0, "Aucune jam publiée à venir dans la base");

  await prochaineDate.click();
  await expect(page).toHaveURL(/\?date=\d{4}-\d{2}-\d{2}/);

  const lienJam = page.locator('main a[href^="/jams/"]').first();
  const nomBar = (await lienJam.textContent())!.trim();
  await lienJam.click();

  await expect(page).toHaveURL(/\/jams\/[^/]+$/);
  await expect(page.getByRole("heading", { level: 1, name: nomBar })).toBeVisible();
  await expect(page.getByRole("button", { name: "Itinéraire" })).toBeVisible();
  await expect(page.getByRole("link", { name: "← Retour" })).toHaveAttribute("href", /^\/\?date=/);
});

test("la vue carte affiche la carte", async ({ page }) => {
  await page.goto("/");
  const prochaineDate = page.locator('a[href^="/?date="]').first();
  test.skip((await prochaineDate.count()) === 0, "Aucune jam publiée à venir dans la base");

  await prochaineDate.click();
  await page.getByRole("button", { name: "Carte" }).click();
  await expect(page.locator(".maplibregl-canvas")).toBeVisible();
  await expect(page.locator(".maplibregl-marker").first()).toBeVisible();
});

test("une jam inexistante renvoie une 404 avec un message clair", async ({ page }) => {
  const reponse = await page.goto("/jams/inexistante");
  expect(reponse?.status()).toBe(404);
  await expect(page.getByText("Cette jam n'est plus disponible.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Voir les jams du jour" })).toHaveAttribute("href", "/");
});

test.describe("sur mobile", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  for (const chemin of ["/", "/connexion", "/inscription"]) {
    test(`${chemin} ne déborde pas horizontalement`, async ({ page }) => {
      await page.goto(chemin);
      const deborde = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth
      );
      expect(deborde).toBe(false);
    });
  }
});

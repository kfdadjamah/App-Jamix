import { expect, test } from "@playwright/test";

// Le test d'inscription crée un vrai compte : il le supprime en fin de test.
test.describe.configure({ mode: "serial" });

const INDICATION = "Vous pouvez rajouter les autres bars dans le profil";

test("l'indication « autres bars » est visible sous « Nom du bar »", async ({ page }) => {
  await page.goto("/inscription");
  const indication = page.getByText(INDICATION, { exact: true });
  await expect(indication).toBeVisible();
  const champNomBar = page.getByPlaceholder("Nom du bar");
  const boiteChamp = await champNomBar.boundingBox();
  const boiteIndication = await indication.boundingBox();
  expect(boiteIndication!.y).toBeGreaterThan(boiteChamp!.y + boiteChamp!.height - 1);
});

test("aucun champ « Photo ou logo » ni sélecteur de fichier", async ({ page }) => {
  await page.goto("/inscription");
  await expect(page.getByText(/Photo ou logo/)).toHaveCount(0);
  await expect(page.locator('input[type="file"]')).toHaveCount(0);
});

test("aucun débordement horizontal à 360 px", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/inscription");
  const debordement = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(debordement).toBe(false);
});

test("une inscription sans photo crée le compte et la fiche du bar, puis suppression", async ({ page }) => {
  const motDePasse = "Test-e2e-1234";
  const email = `e2e-inscription-${Date.now()}@example.com`;

  await page.goto("/inscription");
  await page.getByRole("textbox", { name: "Prénom", exact: true }).fill("Essai");
  await page.getByRole("textbox", { name: "Nom", exact: true }).fill("Inscription");
  await page.getByRole("textbox", { name: /^Email/ }).fill(email);
  await page.getByLabel(/^Mot de passe/).fill(motDePasse);
  await page.getByPlaceholder("Nom du bar").fill("Bar E2E Inscription");
  await page.getByPlaceholder("Adresse du bar").fill("1 rue de Rivoli, Paris");
  await page.getByPlaceholder("Code postal").fill("75001");
  await page.getByRole("button", { name: "Créer mon compte" }).click();
  await expect(page).not.toHaveURL(/\/inscription/, { timeout: 30_000 });

  try {
    await page.goto("/mon-profil");
    await page.getByRole("button", { name: "Mes bars" }).click();
    await expect(page.getByText("Bar E2E Inscription")).toBeVisible();
  } finally {
    await page.goto("/mon-profil");
    await page.getByRole("button", { name: "Supprimer mon compte" }).click();
    const formulaire = page
      .locator("form")
      .filter({ has: page.getByPlaceholder("Saisissez SUPPRIMER pour confirmer") });
    await formulaire.getByPlaceholder("Mot de passe actuel").fill(motDePasse);
    await formulaire.getByPlaceholder("Saisissez SUPPRIMER pour confirmer").fill("SUPPRIMER");
    await formulaire.getByRole("button", { name: "Supprimer définitivement" }).click();
    await expect(page).toHaveURL("/", { timeout: 30_000 });
  }
});

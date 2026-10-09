import { expect, type Page } from "@playwright/test";

// Compte créé par scripts/seed-test-data.mjs.
export const COMPTE_TEST = {
  email: process.env.E2E_EMAIL ?? "test-organisateur@jamix.fr",
  motDePasse: process.env.E2E_MOT_DE_PASSE ?? "test1234",
};

export async function seConnecter(page: Page) {
  await page.goto("/connexion");
  await page.getByRole("textbox", { name: /^Email/ }).fill(COMPTE_TEST.email);
  await page.getByRole("textbox", { name: /^Mot de passe/ }).fill(COMPTE_TEST.motDePasse);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL("/mes-annonces");
}

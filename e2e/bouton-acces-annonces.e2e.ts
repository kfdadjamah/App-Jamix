import { expect, test } from "@playwright/test";
import { seConnecter } from "./connexion";

// Accueil : « Accéder à mes annonces » est un bouton principal (Bleu signal #2B78BE, texte blanc).
test("accueil : « Accéder à mes annonces » est en fond Bleu signal, texte blanc", async ({ page }) => {
  await seConnecter(page);
  await page.goto("/");
  const lien = page.getByRole("link", { name: "Accéder à mes annonces" });
  await expect(lien).toBeVisible();
  await expect(lien).toHaveCSS("background-color", "rgb(43, 120, 190)");
  await expect(lien).toHaveCSS("color", "rgb(255, 255, 255)");
  await lien.hover();
  await expect(lien).toHaveCSS("background-color", "rgb(11, 54, 88)");
  await page.screenshot({ path: "test-results/accueil-bouton-bleu.png" });
});

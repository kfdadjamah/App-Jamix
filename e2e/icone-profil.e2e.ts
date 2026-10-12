import { expect, test } from "@playwright/test";
import { seConnecter } from "./connexion";

// L'icône de profil est une pastille blanche identique sur toutes les pages connectées.
test("l'icône de profil est identique sur toutes les pages", async ({ page }) => {
  await seConnecter(page);
  const fonds: string[] = [];
  for (const chemin of ["/mes-annonces", "/", "/mon-profil"]) {
    await page.goto(chemin);
    const icone = page.getByRole("link", { name: "Mon profil" }).first();
    await expect(icone).toBeVisible();
    fonds.push(await icone.evaluate((el) => getComputedStyle(el).backgroundColor));
  }
  expect(new Set(fonds).size).toBe(1);
  expect(fonds[0]).toBe("rgb(255, 255, 255)");
});

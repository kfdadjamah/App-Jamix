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

// Le bouton Déconnexion est en haut de la page profil, visible sans défiler.
test("Déconnexion est visible sans défiler sur /mon-profil", async ({ page }) => {
  await seConnecter(page);
  await page.goto("/mon-profil");
  const bouton = page.getByRole("button", { name: "Déconnexion" });
  await expect(bouton).toBeInViewport({ ratio: 1 });
  const hautBouton = await bouton.evaluate((el) => el.getBoundingClientRect().top);
  const hautSection = await page
    .getByRole("button", { name: /Mes bars/ })
    .first()
    .evaluate((el) => el.getBoundingClientRect().top);
  expect(hautBouton).toBeLessThan(hautSection);
});

// Liste « Mes bars » : adresse avec code postal, et pas de carré vide quand il n'y a pas de photo.
test("la liste des bars affiche le code postal et pas de carré photo vide", async ({ page }) => {
  await seConnecter(page);
  await page.goto("/mon-profil");
  await page.getByRole("button", { name: "Mes bars" }).click();
  await expect(page.getByText("18 rue Sainte-Hélène, 69002 Lyon")).toBeVisible();
  await expect(page.locator("main li div.border-dashed")).toHaveCount(0);
});

test("ajouter un bar exige un code postal de 5 chiffres", async ({ page }) => {
  await seConnecter(page);
  await page.goto("/mon-profil");
  await page.getByRole("button", { name: "Mes bars" }).click();
  await page.getByRole("button", { name: "Ajouter un bar" }).click();
  await page.getByRole("textbox", { name: "Nom du bar" }).fill("Bar Test CP");
  await page.getByRole("combobox").fill("1 rue Test, Lyon");
  await page.getByRole("textbox", { name: "Code postal" }).fill("69");
  await page.getByRole("button", { name: "Ajouter", exact: true }).click();
  await expect(page.getByText("Le code postal doit contenir 5 chiffres.")).toBeVisible();
});

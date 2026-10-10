import { expect, test, type Page } from "@playwright/test";
import { seConnecter } from "./connexion";

const ADRESSE = "12 Rue de la République 69001 Lyon";

async function mockerAdresses(page: Page, suggestions: string[] = [ADRESSE]) {
  await page.route("**/api/adresses*", (route) =>
    route.fulfill({ json: { suggestions } })
  );
}

async function verifierTitre(page: Page, chemin: string) {
  await page.goto(chemin);
  const h1 = page.locator("h1").first();
  await expect(h1).toBeVisible();
  const m = await h1.evaluate((el) => {
    const s = getComputedStyle(el);
    return {
      taille: s.fontSize,
      uneLigne: el.getBoundingClientRect().height <= parseFloat(s.lineHeight) + 1,
    };
  });
  expect(m.taille).toBe("24px");
  expect(m.uneLigne).toBe(true);
}

test.describe("titres uniformes à 390px", () => {
  test.use({ viewport: { width: 390, height: 800 } });
  for (const chemin of [
    "/", "/contact", "/connexion", "/inscription", "/mot-de-passe-oublie",
    "/cgu", "/mentions-legales",
  ]) {
    test(`h1 de ${chemin}`, async ({ page }) => verifierTitre(page, chemin));
  }
  test("h1 de /mes-annonces et /mon-profil", async ({ page }) => {
    await seConnecter(page);
    await verifierTitre(page, "/mes-annonces");
    await verifierTitre(page, "/mon-profil");
  });
});

test("« Retour » a une bordure de 2px et la graisse 500", async ({ page }) => {
  await page.goto("/contact");
  const style = await page.getByRole("link", { name: /Retour/ }).evaluate((el) => {
    const s = getComputedStyle(el);
    return { bordure: s.borderTopWidth, graisse: s.fontWeight };
  });
  expect(style).toEqual({ bordure: "2px", graisse: "500" });
});

test.describe("suggestions d'adresse", () => {
  test("inscription : suggestion cliquée remplit l'adresse complète", async ({ page }) => {
    await mockerAdresses(page);
    await page.goto("/inscription");
    const champ = page.getByRole("combobox");
    await champ.fill("12 rue");
    await page.getByRole("option", { name: ADRESSE }).click();
    await expect(champ).toHaveValue(ADRESSE);
  });

  test("inscription : saisie libre et API en panne, aucune erreur", async ({ page }) => {
    await page.route("**/api/adresses*", (route) => route.abort());
    await page.goto("/inscription");
    const champ = page.getByRole("combobox");
    await champ.fill("Chez Moustache, Paris");
    await expect(page.getByRole("option")).toHaveCount(0);
    await expect(champ).toHaveValue("Chez Moustache, Paris");
  });

  test("clavier : flèche + Entrée choisit, Échap ferme", async ({ page }) => {
    await mockerAdresses(page, [ADRESSE, "autre"]);
    await page.goto("/inscription");
    const champ = page.getByRole("combobox");
    await champ.fill("12 rue");
    await expect(page.getByRole("option")).toHaveCount(2);
    await champ.press("Escape");
    await expect(page.getByRole("option")).toHaveCount(0);
    await champ.fill("12 rue ");
    await champ.press("ArrowDown");
    await champ.press("Enter");
    await expect(champ).toHaveValue(ADRESSE);
  });

  test("moins de 3 caractères : pas de suggestion", async ({ page }) => {
    await mockerAdresses(page);
    await page.goto("/inscription");
    await page.getByRole("combobox").fill("12");
    await expect(page.getByRole("option")).toHaveCount(0);
  });

  test("modification d'un bar", async ({ page }) => {
    await mockerAdresses(page);
    await seConnecter(page);
    await page.goto("/mon-profil");
    await page.getByRole("button", { name: "Modifier" }).first().click();
    const champ = page.getByRole("combobox");
    await champ.fill("12 rue");
    await page.getByRole("option", { name: ADRESSE }).click();
    await expect(champ).toHaveValue(ADRESSE);
  });

  test("ajout d'un bar", async ({ page }) => {
    await mockerAdresses(page);
    await seConnecter(page);
    await page.goto("/mon-profil");
    await page.getByRole("button", { name: "Ajouter un bar" }).click();
    const champ = page.getByRole("combobox");
    await champ.fill("12 rue");
    await page.getByRole("option", { name: ADRESSE }).click();
    await expect(champ).toHaveValue(ADRESSE);
  });
});

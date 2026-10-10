import { expect, test, type Page } from "@playwright/test";
import { seConnecter } from "./connexion";

const NOM_SEED = "Camille Test";

// Les tests qui modifient le nom du compte de test s'enchaînent, puis le restaurent.
test.describe.configure({ mode: "serial" });

async function ouvrirSectionNom(page: Page) {
  await page.goto("/mon-profil");
  const bouton = page.getByRole("button", { name: "Nom et prénom" });
  await expect(bouton).toHaveAttribute("aria-expanded", "false");
  await bouton.click();
  return page.getByRole("textbox", { name: /^Nom et prénom/ });
}

test.describe("inscription", () => {
  test("« Nom et prénom » est le premier champ", async ({ page }) => {
    await page.goto("/inscription");
    const champs = page.getByRole("textbox");
    await expect(champs.first()).toHaveAccessibleName(/^Nom et prénom/);
    await expect(champs.nth(1)).toHaveAccessibleName(/^Email/);
  });

  test("un nom vide est refusé sous le champ, la saisie conservée", async ({ page }) => {
    await page.goto("/inscription");
    await page.getByRole("textbox", { name: /^Email/ }).fill("nouveau@exemple.fr");
    await page.getByRole("button", { name: "Créer mon compte" }).click();
    await expect(page.getByText("Le nom et prénom sont requis.")).toBeVisible();
    await expect(page.getByRole("textbox", { name: /^Email/ })).toHaveValue("nouveau@exemple.fr");
    await expect(page).toHaveURL("/inscription");
  });

  test("un nom de plus de 80 caractères est refusé", async ({ page }) => {
    await page.goto("/inscription");
    await page.getByRole("textbox", { name: /^Nom et prénom/ }).fill("a".repeat(81));
    await page.getByRole("button", { name: "Créer mon compte" }).click();
    await expect(page.getByText("ne doivent pas dépasser 80 caractères")).toBeVisible();
  });

  test("un nom valide ne déclenche pas d'erreur sur son champ", async ({ page }) => {
    await page.goto("/inscription");
    await page.getByRole("textbox", { name: /^Nom et prénom/ }).fill("  Camille Martin  ");
    await page.getByRole("button", { name: "Créer mon compte" }).click();
    await expect(page.getByText("L'adresse du bar est requise.")).toBeVisible();
    await expect(page.getByText("Le nom et prénom sont requis.")).toHaveCount(0);
  });
});

test.describe("profil", () => {
  test("le nom est prérempli dans la section repliée", async ({ page }) => {
    await seConnecter(page);
    await expect(await ouvrirSectionNom(page)).toHaveValue(NOM_SEED);
  });

  test("modifier le nom l'enregistre et le confirme, puis restauration", async ({ page }) => {
    await seConnecter(page);
    const champ = await ouvrirSectionNom(page);
    await champ.fill("Camille Modifiée");
    await page.locator("form").filter({ hasText: "Nom et prénom" }).getByRole("button", { name: "Enregistrer" }).click();
    await expect(page.getByText("Nom et prénom enregistrés.")).toBeVisible();

    await page.reload();
    await expect(await ouvrirSectionNom(page)).toHaveValue("Camille Modifiée");

    await (await ouvrirSectionNom(page)).fill(NOM_SEED);
    await page.locator("form").filter({ hasText: "Nom et prénom" }).getByRole("button", { name: "Enregistrer" }).click();
    await expect(page.getByText("Nom et prénom enregistrés.")).toBeVisible();
  });

  test("un compte avec nom ne peut pas le vider", async ({ page }) => {
    await seConnecter(page);
    const champ = await ouvrirSectionNom(page);
    await champ.fill("   ");
    await page.locator("form").filter({ hasText: "Nom et prénom" }).getByRole("button", { name: "Enregistrer" }).click();
    await expect(page.getByText("Le nom et prénom sont requis.")).toBeVisible();
  });
});

test.describe("compte sans nom (antérieur à la phase 35)", () => {
  async function seConnecterSansNom(page: Page) {
    await page.goto("/connexion");
    await page.getByRole("textbox", { name: /^Email/ }).fill("chezmimi@jamix.fr");
    await page.getByRole("textbox", { name: /^Mot de passe/ }).fill("test1234");
    await page.getByRole("button", { name: "Se connecter" }).click();
    await expect(page).toHaveURL("/mes-annonces");
  }

  test("se connecte, utilise Mes annonces et son profil sans être contraint", async ({ page }) => {
    await seConnecterSansNom(page);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const champ = await ouvrirSectionNom(page);
    await expect(champ).toHaveValue("");
    // Enregistrer le champ vide est accepté et ne change rien.
    await page.locator("form").filter({ hasText: "Nom et prénom" }).getByRole("button", { name: "Enregistrer" }).click();
    await expect(page.getByText("Nom et prénom enregistrés.")).toBeVisible();
  });
});

test("/cgu mentionne le nom et prénom parmi les données collectées", async ({ page }) => {
  await page.goto("/cgu");
  await expect(page.getByText(/organisateurs : nom et prénom, adresse email/)).toBeVisible();
});

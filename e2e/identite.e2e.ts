import { expect, test, type Page } from "@playwright/test";
import { seConnecter } from "./connexion";

const PRENOM_SEED = "Camille";
const NOM_SEED = "Test";

// Les tests qui modifient l'identité du compte de test s'enchaînent, puis la restaurent.
test.describe.configure({ mode: "serial" });

async function ouvrirSectionIdentite(page: Page) {
  await page.goto("/mon-profil");
  const bouton = page.getByRole("button", { name: "Nom et prénom" });
  await expect(bouton).toHaveAttribute("aria-expanded", "false");
  await bouton.click();
  return {
    prenom: page.getByRole("textbox", { name: "Prénom", exact: true }),
    nom: page.getByRole("textbox", { name: "Nom", exact: true }),
  };
}

const formulaire = (page: Page) => page.locator("form").filter({ has: page.getByRole("textbox", { name: "Prénom", exact: true }) });

test.describe("inscription", () => {
  test("« Prénom » puis « Nom » sont les deux premiers champs", async ({ page }) => {
    await page.goto("/inscription");
    const champs = page.getByRole("textbox");
    await expect(champs.nth(0)).toHaveAccessibleName("Prénom");
    await expect(champs.nth(1)).toHaveAccessibleName("Nom");
    await expect(champs.nth(2)).toHaveAccessibleName(/^Email/);
  });

  test("prénom et nom vides sont refusés sous leur champ, la saisie conservée", async ({ page }) => {
    await page.goto("/inscription");
    await page.getByRole("textbox", { name: /^Email/ }).fill("nouveau@exemple.fr");
    await page.getByRole("button", { name: "Créer mon compte" }).click();
    await expect(page.getByText("Le prénom est requis.")).toBeVisible();
    await expect(page.getByText("Le nom est requis.")).toBeVisible();
    await expect(page.getByRole("textbox", { name: /^Email/ })).toHaveValue("nouveau@exemple.fr");
    await expect(page).toHaveURL("/inscription");
  });

  test("un prénom de plus de 40 caractères est refusé", async ({ page }) => {
    await page.goto("/inscription");
    await page.getByRole("textbox", { name: "Prénom", exact: true }).fill("a".repeat(41));
    await page.getByRole("button", { name: "Créer mon compte" }).click();
    await expect(page.getByText("Le prénom ne doit pas dépasser 40 caractères.")).toBeVisible();
  });

  test("prénom et nom valides ne déclenchent pas d'erreur sur leurs champs", async ({ page }) => {
    await page.goto("/inscription");
    await page.getByRole("textbox", { name: "Prénom", exact: true }).fill("  Camille  ");
    await page.getByRole("textbox", { name: "Nom", exact: true }).fill("Martin");
    await page.getByRole("button", { name: "Créer mon compte" }).click();
    await expect(page.getByText("L'adresse du bar est requise.")).toBeVisible();
    await expect(page.getByText("Le prénom est requis.")).toHaveCount(0);
    await expect(page.getByText("Le nom est requis.")).toHaveCount(0);
  });
});

test.describe("profil", () => {
  test("prénom et nom sont préremplis, section repliée, placeholders = noms des champs", async ({ page }) => {
    await seConnecter(page);
    const champs = await ouvrirSectionIdentite(page);
    await expect(champs.prenom).toHaveValue(PRENOM_SEED);
    await expect(champs.nom).toHaveValue(NOM_SEED);
    await expect(champs.prenom).toHaveAttribute("placeholder", "Prénom");
    await expect(champs.nom).toHaveAttribute("placeholder", "Nom");
  });

  test("modifier l'identité l'enregistre et le confirme, puis restauration", async ({ page }) => {
    await seConnecter(page);
    const champs = await ouvrirSectionIdentite(page);
    await champs.prenom.fill("Camille Modifiée");
    await champs.nom.fill("Autre");
    await formulaire(page).getByRole("button", { name: "Enregistrer" }).click();
    await expect(page.getByText("Nom et prénom enregistrés.")).toBeVisible();

    await page.reload();
    const apres = await ouvrirSectionIdentite(page);
    await expect(apres.prenom).toHaveValue("Camille Modifiée");
    await expect(apres.nom).toHaveValue("Autre");

    await apres.prenom.fill(PRENOM_SEED);
    await apres.nom.fill(NOM_SEED);
    await formulaire(page).getByRole("button", { name: "Enregistrer" }).click();
    await expect(page.getByText("Nom et prénom enregistrés.")).toBeVisible();
  });

  test("un compte avec prénom ne peut pas le vider", async ({ page }) => {
    await seConnecter(page);
    const champs = await ouvrirSectionIdentite(page);
    await champs.prenom.fill("   ");
    await champs.nom.fill("   ");
    await formulaire(page).getByRole("button", { name: "Enregistrer" }).click();
    await expect(page.getByText("Le prénom est requis.")).toBeVisible();
  });
});

test.describe("compte sans prénom (antérieur à la phase 42)", () => {
  async function seConnecterSansPrenom(page: Page) {
    await page.goto("/connexion");
    await page.getByRole("textbox", { name: /^Email/ }).fill("chezmimi@jamix.fr");
    await page.getByRole("textbox", { name: /^Mot de passe/ }).fill("test1234");
    await page.getByRole("button", { name: "Se connecter" }).click();
    await expect(page).toHaveURL("/mes-annonces");
  }

  test("se connecte, utilise son profil sans être contraint", async ({ page }) => {
    await seConnecterSansPrenom(page);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const champs = await ouvrirSectionIdentite(page);
    await expect(champs.prenom).toHaveValue("");
    // Enregistrer les champs vides est accepté et ne change rien.
    await formulaire(page).getByRole("button", { name: "Enregistrer" }).click();
    await expect(page.getByText("Nom et prénom enregistrés.")).toBeVisible();
  });
});

test("/cgu mentionne le nom et prénom parmi les données collectées", async ({ page }) => {
  await page.goto("/cgu");
  await expect(page.getByText(/organisateurs : nom et prénom, adresse email/)).toBeVisible();
});

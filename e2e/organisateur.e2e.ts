import { expect, test } from "@playwright/test";
import { COMPTE_TEST, seConnecter } from "./connexion";

for (const chemin of ["/mes-annonces", "/mes-annonces/nouvelle", "/mon-profil"]) {
  test(`${chemin} redirige vers la connexion sans session`, async ({ page }) => {
    await page.goto(chemin);
    await expect(page).toHaveURL("/connexion");
  });
}

test.describe("connexion", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/connexion");
  });

  test("signale les champs vides", async ({ page }) => {
    await page.getByRole("button", { name: "Se connecter" }).click();
    await expect(page.getByText("Adresse email invalide.")).toBeVisible();
    await expect(page.getByText("Le mot de passe est requis.")).toBeVisible();
  });

  test("refuse un mauvais mot de passe", async ({ page }) => {
    await page.getByRole("textbox", { name: /^Email/ }).fill(COMPTE_TEST.email);
    await page.getByRole("textbox", { name: /^Mot de passe/ }).fill("mauvais-mot-de-passe");
    await page.getByRole("button", { name: "Se connecter" }).click();
    await expect(page.getByText("Email ou mot de passe incorrect.")).toBeVisible();
    await expect(page).toHaveURL("/connexion");
  });
});

test.describe("espace organisateur", () => {
  test.beforeEach(async ({ page }) => {
    await seConnecter(page);
  });

  test("Mes annonces affiche le titre et le bouton Nouvelle", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 1, name: "Mes annonces" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Nouvelle" })).toHaveAttribute(
      "href",
      "/mes-annonces/nouvelle"
    );
  });

  test("le filtre par bar ne garde que les annonces du bar choisi", async ({ page }) => {
    const filtres = page.locator("main button[aria-pressed]");
    test.skip((await filtres.count()) < 3, "Le compte de test a moins de deux bars");

    const bouton = filtres.nth(1);
    const nomBar = (await bouton.textContent())!.trim();
    await bouton.click();
    await expect(bouton).toHaveAttribute("aria-pressed", "true");

    const cartes = page.locator('main a[href^="/mes-annonces/c"]');
    await expect(cartes.first()).toBeVisible();
    for (const texte of await cartes.allTextContents()) {
      expect(texte.startsWith(nomBar)).toBe(true);
    }
  });

  // Le formulaire n'est jamais quitté par un lien de l'application : la garde de sortie
  // enregistrerait la saisie en brouillon.
  test("« Tous les styles » désactive les styles un par un", async ({ page }) => {
    await page.goto("/mes-annonces/nouvelle");
    await page.getByRole("checkbox", { name: "Tous les styles" }).check();
    await expect(page.getByRole("checkbox", { name: "Jazz" })).toBeDisabled();
    await expect(page.getByRole("checkbox", { name: "Rock" })).toBeDisabled();

    await page.getByRole("checkbox", { name: "Tous les styles" }).uncheck();
    await expect(page.getByRole("checkbox", { name: "Jazz" })).toBeEnabled();
  });

  test("publier un formulaire vide est refusé", async ({ page }) => {
    await page.goto("/mes-annonces/nouvelle");
    await page.getByRole("button", { name: "Publier" }).click();
    await expect(page.getByText("Au moins une date est requise.")).toBeVisible();
    await expect(page).toHaveURL("/mes-annonces/nouvelle");
  });

  test("le profil n'ouvre que « Mes bars » et la déconnexion ferme la session", async ({ page }) => {
    await page.goto("/mon-profil");
    await expect(page.getByRole("heading", { level: 1, name: "Mon profil" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Mes bars" })).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByRole("button", { name: "Email" })).toHaveAttribute("aria-expanded", "false");

    await page.getByRole("button", { name: "Déconnexion" }).click();
    await expect(page).toHaveURL("/");
    await page.goto("/mes-annonces");
    await expect(page).toHaveURL("/connexion");
  });
});

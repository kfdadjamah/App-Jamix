import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { seConnecter } from "./connexion";

const { version } = JSON.parse(readFileSync("package.json", "utf8")) as { version: string };
const MENTION = `© ${new Date().getFullYear()} Jamix · Tous droits réservés · v${version}`;

// Pied de page présent, avec copyright et version, et placé après le contenu.
async function verifierPiedDePage(page: Page) {
  const pied = page.getByRole("contentinfo");
  await expect(pied).toBeVisible();
  await expect(pied.getByText(MENTION)).toBeVisible();
  await expect(pied.getByRole("link", { name: "CGU" })).toHaveAttribute("href", "/cgu");
  const basContenu = await page.locator("main").last().evaluate((el) => el.getBoundingClientRect().bottom);
  const hautPied = await pied.evaluate((el) => el.getBoundingClientRect().top);
  expect(hautPied).toBeGreaterThanOrEqual(basContenu);
}

const PAGES_PUBLIQUES = [
  "/",
  "/jams/inexistante",
  "/connexion",
  "/inscription",
  "/mot-de-passe-oublie",
  "/reinitialiser-mot-de-passe",
  "/cgu",
];

for (const chemin of PAGES_PUBLIQUES) {
  test(`${chemin} se termine par le pied de page`, async ({ page }) => {
    await page.goto(chemin);
    await verifierPiedDePage(page);
  });
}

test("la page d'une jam se termine par le pied de page", async ({ page }) => {
  await page.goto("/");
  const prochaineDate = page.locator('a[href^="/?date="]').first();
  test.skip((await prochaineDate.count()) === 0, "Aucune jam publiée à venir dans la base");
  await prochaineDate.click();
  await page.locator('main a[href^="/jams/"]').first().click();
  await expect(page).toHaveURL(/\/jams\/[^/]+$/);
  await verifierPiedDePage(page);
});

test("« CGU » mène à la page CGU, publique, avec ses sections dans l'ordre", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("contentinfo").getByRole("link", { name: "CGU" }).click();
  await expect(page).toHaveURL("/cgu");

  await expect(
    page.getByRole("heading", { level: 1, name: "Conditions générales d'utilisation" })
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "← Retour" })).toHaveAttribute("href", "/");
  await expect(page.getByRole("contentinfo").getByRole("link", { name: "CGU" })).toHaveAttribute(
    "aria-current",
    "page"
  );
  await expect(page.locator("main h2")).toHaveText([
    "Éditeur",
    "Hébergeur",
    "Objet du service et gratuité",
    "Accès",
    "Responsabilités",
    "Propriété des contenus",
    "Données personnelles",
    "Cookies",
    "Droit applicable",
  ]);
  await expect(page.getByText(/^Mise à jour : /)).toBeVisible();
  // « Contact » n'apparaît qu'en phase 32.
  await expect(page.getByRole("contentinfo").getByRole("link", { name: "Contact" })).toHaveCount(0);
});

test.describe("à 360px", () => {
  test.use({ viewport: { width: 360, height: 740 } });

  for (const chemin of PAGES_PUBLIQUES) {
    test(`${chemin} ne déborde pas horizontalement`, async ({ page }) => {
      await page.goto(chemin);
      await expect(page.getByRole("contentinfo")).toBeVisible();
      const deborde = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth
      );
      expect(deborde).toBe(false);
    });
  }
});

test.describe("espace organisateur", () => {
  test.beforeEach(async ({ page }) => {
    await seConnecter(page);
  });

  for (const chemin of ["/mes-annonces", "/mes-annonces/nouvelle", "/mon-profil"]) {
    test(`${chemin} se termine par le pied de page`, async ({ page }) => {
      await page.goto(chemin);
      await verifierPiedDePage(page);
    });
  }

  test("une annonce se termine par le pied de page", async ({ page }) => {
    const carte = page.locator('main a[href^="/mes-annonces/c"]').first();
    test.skip((await carte.count()) === 0, "Le compte de test n'a aucune annonce");
    await carte.click();
    await expect(page).toHaveURL(/\/mes-annonces\/c/);
    await verifierPiedDePage(page);
  });

  // Lecture seule : la branche « brouillon enregistré » écrirait en base ; elle partage
  // la garde de « Retour », couverte par lib/garde-sortie.test.ts.
  test("sans changement, « CGU » quitte directement le formulaire", async ({ page }) => {
    await page.goto("/mes-annonces/nouvelle");
    await page.getByRole("contentinfo").getByRole("link", { name: "CGU" }).click();
    await expect(page).toHaveURL("/cgu");
  });

  test("sur une annonce publiée modifiée, « CGU » propose Rester ou Quitter", async ({ page }) => {
    const publiee = page.locator('main a[href^="/mes-annonces/c"]', { hasText: "Publiée" }).first();
    test.skip((await publiee.count()) === 0, "Le compte de test n'a aucune annonce publiée");
    await publiee.click();
    await expect(page).toHaveURL(/\/mes-annonces\/c/);
    const url = page.url();

    await page.locator('textarea[name="description"]').fill(`Modifiée ${Date.now()}`);
    await page.getByRole("contentinfo").getByRole("link", { name: "CGU" }).click();

    const fenetre = page.getByRole("dialog", { name: "Modifications non enregistrées" });
    await expect(fenetre).toBeVisible();
    await fenetre.getByRole("button", { name: "Rester" }).click();
    await expect(fenetre).toBeHidden();
    await expect(page).toHaveURL(url);

    await page.getByRole("contentinfo").getByRole("link", { name: "CGU" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Quitter" }).click();
    await expect(page).toHaveURL("/cgu");
  });
});

import { expect, test, type Locator, type Page } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { COMPTE_TEST, seConnecter } from "./connexion";

// Phase 53 : annulation et suppression en Erreur plein, « Confirmer » en Succès plein.
// Écrit en base de développement : l'annonce de test est créée puis supprimée à la fin.
test.describe.configure({ mode: "serial" });

const prisma = new PrismaClient();
const MS_PAR_JOUR = 24 * 60 * 60 * 1000;
const ERREUR = "rgb(179, 38, 30)";
const SUCCES = "rgb(23, 128, 126)";
const BLANC = "rgb(255, 255, 255)";
let annonceId = "";

function dansNJours(n: number) {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return new Date(d.getTime() + n * MS_PAR_JOUR);
}

async function fond(element: Locator) {
  return element.evaluate((noeud) => getComputedStyle(noeud).backgroundColor);
}

async function couleurTexte(element: Locator) {
  return element.evaluate((noeud) => getComputedStyle(noeud).color);
}

// Appuie sur le bouton sans le relâcher dessus : retourne le fond pressé.
async function fondPresse(page: Page, element: Locator) {
  await element.hover();
  await page.mouse.down();
  await page.waitForTimeout(200);
  const presse = await fond(element);
  await page.mouse.move(0, 0);
  await page.mouse.up();
  return presse;
}

async function verifierPlein(page: Page, element: Locator, couleur: string) {
  await expect(element.first()).toBeVisible();
  const cible = element.first();
  await page.mouse.move(0, 0);
  expect(await fond(cible)).toBe(couleur);
  expect(await couleurTexte(cible)).toBe(BLANC);
  const presse = await fondPresse(page, cible);
  expect(presse, "l'état pressé est plus foncé").not.toBe(couleur);
}

test.beforeAll(async () => {
  const organisateur = await prisma.organisateur.findUniqueOrThrow({
    where: { email: COMPTE_TEST.email },
    include: { bars: { orderBy: { createdAt: "asc" }, take: 1 } },
  });
  const annonce = await prisma.annonce.create({
    data: {
      barId: organisateur.bars[0].id,
      statut: "PUBLIEE",
      publieeLe: new Date(),
      estRecurrente: true,
      styles: ["Jazz"],
      instruments: [],
      occurrences: {
        create: [3, 10].map((jours) => ({
          date: dansNJours(jours),
          heureDebut: "20:00",
          heureFin: "23:00",
          statut: "PROGRAMMEE" as const,
          confirmationJ7: dansNJours(jours - 7),
        })),
      },
    },
  });
  annonceId = annonce.id;
});

test.afterAll(async () => {
  await prisma.annonce.deleteMany({ where: { id: annonceId } });
  await prisma.$disconnect();
});

test.beforeEach(async ({ page }) => {
  await seConnecter(page);
});

test("page de l'annonce : annulations en Erreur plein, Confirmer en Succès plein", async ({ page }) => {
  await page.goto(`/mes-annonces/${annonceId}`);
  await verifierPlein(page, page.getByRole("button", { name: "Annuler cette date" }), ERREUR);
  await verifierPlein(page, page.getByRole("button", { name: "Annuler toutes les dates" }), ERREUR);
  await verifierPlein(page, page.getByRole("button", { name: "Confirmer" }), SUCCES);
});

test("menu ⋯ : « Annuler » et « Supprimer » en texte Erreur, fenêtres en Erreur plein, fermeture neutre", async ({ page }) => {
  const carte = page.locator(`a[href="/mes-annonces/${annonceId}"]`).locator("..");
  const ouvrir = () => carte.getByRole("button", { name: "Actions de l'annonce" }).click();

  await ouvrir();
  expect(await couleurTexte(page.getByRole("menuitem", { name: "Annuler" }))).toBe(ERREUR);
  expect(await couleurTexte(page.getByRole("menuitem", { name: "Supprimer" }))).toBe(ERREUR);

  await page.getByRole("menuitem", { name: "Annuler" }).click();
  await verifierPlein(page, page.getByRole("button", { name: "Annuler l'annonce" }), ERREUR);
  const retour = page.getByRole("button", { name: /Retour/ });
  expect(await fond(retour)).toBe(BLANC);
  expect(await couleurTexte(retour)).not.toBe(BLANC);
  await retour.click();

  await ouvrir();
  await page.getByRole("menuitem", { name: "Supprimer" }).click();
  await verifierPlein(page, page.getByRole("button", { name: "Supprimer définitivement" }), ERREUR);
});

test("profil : « Supprimer définitivement » du compte en Erreur plein", async ({ page }) => {
  await page.goto("/mon-profil");
  await page.getByRole("button", { name: "Supprimer mon compte" }).click();
  await verifierPlein(page, page.getByRole("button", { name: "Supprimer définitivement" }), ERREUR);
});

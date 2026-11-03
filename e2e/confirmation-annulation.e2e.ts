import { expect, test, type Page } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { COMPTE_TEST, seConnecter } from "./connexion";

// Écrit en base (branche Neon de développement) : crée ses propres annonces sur le compte de test
// et les supprime à la fin.
test.describe.configure({ mode: "serial" });

const prisma = new PrismaClient();
const MS_PAR_JOUR = 24 * 60 * 60 * 1000;
const idsCrees: string[] = [];

function dansNJours(n: number) {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return new Date(d.getTime() + n * MS_PAR_JOUR);
}

async function creerAnnonce(joursDesDates: number[]) {
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
        create: joursDesDates.map((jours) => ({
          date: dansNJours(jours),
          heureDebut: "20:00",
          heureFin: "23:00",
          statut: "PROGRAMMEE" as const,
          confirmationJ7: dansNJours(jours - 7),
        })),
      },
    },
  });
  idsCrees.push(annonce.id);
  return annonce.id;
}

async function statutsEnBase(annonceId: string) {
  const occurrences = await prisma.occurrenceJam.findMany({
    where: { annonceId },
    orderBy: { date: "asc" },
  });
  return occurrences.map((occurrence) => occurrence.statut);
}

async function ouvrirPage(page: Page, annonceId: string) {
  await page.goto(`/mes-annonces/${annonceId}`);
}

test.afterAll(async () => {
  await prisma.annonce.deleteMany({ where: { id: { in: idsCrees } } });
  await prisma.$disconnect();
});

test.beforeEach(async ({ page }) => {
  await seConnecter(page);
});

test("« Annuler cette date » : fenêtre de confirmation, rien n'est annulé avant le clic final", async ({
  page,
}) => {
  const id = await creerAnnonce([30, 40]);
  await ouvrirPage(page, id);

  await page.getByRole("button", { name: "Annuler cette date" }).first().click();
  const fenetre = page.getByRole("dialog");
  await expect(fenetre.getByRole("heading", { name: "Annuler cette date ?" })).toBeVisible();
  await expect(fenetre.getByText("Cette action est définitive.")).toBeVisible();
  expect(await statutsEnBase(id)).toEqual(["PROGRAMMEE", "PROGRAMMEE"]);

  await fenetre.getByRole("button", { name: "Oui, annuler" }).click();
  await expect(fenetre).toHaveCount(0);
  await expect.poll(() => statutsEnBase(id)).toEqual(["ANNULEE", "PROGRAMMEE"]);
});

test("« Annuler toutes les dates » : fenêtre de confirmation, puis toutes les dates annulées", async ({
  page,
}) => {
  const id = await creerAnnonce([30, 40]);
  await ouvrirPage(page, id);

  await page.getByRole("button", { name: "Annuler toutes les dates" }).click();
  const fenetre = page.getByRole("dialog");
  await expect(fenetre.getByRole("heading", { name: "Annuler toutes les dates ?" })).toBeVisible();
  expect(await statutsEnBase(id)).toEqual(["PROGRAMMEE", "PROGRAMMEE"]);

  await fenetre.getByRole("button", { name: "Oui, annuler" }).click();
  await expect(fenetre).toHaveCount(0);
  await expect.poll(() => statutsEnBase(id)).toEqual(["ANNULEE", "ANNULEE"]);
});

test("« ← Retour » et Échap ferment la fenêtre sans rien annuler", async ({ page }) => {
  const id = await creerAnnonce([30, 40]);
  await ouvrirPage(page, id);
  const fenetre = page.getByRole("dialog");

  await page.getByRole("button", { name: "Annuler toutes les dates" }).click();
  await fenetre.getByRole("button", { name: "← Retour" }).click();
  await expect(fenetre).toHaveCount(0);

  await page.getByRole("button", { name: "Annuler cette date" }).first().click();
  await expect(fenetre).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(fenetre).toHaveCount(0);

  expect(await statutsEnBase(id)).toEqual(["PROGRAMMEE", "PROGRAMMEE"]);
});

test("menu ⋯ : « ← Retour » de l'étape finale revient au choix de portée, Échap ferme tout", async ({
  page,
}) => {
  const id = await creerAnnonce([30, 40]);
  await page.goto("/mes-annonces");
  const carte = page.locator(`a[href="/mes-annonces/${id}"]`).locator("../..");
  const fenetre = page.getByRole("dialog");

  await carte.getByRole("button", { name: "Actions de l'annonce" }).click();
  await page.getByRole("menuitem", { name: "Annuler" }).click();
  await fenetre.getByRole("radio", { name: "Toutes les dates" }).check();
  await fenetre.getByRole("button", { name: "Annuler l'annonce" }).click();
  await expect(fenetre.getByRole("heading", { name: "Annuler définitivement ?" })).toBeVisible();

  await fenetre.getByRole("button", { name: "← Retour" }).click();
  await expect(fenetre.getByRole("radio", { name: "Toutes les dates" })).toBeChecked();

  await fenetre.getByRole("button", { name: "Annuler l'annonce" }).click();
  await page.keyboard.press("Escape");
  await expect(fenetre).toHaveCount(0);
  expect(await statutsEnBase(id)).toEqual(["PROGRAMMEE", "PROGRAMMEE"]);
});

test("la fenêtre tient à 360px sans débordement horizontal", async ({ page }) => {
  const id = await creerAnnonce([30, 40]);
  await page.setViewportSize({ width: 360, height: 740 });
  await ouvrirPage(page, id);

  await page.getByRole("button", { name: "Annuler toutes les dates" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  const debordement = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth
  );
  expect(debordement).toBe(false);
});

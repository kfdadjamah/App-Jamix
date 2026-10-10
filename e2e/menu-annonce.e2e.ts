import { expect, test, type Page } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { COMPTE_TEST, seConnecter } from "./connexion";

// Ces tests écrivent en base (branche Neon de développement) : ils créent leurs propres annonces
// sur le compte de test et les suppriment à la fin, sans toucher aux données du seed.
test.describe.configure({ mode: "serial" });

const prisma = new PrismaClient();
const MS_PAR_JOUR = 24 * 60 * 60 * 1000;
const idsCrees: string[] = [];

function dansNJours(n: number) {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return new Date(d.getTime() + n * MS_PAR_JOUR);
}

async function creerAnnonce(statut: "BROUILLON" | "PUBLIEE", joursDesDates: number[]) {
  const organisateur = await prisma.organisateur.findUniqueOrThrow({
    where: { email: COMPTE_TEST.email },
    include: { bars: { orderBy: { createdAt: "asc" }, take: 1 } },
  });
  const annonce = await prisma.annonce.create({
    data: {
      barId: organisateur.bars[0].id,
      statut,
      publieeLe: statut === "PUBLIEE" ? new Date() : null,
      estRecurrente: joursDesDates.length > 1,
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

function carte(page: Page, annonceId: string) {
  return page.locator(`a[href="/mes-annonces/${annonceId}"]`).locator("..");
}

async function ouvrirMenu(page: Page, annonceId: string) {
  await carte(page, annonceId).getByRole("button", { name: "Actions de l'annonce" }).click();
}

test.afterAll(async () => {
  await prisma.annonce.deleteMany({ where: { id: { in: idsCrees } } });
  await prisma.$disconnect();
});

test.beforeEach(async ({ page }) => {
  await seConnecter(page);
});

test("brouillon : seule l'entrée « Modifier » est proposée, et elle ouvre l'annonce", async ({
  page,
}) => {
  const id = await creerAnnonce("BROUILLON", []);
  await page.reload();

  const bouton = carte(page, id).getByRole("button", { name: "Actions de l'annonce" });
  await expect(bouton).toHaveAttribute("aria-haspopup", "menu");
  await expect(bouton).toHaveAttribute("aria-expanded", "false");
  await bouton.click();
  await expect(bouton).toHaveAttribute("aria-expanded", "true");

  await expect(page).toHaveURL("/mes-annonces");
  await expect(page.getByRole("menuitem")).toHaveCount(1);
  await page.getByRole("menuitem", { name: "Modifier" }).click();
  await expect(page).toHaveURL(`/mes-annonces/${id}`);
});

test("Échap et clic extérieur ferment le menu", async ({ page }) => {
  const id = await creerAnnonce("PUBLIEE", [30]);
  await page.reload();

  const bouton = carte(page, id).getByRole("button", { name: "Actions de l'annonce" });
  await bouton.click();
  await expect(page.getByRole("menuitem")).toHaveCount(2);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("menu")).toHaveCount(0);
  await expect(bouton).toBeFocused();

  await bouton.click();
  await expect(page.getByRole("menu")).toBeVisible();
  await page.getByRole("heading", { level: 1 }).click();
  await expect(page.getByRole("menu")).toHaveCount(0);
});

test("annonce ponctuelle : Annuler → confirmation → date annulée, entrée « Annuler » disparue", async ({
  page,
}) => {
  const id = await creerAnnonce("PUBLIEE", [30]);
  await page.reload();

  await ouvrirMenu(page, id);
  await page.getByRole("menuitem", { name: "Annuler" }).click();
  const fenetre = page.getByRole("dialog");
  await expect(fenetre).toBeVisible();
  await expect(fenetre.getByRole("radio")).toHaveCount(0);
  await fenetre.getByRole("button", { name: "Annuler l'annonce" }).click();

  await expect(fenetre).toHaveCount(0);
  await expect(carte(page, id).getByText("Annulée")).toBeVisible();
  expect(await statutsEnBase(id)).toEqual(["ANNULEE"]);

  await ouvrirMenu(page, id);
  await expect(page.getByRole("menuitem")).toHaveCount(1);
});

test("annonce récurrente : « Cette date seulement » n'annule que la date choisie", async ({
  page,
}) => {
  const id = await creerAnnonce("PUBLIEE", [30, 40, 50]);
  await page.reload();

  await ouvrirMenu(page, id);
  await page.getByRole("menuitem", { name: "Annuler" }).click();
  const fenetre = page.getByRole("dialog");
  await expect(fenetre.getByRole("radio", { name: "Cette date seulement" })).toBeChecked();
  await fenetre.getByRole("radio").nth(2).check(); // 2e date de la liste
  await fenetre.getByRole("button", { name: "Annuler l'annonce" }).click();

  await expect(fenetre).toHaveCount(0);
  await expect(carte(page, id).getByText("Annulée")).toHaveCount(1);
  expect(await statutsEnBase(id)).toEqual(["PROGRAMMEE", "ANNULEE", "PROGRAMMEE"]);

  // La date annulée n'est plus proposée.
  await ouvrirMenu(page, id);
  await page.getByRole("menuitem", { name: "Annuler" }).click();
  await expect(page.getByRole("dialog").locator('input[name^="date-"]')).toHaveCount(2);
});

test("annonce récurrente : « Toutes les dates » annule toutes les dates", async ({ page }) => {
  const id = await creerAnnonce("PUBLIEE", [30, 40]);
  await page.reload();

  await ouvrirMenu(page, id);
  await page.getByRole("menuitem", { name: "Annuler" }).click();
  const fenetre = page.getByRole("dialog");
  await fenetre.getByRole("radio", { name: "Toutes les dates" }).check();
  await fenetre.getByRole("button", { name: "Annuler l'annonce" }).click();

  await expect(fenetre).toHaveCount(0);
  await expect(carte(page, id).getByText("Annulée")).toHaveCount(2);
  expect(await statutsEnBase(id)).toEqual(["ANNULEE", "ANNULEE"]);
});

test("« Retour » et Échap ferment la fenêtre sans rien annuler", async ({ page }) => {
  const id = await creerAnnonce("PUBLIEE", [30, 40]);
  await page.reload();

  await ouvrirMenu(page, id);
  await page.getByRole("menuitem", { name: "Annuler" }).click();
  const fenetre = page.getByRole("dialog");
  await fenetre.getByRole("button", { name: "← Retour" }).click();
  await expect(fenetre).toHaveCount(0);

  await ouvrirMenu(page, id);
  await page.getByRole("menuitem", { name: "Annuler" }).click();
  await expect(fenetre).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(fenetre).toHaveCount(0);

  expect(await statutsEnBase(id)).toEqual(["PROGRAMMEE", "PROGRAMMEE"]);
});

test("tient à 360px sans débordement horizontal, bouton tactile d'au moins 44px", async ({
  page,
}) => {
  const id = await creerAnnonce("PUBLIEE", [30, 40]);
  await page.setViewportSize({ width: 360, height: 740 });
  await page.reload();

  const bouton = carte(page, id).getByRole("button", { name: "Actions de l'annonce" });
  const boite = (await bouton.boundingBox())!;
  expect(boite.width).toBeGreaterThanOrEqual(44);
  expect(boite.height).toBeGreaterThanOrEqual(44);

  await bouton.click();
  await page.getByRole("menuitem", { name: "Annuler" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  const debordement = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth
  );
  expect(debordement).toBe(false);
});

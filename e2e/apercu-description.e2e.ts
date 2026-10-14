import { expect, test, type Page } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { COMPTE_TEST, seConnecter } from "./connexion";

// Écrit en base (branche Neon de développement) : crée ses annonces sur le compte de test,
// et les supprime à la fin, sans toucher aux données du seed.
test.describe.configure({ mode: "serial" });

const prisma = new PrismaClient();
const MS_PAR_JOUR = 24 * 60 * 60 * 1000;
const idsCrees: string[] = [];

const DESCRIPTION = "Bœuf blues ouvert à tous, venez avec vos instruments et votre bonne humeur.";
const APERCU = "Bœuf blues ouvert à tous,…";

function dansNJours(n: number) {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return new Date(d.getTime() + n * MS_PAR_JOUR);
}

async function creerAnnonce(description: string | null, titre: string | null = null, publieeLe = new Date()) {
  const orga = await prisma.organisateur.findUniqueOrThrow({
    where: { email: COMPTE_TEST.email },
    include: { bars: { orderBy: { createdAt: "asc" }, take: 1 } },
  });
  const annonce = await prisma.annonce.create({
    data: {
      barId: orga.bars[0].id,
      statut: "PUBLIEE",
      publieeLe,
      styles: ["Jazz"],
      instruments: ["Batterie"],
      titre,
      description,
      occurrences: {
        create: [
          {
            date: dansNJours(21),
            heureDebut: "20:00",
            heureFin: "23:00",
            statut: "PROGRAMMEE",
            confirmationJ7: dansNJours(14),
          },
        ],
      },
    },
    include: { occurrences: true },
  });
  idsCrees.push(annonce.id);
  return annonce;
}

async function sansDebordement(page: Page) {
  return !(await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth
  ));
}

// Supprimées après chaque test : une annonce restante fausserait les comptages du test suivant.
test.afterEach(async () => {
  await prisma.annonce.deleteMany({ where: { id: { in: idsCrees.splice(0) } } });
});

test.afterAll(async () => {
  await prisma.$disconnect();
});

test.beforeEach(async ({ page }) => {
  await seConnecter(page);
});

test("liste : « Description : » et début coupé, « Voir le détail » ouvre la jam", async ({ page }) => {
  const annonce = await creerAnnonce(DESCRIPTION);
  const jour = dansNJours(21).toISOString().slice(0, 10);
  await page.goto(`/?date=${jour}`);

  await expect(page.getByText(`Description : ${APERCU}`, { exact: true }).first()).toBeVisible();
  await expect(page.getByText(DESCRIPTION)).toHaveCount(0);

  await page.getByRole("link", { name: "Voir le détail" }).first().click();
  await expect(page).toHaveURL(`/jams/${annonce.occurrences[0].id}`);
  await expect(page.getByText(DESCRIPTION)).toBeVisible();
});

test("annonce sans description : ni aperçu ni « Voir le détail »", async ({ page }) => {
  await creerAnnonce(null);
  const jour = dansNJours(21).toISOString().slice(0, 10);
  await page.goto(`/?date=${jour}`);
  await expect(page.getByText("20:00").first()).toBeVisible();
  await expect(page.getByText("Description :")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Voir le détail" })).toHaveCount(0);
});

test("description courte affichée en entier", async ({ page }) => {
  await creerAnnonce("Inscription sur place");
  const jour = dansNJours(21).toISOString().slice(0, 10);
  await page.goto(`/?date=${jour}`);
  await expect(page.getByText("Description : Inscription sur place", { exact: true })).toBeVisible();
});

test("Mes annonces : même aperçu, lien vers la jam, sans débordement à 360 px", async ({ page }) => {
  const annonce = await creerAnnonce(DESCRIPTION);
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/mes-annonces");
  await expect(page.getByText(`Description : ${APERCU}`, { exact: true }).first()).toBeVisible();
  expect(await sansDebordement(page)).toBe(true);

  await page.locator(`a[href="/jams/${annonce.occurrences[0].id}"]`).click();
  await expect(page).toHaveURL(`/jams/${annonce.occurrences[0].id}`);
  expect(await sansDebordement(page)).toBe(true);
});

test("accueil à 360 px : mot très long sans débordement", async ({ page }) => {
  await creerAnnonce("y".repeat(45));
  await page.setViewportSize({ width: 360, height: 800 });
  const jour = dansNJours(21).toISOString().slice(0, 10);
  await page.goto(`/?date=${jour}`);
  await expect(page.getByText(`Description : ${"y".repeat(30)}…`).first()).toBeVisible();
  expect(await sansDebordement(page)).toBe(true);
});

test("titre : visible sur la carte d'accueil, la jam et dans Mes annonces", async ({ page }) => {
  const annonce = await creerAnnonce(DESCRIPTION, "Soirée blues du jeudi");
  const jour = dansNJours(21).toISOString().slice(0, 10);
  await page.goto(`/?date=${jour}`);
  await expect(page.getByText(`Description : ${APERCU}`, { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Soirée blues du jeudi").first()).toBeVisible();

  await page.goto("/mes-annonces");
  await expect(page.getByText("Soirée blues du jeudi")).toBeVisible();

  await page.goto(`/jams/${annonce.occurrences[0].id}`);
  await expect(page.getByRole("heading", { name: "Soirée blues du jeudi" })).toBeVisible();
  await expect(page.getByText(DESCRIPTION)).toBeVisible();
});

test("formulaire : titre prérempli à la modification, limité à 60 caractères", async ({ page }) => {
  const annonce = await creerAnnonce(DESCRIPTION, "Soirée blues du jeudi");
  await page.goto(`/mes-annonces/${annonce.id}`);
  const champ = page.getByLabel("Titre (option)");
  await expect(champ).toHaveValue("Soirée blues du jeudi");
  await expect(champ).toHaveAttribute("maxlength", "60");
});

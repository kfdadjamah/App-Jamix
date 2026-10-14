import { expect, test, type Page } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { COMPTE_TEST, seConnecter } from "./connexion";

// Mention de rythme (Phase 59). Écrit en base (branche Neon de développement) : crée ses annonces
// sur le compte de test et les supprime à la fin, sans toucher aux données du seed.
test.describe.configure({ mode: "serial" });

const prisma = new PrismaClient();
const MS_PAR_JOUR = 24 * 60 * 60 * 1000;
const idsCrees: string[] = [];

// Premier mardi à au moins 10 jours d'aujourd'hui, puis les mardis suivants.
function mardis(nombre: number, decalageSemaines = 0) {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  const debut = new Date(d.getTime() + 10 * MS_PAR_JOUR);
  while (debut.getUTCDay() !== 2) debut.setTime(debut.getTime() + MS_PAR_JOUR);
  return Array.from(
    { length: nombre },
    (_, i) => new Date(debut.getTime() + (i + decalageSemaines) * 7 * MS_PAR_JOUR),
  );
}

async function creerAnnonce(dates: Date[]) {
  const orga = await prisma.organisateur.findUniqueOrThrow({
    where: { email: COMPTE_TEST.email },
    include: { bars: { orderBy: { createdAt: "asc" }, take: 1 } },
  });
  const annonce = await prisma.annonce.create({
    data: {
      barId: orga.bars[0].id,
      statut: "PUBLIEE",
      publieeLe: new Date(),
      styles: ["Jazz"],
      instruments: [],
      estRecurrente: dates.length > 1,
      occurrences: {
        create: dates.map((date) => ({
          date,
          heureDebut: "20:00",
          heureFin: "23:00",
          statut: "PROGRAMMEE" as const,
          confirmationJ7: new Date(date.getTime() - 7 * MS_PAR_JOUR),
        })),
      },
    },
    include: { occurrences: { orderBy: { date: "asc" } } },
  });
  idsCrees.push(annonce.id);
  return annonce;
}

async function sansDebordement(page: Page) {
  const largeurs = await page.evaluate(() => ({
    contenu: document.documentElement.scrollWidth,
    fenetre: window.innerWidth,
  }));
  expect(largeurs.contenu).toBeLessThanOrEqual(largeurs.fenetre);
}

test.afterAll(async () => {
  await prisma.annonce.deleteMany({ where: { id: { in: idsCrees } } });
  await prisma.$disconnect();
});

test("mardis consécutifs : « Tous les mardis » en texte sur la liste, la fiche et Mes annonces", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 800 });
  const hebdo = await creerAnnonce(mardis(3));
  const occurrence = hebdo.occurrences[1];
  const jour = occurrence.date.toISOString().slice(0, 10);

  await page.goto(`/?date=${jour}`);
  // Le lien couvre la carte par un pseudo-élément : on remonte au conteneur de la carte.
  const carte = page
    .locator(`a[href="/jams/${occurrence.id}"]`)
    .locator("xpath=ancestor::div[contains(@class,'rounded-[16px]')][1]");
  const mention = carte.getByText("· Tous les mardis");
  await expect(mention).toBeVisible();
  // Texte, jamais une pastille de statut.
  await expect(mention).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  await expect(carte.getByText(/20:00 → 23:00/)).toContainText("Tous les mardis");
  await sansDebordement(page);

  await page.goto(`/jams/${occurrence.id}`);
  await expect(page.getByText("· Tous les mardis")).toBeVisible();
  await expect(page.getByText(/20:00 – 23:00/)).toContainText("Tous les mardis");
  await sansDebordement(page);

  await seConnecter(page);
  const carteOrga = page.locator(`a[href="/mes-annonces/${hebdo.id}"]`);
  await expect(carteOrga.getByText("· Tous les mardis")).toBeVisible();
  await expect(carteOrga.getByText("Récurrente", { exact: true })).toHaveCount(0);
  await sansDebordement(page);
});

test("une seule date : « Exceptionnelle » ; un mardi sur deux : « Un mardi sur deux »", async ({
  page,
}) => {
  const unique = await creerAnnonce(mardis(1, 6));
  const bimensuel = await creerAnnonce([mardis(1, 8)[0], mardis(1, 10)[0]]);

  await page.goto(`/jams/${unique.occurrences[0].id}`);
  await expect(page.getByText("· Exceptionnelle")).toBeVisible();

  await page.goto(`/jams/${bimensuel.occurrences[0].id}`);
  await expect(page.getByText("· Un mardi sur deux")).toBeVisible();

  await seConnecter(page);
  await expect(
    page.locator(`a[href="/mes-annonces/${unique.id}"]`).getByText("· Exceptionnelle"),
  ).toBeVisible();
});

import { expect, test, type Page } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { seConnecter } from "./connexion";

// Rythmes « Une semaine sur deux » et « Une fois par mois » (Phase 61). Écrit en base (branche Neon de
// développement) : les annonces créées portent la description MARQUEUR et sont supprimées à la fin.
test.describe.configure({ mode: "serial" });
test.use({ viewport: { width: 360, height: 800 } });

const prisma = new PrismaClient();
const MS_PAR_JOUR = 24 * 60 * 60 * 1000;
const MARQUEUR = "e2e-phase-61";

function iso(date: Date) {
  return date.toISOString().slice(0, 10);
}

function isoDans(jours: number) {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return iso(new Date(d.getTime() + jours * MS_PAR_JOUR));
}

// 1er jour du mois `decalage` mois après le mois courant, et dernier jour de ce mois.
function premierDuMois(decalage: number) {
  const d = new Date();
  return iso(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + decalage, 1)));
}
function dernierDuMois(decalage: number) {
  const d = new Date();
  return iso(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + decalage + 1, 0)));
}

// 1 = lundi … 7 = dimanche, comme le champ « Jour ».
function jourSemaine(date: string) {
  return String(((new Date(date).getUTCDay() + 6) % 7) + 1);
}

async function annoncesDuTest() {
  return prisma.annonce.findMany({
    where: { description: MARQUEUR },
    include: { occurrences: { orderBy: { date: "asc" } } },
    orderBy: { createdAt: "asc" },
  });
}

async function ouvrirFormulaire(page: Page) {
  await page.goto("/mes-annonces/nouvelle");
  const bar = page.locator('select[name="barId"]');
  if ((await bar.inputValue()) === "") await bar.selectOption({ index: 1 });
  await page.locator('input[name="heureDebut"]').fill("20:00");
  await page.getByRole("checkbox", { name: "Jazz" }).check();
  await page.locator('textarea[name="description"]').fill(MARQUEUR);
}

async function sansDebordement(page: Page) {
  const largeurs = await page.evaluate(() => ({
    contenu: document.documentElement.scrollWidth,
    fenetre: window.innerWidth,
  }));
  expect(largeurs.contenu).toBeLessThanOrEqual(largeurs.fenetre);
}

test.beforeEach(async ({ page }) => {
  await seConnecter(page);
});

test.afterAll(async () => {
  await prisma.annonce.deleteMany({ where: { description: MARQUEUR } });
  await prisma.$disconnect();
});

test("une semaine sur deux : dates espacées de 14 jours, mention « Un … sur deux »", async ({ page }) => {
  await ouvrirFormulaire(page);
  await page.getByLabel("Rythme").selectOption("UNE_SEMAINE_SUR_DEUX");
  await expect(page.locator('select[name="semaineDuMois"]')).toHaveCount(0);

  const premiere = isoDans(2);
  await page.locator('select[name="jourSemaine"]').selectOption(jourSemaine(premiere));
  await page.getByLabel("Date de début").fill(isoDans(0));
  await page.getByLabel("Date de fin").fill(isoDans(2 + 10 * 7));
  await expect(page.getByText("6 dates")).toBeVisible();
  await sansDebordement(page);

  await page.getByRole("button", { name: "Publier" }).click();
  await expect(page).toHaveURL("/mes-annonces");

  const [annonce] = await annoncesDuTest();
  expect(annonce).toMatchObject({ rythme: "UNE_SEMAINE_SUR_DEUX", semaineDuMois: null });
  const dates = annonce.occurrences.map((o) => o.date.getTime());
  expect(iso(annonce.occurrences[0].date)).toBe(premiere);
  expect(dates).toHaveLength(6);
  expect(dates.slice(1).every((date, i) => date - dates[i] === 14 * MS_PAR_JOUR)).toBe(true);

  const jour = new Date(premiere).toLocaleDateString("fr-FR", { weekday: "long", timeZone: "UTC" });
  const carte = page.locator(`a[href="/mes-annonces/${annonce.id}"]`);
  await expect(carte.getByText(`· Un ${jour} sur deux`)).toBeVisible();
});

test("dernier jeudi du mois sur 6 mois : 6 dates, « Semaine du mois » seulement en mensuel", async ({
  page,
}) => {
  await ouvrirFormulaire(page);
  const semaine = page.locator('select[name="semaineDuMois"]');
  await expect(semaine).toHaveCount(0);

  await page.getByLabel("Rythme").selectOption("MENSUEL");
  await expect(semaine).toBeVisible();
  await expect(semaine).toHaveValue("");
  await page.locator('select[name="jourSemaine"]').selectOption("4");
  await page.getByLabel("Date de début").fill(premierDuMois(1));
  await page.getByLabel("Date de fin").fill(dernierDuMois(6));
  // Règle incomplète sans semaine du mois : pas d'aperçu.
  await expect(page.getByRole("button", { name: /^Retirer le / })).toHaveCount(0);

  await semaine.selectOption("-1");
  await expect(page.getByText("6 dates")).toBeVisible();
  await sansDebordement(page);

  // Retour à l'hebdomadaire : le champ disparaît.
  await page.getByLabel("Rythme").selectOption("CHAQUE_SEMAINE");
  await expect(semaine).toHaveCount(0);
  await page.getByLabel("Rythme").selectOption("MENSUEL");
  await expect(page.getByText("6 dates")).toBeVisible();

  await page.getByRole("button", { name: "Publier" }).click();
  await expect(page).toHaveURL("/mes-annonces");

  const [, annonce] = await annoncesDuTest();
  expect(annonce).toMatchObject({ rythme: "MENSUEL", jourSemaine: 4, semaineDuMois: -1 });
  expect(annonce.occurrences).toHaveLength(6);
  for (const { date } of annonce.occurrences) {
    expect(date.getUTCDay()).toBe(4);
    // Dernier jeudi : une semaine plus tard, on change de mois.
    expect(new Date(date.getTime() + 7 * MS_PAR_JOUR).getUTCMonth()).not.toBe(date.getUTCMonth());
  }
  expect(new Set(annonce.occurrences.map((o) => o.date.getUTCMonth())).size).toBe(6);

  const carte = page.locator(`a[href="/mes-annonces/${annonce.id}"]`);
  await expect(carte.getByText("· Le dernier jeudi du mois")).toBeVisible();
});

test("1er vendredi du mois : mention « Le 1er vendredi du mois » ; sans semaine, publication refusée", async ({
  page,
}) => {
  await ouvrirFormulaire(page);
  await page.getByLabel("Rythme").selectOption("MENSUEL");
  await page.locator('select[name="jourSemaine"]').selectOption("5");
  await page.getByLabel("Date de début").fill(premierDuMois(1));
  await page.getByLabel("Date de fin").fill(dernierDuMois(3));

  await page.getByRole("button", { name: "Publier" }).click();
  await expect(
    page.getByText("Choisissez un jour, une semaine du mois, une date de début et une date de fin.")
  ).toBeVisible();
  expect(await annoncesDuTest()).toHaveLength(2);

  await page.locator('select[name="semaineDuMois"]').selectOption("1");
  await expect(page.getByText("3 dates")).toBeVisible();
  await page.getByRole("button", { name: "Publier" }).click();
  await expect(page).toHaveURL("/mes-annonces");

  const [, , annonce] = await annoncesDuTest();
  expect(annonce.occurrences.every(({ date }) => date.getUTCDay() === 5 && date.getUTCDate() <= 7)).toBe(
    true
  );
  const carte = page.locator(`a[href="/mes-annonces/${annonce.id}"]`);
  await expect(carte.getByText("· Le 1er vendredi du mois")).toBeVisible();
});

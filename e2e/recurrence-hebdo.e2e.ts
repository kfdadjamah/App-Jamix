import { expect, test, type Page } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { seConnecter } from "./connexion";

// Jam récurrente / exceptionnelle, rythme hebdomadaire (Phase 60). Écrit en base (branche Neon de
// développement) : les annonces créées portent la description MARQUEUR et sont supprimées à la fin.
test.describe.configure({ mode: "serial" });
test.use({ viewport: { width: 360, height: 800 } });

const prisma = new PrismaClient();
const MS_PAR_JOUR = 24 * 60 * 60 * 1000;
const MARQUEUR = "e2e-phase-60";

function isoDans(jours: number) {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return new Date(d.getTime() + jours * MS_PAR_JOUR).toISOString().slice(0, 10);
}

// 1 = lundi … 7 = dimanche, comme le champ « Jour ».
function jourSemaine(iso: string) {
  return String(((new Date(iso).getUTCDay() + 6) % 7) + 1);
}

async function annoncesDuTest() {
  return prisma.annonce.findMany({
    where: { description: MARQUEUR },
    include: { occurrences: { orderBy: { date: "asc" } } },
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

async function remplirRegle(page: Page, jour: string, debut: string, fin: string) {
  await page.locator('select[name="jourSemaine"]').selectOption(jour);
  await page.getByLabel("Date de début").fill(debut);
  await page.getByLabel("Date de fin").fill(fin);
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

test("13 semaines : aperçu de 13 dates, une retirée, J-7 par date, recalcul serveur", async ({
  page,
}) => {
  await ouvrirFormulaire(page);
  await expect(page.getByRole("radio", { name: "Jam récurrente" })).toBeChecked();
  await expect(page.getByLabel("Rythme")).toHaveValue("CHAQUE_SEMAINE");

  // Première date dans 3 jours (directement confirmée), puis toutes les semaines sur 12 semaines.
  const premiere = isoDans(3);
  const jour = jourSemaine(premiere);
  await remplirRegle(page, jour, isoDans(0), isoDans(3 + 12 * 7));

  await expect(page.getByText("13 dates")).toBeVisible();
  const pastilles = page.getByRole("button", { name: /^Retirer le / });
  await expect(pastilles).toHaveCount(13);
  await sansDebordement(page);

  const retiree = isoDans(3 + 2 * 7);
  await page.getByRole("button", { name: `Retirer le ${retiree}` }).click();
  await expect(page.getByText("12 dates")).toBeVisible();

  // Une date forgée côté client est ignorée : le serveur recalcule depuis la règle.
  const forgee = isoDans(4);
  await page.evaluate((date) => {
    const champ = document.createElement("input");
    champ.type = "hidden";
    champ.name = "dates";
    champ.value = date;
    document.querySelector("form")!.appendChild(champ);
  }, forgee);

  await page.getByRole("button", { name: "Publier" }).click();
  await expect(page).toHaveURL("/mes-annonces");

  const [annonce] = await annoncesDuTest();
  const dates = annonce.occurrences.map((o) => o.date.toISOString().slice(0, 10));
  expect(annonce).toMatchObject({
    statut: "PUBLIEE",
    estRecurrente: true,
    rythme: "CHAQUE_SEMAINE",
    jourSemaine: Number(jour),
  });
  expect(dates).toHaveLength(12);
  expect(dates).not.toContain(retiree);
  expect(dates).not.toContain(forgee);
  expect(annonce.datesRetirees.map((d) => d.toISOString().slice(0, 10))).toEqual([retiree]);
  expect(new Set(annonce.occurrences.map((o) => o.date.getUTCDay())).size).toBe(1);
  // J-7 évalué pour chaque date : la première (J+3) est confirmée, les suivantes programmées.
  expect(annonce.occurrences[0].statut).toBe("CONFIRMEE");
  expect(annonce.occurrences.slice(1).every((o) => o.statut === "PROGRAMMEE")).toBe(true);

  // La date retirée n'apparaît ni dans « Mes annonces » ni côté musicien.
  const carte = page.locator(`a[href="/mes-annonces/${annonce.id}"]`);
  await expect(carte).toBeVisible();
  await expect(carte.getByText(/· Tous les /)).toBeVisible();
  // 12 dates : 6 pastilles puis « + 6 autres dates » (Phase 63).
  await expect(carte.getByRole("listitem")).toHaveCount(7);
  await expect(carte.getByText("+ 6 autres dates")).toBeVisible();
  const pastille = (iso: string) => {
    const libelle = new Date(iso).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      timeZone: "UTC",
    });
    return carte.getByText(new RegExp(`^${libelle} ·`));
  };
  await expect(pastille(dates[2])).toBeVisible();
  await expect(pastille(retiree)).toHaveCount(0);
  // Témoin : la date suivante affiche bien l'annonce (sa description) côté musicien.
  await page.goto(`/?date=${dates[2]}`);
  await expect(page.getByText(MARQUEUR)).toBeVisible();
  await page.goto(`/?date=${retiree}`);
  await expect(page.getByText(MARQUEUR)).toHaveCount(0);
  await sansDebordement(page);
});

test("bornes invalides ou aucune date : publication refusée, rien n'est enregistré", async ({
  page,
}) => {
  const avant = (await annoncesDuTest()).length;
  await ouvrirFormulaire(page);
  const publier = page.getByRole("button", { name: "Publier" });

  await remplirRegle(page, "2", isoDans(20), isoDans(10));
  await publier.click();
  await expect(page.getByText("La date de fin doit suivre la date de début.").first()).toBeVisible();

  await page.getByLabel("Date de fin").fill(isoDans(20 + 400));
  await publier.click();
  await expect(page.getByText("La récurrence ne peut pas dépasser 12 mois.").first()).toBeVisible();

  // Début et fin le même jour, qui n'est pas celui choisi.
  const debut = isoDans(20);
  const autreJour = String((Number(jourSemaine(debut)) % 7) + 1);
  await remplirRegle(page, autreJour, debut, debut);
  await publier.click();
  await expect(
    page.getByText("Aucune date ne correspond à ce rythme entre ces deux dates.").first()
  ).toBeVisible();
  await sansDebordement(page);

  await expect(page).toHaveURL("/mes-annonces/nouvelle");
  expect((await annoncesDuTest()).length).toBe(avant);
});

test("jam exceptionnelle sans date : « Choisissez une date. »", async ({ page }) => {
  await ouvrirFormulaire(page);
  await page.getByRole("radio", { name: "Jam exceptionnelle" }).check();
  await expect(page.locator('select[name="jourSemaine"]')).toHaveCount(0);
  await page.getByRole("button", { name: "Publier" }).click();
  await expect(page.getByText("Choisissez une date.")).toBeVisible();
  await expect(page).toHaveURL("/mes-annonces/nouvelle");
});

test("le brouillon s'enregistre avec une règle incomplète et la retrouve", async ({ page }) => {
  await ouvrirFormulaire(page);
  await page.getByLabel("Date de début").fill(isoDans(10));
  await page.getByRole("button", { name: "Enregistrer le brouillon" }).click();
  await expect(page).toHaveURL("/mes-annonces");

  const brouillon = (await annoncesDuTest()).find((a) => a.statut === "BROUILLON");
  expect(brouillon).toMatchObject({ estRecurrente: true, rythme: "CHAQUE_SEMAINE", jourSemaine: null });
  expect(brouillon!.occurrences).toHaveLength(0);

  await page.goto(`/mes-annonces/${brouillon!.id}`);
  await expect(page.getByRole("radio", { name: "Jam récurrente" })).toBeChecked();
  await expect(page.getByLabel("Date de début")).toHaveValue(isoDans(10));
  await expect(page.locator('select[name="jourSemaine"]')).toHaveValue("");
});

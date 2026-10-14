import { expect, test, type Page } from "@playwright/test";
import { PrismaClient, type StatutOccurrence } from "@prisma/client";
import { COMPTE_TEST, seConnecter } from "./connexion";

// Modifier la règle d'une annonce publiée (Phase 62). Écrit en base (branche Neon de développement) :
// les annonces créées portent la description MARQUEUR et sont supprimées à la fin.
test.describe.configure({ mode: "serial" });
test.use({ viewport: { width: 360, height: 800 } });

const prisma = new PrismaClient();
const MS_PAR_JOUR = 24 * 60 * 60 * 1000;
const MARQUEUR = "e2e-phase-62";

function isoDans(jours: number) {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return new Date(d.getTime() + jours * MS_PAR_JOUR).toISOString().slice(0, 10);
}

// 1 = lundi … 7 = dimanche, comme le champ « Jour ».
function jourSemaine(iso: string) {
  return ((new Date(iso).getUTCDay() + 6) % 7) + 1;
}

type DateCreee = { jours: number; statut?: StatutOccurrence };

async function creerAnnonce(
  regle: { jourSemaine: number; debut: number; fin: number } | null,
  dates: DateCreee[]
) {
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
      description: MARQUEUR,
      styles: ["Jazz"],
      instruments: [],
      ...(regle
        ? {
            rythme: "CHAQUE_SEMAINE" as const,
            jourSemaine: regle.jourSemaine,
            debutRecurrence: new Date(isoDans(regle.debut)),
            finRecurrence: new Date(isoDans(regle.fin)),
          }
        : {}),
      occurrences: {
        create: dates.map(({ jours, statut }) => ({
          date: new Date(isoDans(jours)),
          heureDebut: "20:00",
          statut: statut ?? (jours > 7 ? "PROGRAMMEE" : "CONFIRMEE"),
          confirmationJ7: !statut && jours > 7 ? new Date(isoDans(jours - 7)) : null,
        })),
      },
    },
  });
  return annonce.id;
}

async function occurrences(annonceId: string) {
  return prisma.occurrenceJam.findMany({ where: { annonceId }, orderBy: { date: "asc" } });
}

const parDate = (liste: Awaited<ReturnType<typeof occurrences>>) =>
  Object.fromEntries(liste.map((o) => [o.date.toISOString().slice(0, 10), o]));

async function enregistrer(page: Page) {
  await page.getByRole("button", { name: "Enregistrer les modifications" }).click();
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

test("règle modifiée : fenêtre, « Retour » ne change rien, puis dates communes gardées", async ({
  page,
}) => {
  // Tous les X de J-4 à J+31 : J-4 (passée), J+3, J+10 (confirmée à la main), J+17 (annulée), J+24, J+31.
  const jour = jourSemaine(isoDans(3));
  const id = await creerAnnonce({ jourSemaine: jour, debut: -4, fin: 31 }, [
    { jours: -4, statut: "CONFIRMEE" },
    { jours: 3 },
    { jours: 10, statut: "CONFIRMEE" },
    { jours: 17, statut: "ANNULEE" },
    { jours: 24 },
    { jours: 31 },
  ]);
  const avant = await occurrences(id);

  await page.goto(`/mes-annonces/${id}`);
  await expect(page.getByRole("radio", { name: "Jam récurrente" })).toBeChecked();
  // Début déjà passé, inchangé : accepté tel quel.
  await expect(page.getByLabel("Date de début")).toHaveValue(isoDans(-4));
  await expect(page.getByText("5 dates")).toBeVisible();
  await expect(page.getByText("Appliquer l'horaire à")).toBeVisible();

  // Un X sur deux à partir de J-4, prolongé jusqu'à J+45 : J+10, J+24, J+38 à venir.
  await page.getByLabel("Rythme").selectOption("UNE_SEMAINE_SUR_DEUX");
  await page.getByLabel("Date de fin").fill(isoDans(45));
  await page.locator('input[name="heureDebut"]').fill("21:00");
  await expect(page.getByText("3 dates")).toBeVisible();
  await expect(page.getByText("Appliquer l'horaire à")).toHaveCount(0);
  await sansDebordement(page);

  const fenetre = page.getByRole("dialog");
  await enregistrer(page);
  await expect(fenetre.getByRole("heading", { name: "Recréer les dates ?" })).toBeVisible();
  await expect(fenetre.getByText("Les dates passées ne changent pas.")).toBeVisible();
  await expect(fenetre.getByRole("button", { name: "Retour" })).toBeFocused();
  await sansDebordement(page);
  await fenetre.getByRole("button", { name: "Retour" }).click();
  await expect(fenetre).toHaveCount(0);
  // Échap équivaut à « Retour ».
  await enregistrer(page);
  await page.keyboard.press("Escape");
  await expect(fenetre).toHaveCount(0);
  expect(await occurrences(id)).toEqual(avant);
  await expect(page).toHaveURL(`/mes-annonces/${id}`);

  await enregistrer(page);
  await fenetre.getByRole("button", { name: "Recréer les dates" }).click();
  await expect(page.getByText("La modification a été prise en compte.")).toBeVisible();

  const apres = parDate(await occurrences(id));
  const anciennes = parDate(avant);
  expect(Object.keys(apres)).toEqual([isoDans(-4), isoDans(10), isoDans(24), isoDans(38)]);
  // La date passée ne bouge pas ; les dates communes gardent leur occurrence et leur statut.
  expect(apres[isoDans(-4)].id).toBe(anciennes[isoDans(-4)].id);
  expect(apres[isoDans(10)]).toMatchObject({ id: anciennes[isoDans(10)].id, statut: "CONFIRMEE" });
  expect(apres[isoDans(24)].id).toBe(anciennes[isoDans(24)].id);
  // La nouvelle date suit J-7 évaluée maintenant et prend l'horaire du formulaire.
  expect(apres[isoDans(38)].statut).toBe("PROGRAMMEE");
  expect(apres[isoDans(38)].confirmationJ7?.toISOString().slice(0, 10)).toBe(isoDans(31));
  expect(Object.values(apres).every((o) => o.heureDebut === "21:00")).toBe(true);
  const annonce = await prisma.annonce.findUniqueOrThrow({ where: { id } });
  expect(annonce).toMatchObject({ rythme: "UNE_SEMAINE_SUR_DEUX", jourSemaine: jour });
  expect(annonce.finRecurrence?.toISOString().slice(0, 10)).toBe(isoDans(45));
});

test("horaire seul : pas de fenêtre, aucune date recréée, portée inchangée", async ({ page }) => {
  const jour = jourSemaine(isoDans(3));
  const id = await creerAnnonce({ jourSemaine: jour, debut: 0, fin: 17 }, [
    { jours: 3 },
    { jours: 10 },
    { jours: 17 },
  ]);
  const avant = await occurrences(id);

  await page.goto(`/mes-annonces/${id}`);
  await page.locator('input[name="heureDebut"]').fill("19:30");
  await page.locator('textarea[name="description"]').fill(`${MARQUEUR}`);
  // Portée ciblée : seule la 2e date change d'horaire.
  await page.locator("select").filter({ hasText: "Toutes les dates" }).selectOption({ index: 2 });
  await enregistrer(page);
  await expect(page.getByRole("heading", { name: "Recréer les dates ?" })).toHaveCount(0);
  await expect(page.getByText("La modification a été prise en compte.")).toBeVisible();

  const apres = await occurrences(id);
  expect(apres.map((o) => o.id)).toEqual(avant.map((o) => o.id));
  expect(apres.map((o) => o.heureDebut)).toEqual(["20:00", "19:30", "20:00"]);
});

test("ancienne annonce sans règle : ses dates à venir une à une, puis passage à un rythme", async ({
  page,
}) => {
  const id = await creerAnnonce(null, [
    { jours: -3, statut: "CONFIRMEE" },
    { jours: 5 },
    { jours: 9 },
    { jours: 20 },
  ]);
  const avant = parDate(await occurrences(id));

  await page.goto(`/mes-annonces/${id}`);
  await expect(page.getByText("Dates choisies une à une")).toBeVisible();
  await expect(page.getByRole("button", { name: /^Retirer le / })).toHaveCount(3);
  await sansDebordement(page);

  // Tous les X (jour de J+5) de J+5 à J+26 : J+5, J+12, J+19, J+26.
  await page.locator('select[name="jourSemaine"]').selectOption(String(jourSemaine(isoDans(5))));
  await page.getByLabel("Date de début").fill(isoDans(0));
  await page.getByLabel("Date de fin").fill(isoDans(26));
  await expect(page.getByText("4 dates")).toBeVisible();
  await expect(page.getByText("Dates choisies une à une")).toHaveCount(0);

  await enregistrer(page);
  await page.getByRole("button", { name: "Recréer les dates" }).click();
  await expect(page.getByText("La modification a été prise en compte.")).toBeVisible();

  const apres = parDate(await occurrences(id));
  expect(Object.keys(apres)).toEqual([isoDans(-3), isoDans(5), isoDans(12), isoDans(19), isoDans(26)]);
  expect(apres[isoDans(-3)].id).toBe(avant[isoDans(-3)].id);
  expect(apres[isoDans(5)].id).toBe(avant[isoDans(5)].id);
  expect(await prisma.annonce.findUniqueOrThrow({ where: { id } })).toMatchObject({
    rythme: "CHAQUE_SEMAINE",
    jourSemaine: jourSemaine(isoDans(5)),
  });
});

test("une date supprimée par « Cette date seulement » ne revient pas après une recréation", async ({
  page,
}) => {
  const jour = jourSemaine(isoDans(3));
  const id = await creerAnnonce({ jourSemaine: jour, debut: 0, fin: 24 }, [
    { jours: 3 },
    { jours: 10 },
    { jours: 17 },
    { jours: 24 },
  ]);

  await page.goto("/mes-annonces");
  const carte = page.locator(`a[href="/mes-annonces/${id}"]`).locator("..");
  await carte.getByRole("button", { name: "Actions de l'annonce" }).click();
  await page.getByRole("menuitem", { name: "Supprimer" }).click();
  const fenetre = page.getByRole("dialog");
  await expect(fenetre.getByRole("radio", { name: "Cette date seulement" })).toBeChecked();
  await fenetre.getByRole("radio").nth(2).check(); // 2e date : J+10
  await fenetre.getByRole("button", { name: "Supprimer définitivement" }).click();
  await expect(fenetre).toHaveCount(0);

  const annonce = await prisma.annonce.findUniqueOrThrow({ where: { id } });
  expect(annonce.datesRetirees.map((d) => d.toISOString().slice(0, 10))).toEqual([isoDans(10)]);

  // Prolongée d'une semaine : J+31 s'ajoute, J+10 reste absente.
  await page.goto(`/mes-annonces/${id}`);
  await expect(page.getByText("3 dates")).toBeVisible();
  await page.getByLabel("Date de fin").fill(isoDans(31));
  await expect(page.getByText("4 dates")).toBeVisible();
  await enregistrer(page);
  await page.getByRole("button", { name: "Recréer les dates" }).click();
  await expect(page.getByText("La modification a été prise en compte.")).toBeVisible();

  const dates = Object.keys(parDate(await occurrences(id)));
  expect(dates).toEqual([isoDans(3), isoDans(17), isoDans(24), isoDans(31)]);
});

import { expect, test } from "@playwright/test";
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

async function creerAnnonce(
  statut: "BROUILLON" | "PUBLIEE",
  occurrences: { jours: number; annulee?: boolean }[]
) {
  const organisateur = await prisma.organisateur.findUniqueOrThrow({
    where: { email: COMPTE_TEST.email },
    include: { bars: { orderBy: { createdAt: "asc" }, take: 1 } },
  });
  const annonce = await prisma.annonce.create({
    data: {
      barId: organisateur.bars[0].id,
      statut,
      publieeLe: statut === "PUBLIEE" ? new Date() : null,
      estRecurrente: occurrences.length > 1,
      styles: ["Jazz"],
      instruments: [],
      occurrences: {
        create: occurrences.map(({ jours, annulee }) => ({
          date: dansNJours(jours),
          heureDebut: "20:00",
          heureFin: "23:00",
          statut: annulee ? ("ANNULEE" as const) : ("PROGRAMMEE" as const),
          confirmationJ7: annulee ? null : dansNJours(jours - 7),
        })),
      },
    },
    include: { occurrences: { orderBy: { date: "asc" } } },
  });
  idsCrees.push(annonce.id);
  return annonce;
}

test.afterAll(async () => {
  await prisma.annonce.deleteMany({ where: { id: { in: idsCrees } } });
  await prisma.$disconnect();
});

test.beforeEach(async ({ page }) => {
  await seConnecter(page);
});

test("annonce publiée : pop-up puis on reste sur la modification avec les valeurs enregistrées", async ({ page }) => {
  const annonce = await creerAnnonce("PUBLIEE", [{ jours: 10, annulee: true }, { jours: 20 }]);
  const adresse = `/mes-annonces/${annonce.id}`;
  await page.goto(adresse);
  const description = page.getByLabel(/Description/);
  await description.fill("Description modifiée par le test");
  await page.getByRole("button", { name: "Enregistrer les modifications" }).click();

  const fenetre = page.getByRole("dialog");
  await expect(fenetre).toBeVisible();
  await expect(fenetre).toContainText("La modification a été prise en compte");
  await fenetre.getByRole("button", { name: "OK" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page).toHaveURL(adresse);
  await expect(page.getByLabel(/Description/)).toHaveValue("Description modifiée par le test");

  // Après un rechargement, les valeurs enregistrées sont bien en base.
  await page.reload();
  await expect(page.getByLabel(/Description/)).toHaveValue("Description modifiée par le test");
});

test("Échap ferme le pop-up et laisse sur la modification", async ({ page }) => {
  const annonce = await creerAnnonce("PUBLIEE", [{ jours: 15 }]);
  const adresse = `/mes-annonces/${annonce.id}`;
  await page.goto(adresse);
  await page.getByRole("button", { name: "Enregistrer les modifications" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page).toHaveURL(adresse);
});

test("brouillon : pop-up puis on reste sur la modification", async ({ page }) => {
  const annonce = await creerAnnonce("BROUILLON", [{ jours: 15 }]);
  const adresse = `/mes-annonces/${annonce.id}`;
  await page.goto(adresse);
  await page.getByRole("button", { name: "Enregistrer le brouillon" }).click();
  const fenetre = page.getByRole("dialog");
  await expect(fenetre).toContainText("La modification a été prise en compte");
  await fenetre.getByRole("button", { name: "OK" }).click();
  await expect(page).toHaveURL(adresse);
  await expect(page.getByRole("button", { name: "Enregistrer le brouillon" })).toBeVisible();
});

test("brouillon publié : pop-up puis modification en mode annonce publiée", async ({ page }) => {
  const annonce = await creerAnnonce("BROUILLON", [{ jours: 15 }]);
  const adresse = `/mes-annonces/${annonce.id}`;
  await page.goto(adresse);
  await page.getByRole("button", { name: "Publier" }).click();
  const fenetre = page.getByRole("dialog");
  await expect(fenetre).toContainText("La modification a été prise en compte");
  await fenetre.getByRole("button", { name: "OK" }).click();
  await expect(page).toHaveURL(adresse);
  await expect(page.getByRole("button", { name: "Enregistrer les modifications" })).toBeVisible();
});

test("annonce sans date à venir : on reste sur la modification", async ({ page }) => {
  const annonce = await creerAnnonce("PUBLIEE", [{ jours: 15, annulee: true }]);
  const adresse = `/mes-annonces/${annonce.id}`;
  await page.goto(adresse);
  await page.getByRole("button", { name: "Enregistrer les modifications" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "OK" }).click();
  await expect(page).toHaveURL(adresse);
});

test("Retour mène à Mes annonces après un enregistrement", async ({ page }) => {
  const annonce = await creerAnnonce("PUBLIEE", [{ jours: 15 }]);
  await page.goto(`/mes-annonces/${annonce.id}`);
  await page.getByRole("button", { name: "Enregistrer les modifications" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "OK" }).click();
  await page.getByRole("link", { name: "Retour" }).click();
  await expect(page).toHaveURL("/mes-annonces");
});

test("échec : message affiché, pas de pop-up, formulaire conservé", async ({ page }) => {
  const annonce = await creerAnnonce("PUBLIEE", [{ jours: 15 }]);
  await page.goto(`/mes-annonces/${annonce.id}`);
  await page.route("**/mes-annonces/**", (route) =>
    route.request().method() === "POST" ? route.abort() : route.continue()
  );
  await page.getByRole("button", { name: "Enregistrer les modifications" }).click();
  await expect(page.getByText("Connexion impossible")).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page).toHaveURL(`/mes-annonces/${annonce.id}`);
});

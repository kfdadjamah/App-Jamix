import { expect, test } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { COMPTE_TEST, seConnecter } from "./connexion";

// Écrit en base (branche Neon de développement) : crée ses annonces sur le compte de test,
// et les supprime à la fin, sans toucher aux données du seed.
test.describe.configure({ mode: "serial" });

const prisma = new PrismaClient();
const MS_PAR_JOUR = 24 * 60 * 60 * 1000;
const idsCrees: string[] = [];

function dansNJours(n: number) {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return new Date(d.getTime() + n * MS_PAR_JOUR);
}

async function organisateur() {
  return prisma.organisateur.findUniqueOrThrow({
    where: { email: COMPTE_TEST.email },
    include: { bars: { orderBy: { createdAt: "asc" }, take: 1 } },
  });
}

async function creerAnnonce(coOrganisateur: string | null, publieeLe = new Date()) {
  const orga = await organisateur();
  const annonce = await prisma.annonce.create({
    data: {
      barId: orga.bars[0].id,
      statut: "PUBLIEE",
      publieeLe,
      styles: ["Jazz"],
      instruments: [],
      coOrganisateur,
      occurrences: {
        create: [
          {
            date: dansNJours(20),
            heureDebut: "20:00",
            heureFin: "23:00",
            statut: "PROGRAMMEE",
            confirmationJ7: dansNJours(13),
          },
        ],
      },
    },
    include: { occurrences: true },
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

test("mention sans co-organisateur, avec co-organisateur, fiche et Mes annonces", async ({ page }) => {
  const orga = await organisateur();
  const prenom = orga.prenom!;
  const sans = await creerAnnonce(null);
  const avec = await creerAnnonce("Marc");

  await page.goto(`/jams/${sans.occurrences[0].id}`);
  await expect(page.getByText(`Organisé par ${prenom}`, { exact: true })).toBeVisible();

  await page.goto(`/jams/${avec.occurrences[0].id}`);
  await expect(page.getByText(`Organisé par ${prenom} et Marc`, { exact: true })).toBeVisible();

  await page.goto("/mes-annonces");
  await expect(page.getByText(`Organisé par ${prenom} et Marc`, { exact: true }).first()).toBeVisible();
});

test("accueil à 360 px : mention longue sans débordement", async ({ page }) => {
  const longNom = "x".repeat(40);
  const annonce = await creerAnnonce(longNom);
  await page.setViewportSize({ width: 360, height: 800 });
  const jour = dansNJours(20).toISOString().slice(0, 10);
  await page.goto(`/?date=${jour}`);
  await expect(page.getByText(longNom).first()).toBeVisible();
  const debordement = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth
  );
  expect(debordement).toBe(false);
  await page.goto(`/jams/${annonce.occurrences[0].id}`);
  const debordementFiche = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth
  );
  expect(debordementFiche).toBe(false);
});

test("nouvelle annonce : le bouton de reprise reprend le co-organisateur", async ({ page }) => {
  const orga = await organisateur();
  await creerAnnonce("Marc", new Date(Date.now() + 60_000));

  await page.goto("/mes-annonces/nouvelle");
  await page.getByLabel("Bar").selectOption(orga.bars[0].id);
  const champ = page.getByLabel("Co-organisateur (option)");
  await expect(champ).toHaveValue("");
  await expect(champ).toHaveAttribute("maxlength", "40");

  await page.getByRole("button", { name: "Reprendre la dernière annonce de ce bar" }).click();
  await expect(champ).toHaveValue("Marc");
});

test("modification : co-organisateur rogné, enregistré, puis retiré", async ({ page }) => {
  const annonce = await creerAnnonce(null);
  await page.goto(`/mes-annonces/${annonce.id}`);
  await page.getByLabel("Co-organisateur (option)").fill("  Julie  ");
  await page.getByRole("button", { name: "Enregistrer les modifications" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "OK" }).click();
  await expect(page).toHaveURL(`/jams/${annonce.occurrences[0].id}`);
  expect((await prisma.annonce.findUniqueOrThrow({ where: { id: annonce.id } })).coOrganisateur).toBe("Julie");

  await page.goto(`/mes-annonces/${annonce.id}`);
  await page.getByLabel("Co-organisateur (option)").fill("   ");
  await page.getByRole("button", { name: "Enregistrer les modifications" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "OK" }).click();
  await expect(page).toHaveURL(`/jams/${annonce.occurrences[0].id}`);
  expect((await prisma.annonce.findUniqueOrThrow({ where: { id: annonce.id } })).coOrganisateur).toBeNull();
});

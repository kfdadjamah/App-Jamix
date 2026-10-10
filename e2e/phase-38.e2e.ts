import { expect, test } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { COMPTE_TEST, seConnecter } from "./connexion";

// Ces tests créent leurs propres annonces sur le compte de test et les suppriment à la fin.
test.describe.configure({ mode: "serial" });

const prisma = new PrismaClient();
const idsCrees: string[] = [];

async function creerAnnonce(statut: "BROUILLON" | "PUBLIEE") {
  const organisateur = await prisma.organisateur.findUniqueOrThrow({
    where: { email: COMPTE_TEST.email },
    include: { bars: { orderBy: { createdAt: "asc" }, take: 1 } },
  });
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() + 20);
  const annonce = await prisma.annonce.create({
    data: {
      barId: organisateur.bars[0].id,
      statut,
      publieeLe: statut === "PUBLIEE" ? new Date() : null,
      styles: ["Jazz"],
      instruments: [],
      occurrences: {
        create: [
          {
            date,
            heureDebut: "20:00",
            heureFin: "23:00",
            statut: "PROGRAMMEE" as const,
            confirmationJ7: new Date(date.getTime() - 7 * 86400000),
          },
        ],
      },
    },
  });
  idsCrees.push(annonce.id);
  return annonce.id;
}

test.afterAll(async () => {
  await prisma.annonce.deleteMany({ where: { id: { in: idsCrees } } });
  await prisma.$disconnect();
});

test.beforeEach(async ({ page }) => {
  await seConnecter(page);
});

for (const chemin of ["/mon-profil", "/mes-annonces/nouvelle"]) {
  test(`${chemin} : « Accéder à mes annonces » est un lien vers Mes annonces`, async ({ page }) => {
    await page.goto(chemin);
    const lien = page.getByRole("link", { name: /Accéder à mes annonces/ });
    await expect(lien).toBeVisible();
    await expect(page.getByText("À confirmer", { exact: true })).toHaveCount(0);
    await lien.click();
    await expect(page).toHaveURL(/\/mes-annonces$/);
  });
}

test("Mes annonces : la ligne est un texte sans lien", async ({ page }) => {
  await page.goto("/mes-annonces");
  await expect(page.getByText("Accéder à mes annonces").first()).toBeVisible();
  await expect(page.getByRole("link", { name: /Accéder à mes annonces/ })).toHaveCount(0);
});

test("aucun champ photo sur la nouvelle annonce ni sur une annonce existante", async ({ page }) => {
  await page.goto("/mes-annonces/nouvelle");
  await expect(page.locator('input[type="file"]')).toHaveCount(0);
  for (const statut of ["BROUILLON", "PUBLIEE"] as const) {
    const id = await creerAnnonce(statut);
    await page.goto(`/mes-annonces/${id}`);
    await expect(page.getByRole("heading").first()).toBeVisible();
    await expect(page.getByText(/Photo [12]/)).toHaveCount(0);
    await expect(page.locator('input[type="file"]')).toHaveCount(0);
  }
});

test("le bandeau tient à 360px sans défilement horizontal", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto("/mon-profil");
  const deborde = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(deborde).toBe(false);
});

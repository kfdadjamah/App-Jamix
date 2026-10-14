import { expect, test } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { COMPTE_TEST, seConnecter } from "./connexion";

// Cartes de Mes annonces avec beaucoup de dates (Phase 63). Écrit en base (branche Neon de
// développement) : crée ses annonces sur le compte de test et les supprime à la fin.
test.describe.configure({ mode: "serial" });

const prisma = new PrismaClient();
const MS_PAR_JOUR = 24 * 60 * 60 * 1000;
const idsCrees: string[] = [];

function jour(decalage: number) {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return new Date(d.getTime() + decalage * MS_PAR_JOUR);
}

async function creerAnnonce(decalages: number[], description: string) {
  const orga = await prisma.organisateur.findUniqueOrThrow({
    where: { email: COMPTE_TEST.email },
    include: { bars: { orderBy: { createdAt: "asc" }, take: 1 } },
  });
  const annonce = await prisma.annonce.create({
    data: {
      barId: orga.bars[0].id,
      statut: "PUBLIEE",
      publieeLe: jour(-30),
      styles: ["Jazz"],
      instruments: [],
      description,
      estRecurrente: true,
      occurrences: {
        create: decalages.map((decalage) => ({
          date: jour(decalage),
          heureDebut: "20:00",
          heureFin: "23:00",
          statut: "PROGRAMMEE" as const,
          confirmationJ7: jour(decalage - 7),
        })),
      },
    },
  });
  idsCrees.push(annonce.id);
  return annonce;
}

function carte(page: import("@playwright/test").Page, annonceId: string) {
  return page.locator(`a[href="/mes-annonces/${annonceId}"]`);
}

test.afterAll(async () => {
  await prisma.annonce.deleteMany({ where: { id: { in: idsCrees } } });
  await prisma.$disconnect();
});

test("hebdomadaire sur 12 mois : 6 pastilles au plus, dates à confirmer d'abord, « + N autres dates »", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 800 });
  // Deux dates passées, une à J+3 et une à J+5 (à confirmer), puis 50 semaines à partir de J+10.
  const decalages = [-14, -7, 3, 5, ...Array.from({ length: 50 }, (_, i) => 10 + i * 7)];
  const annonce = await creerAnnonce(decalages, "Phase 63 hebdo 12 mois");

  await seConnecter(page);
  const lien = carte(page, annonce.id);
  await expect(lien).toBeVisible();

  const pastilles = lien.locator("li > span").filter({ hasText: /·/ });
  await expect(pastilles).toHaveCount(6);
  await expect(pastilles.nth(0)).toContainText("En attente de confirmation");
  await expect(pastilles.nth(1)).toContainText("En attente de confirmation");
  await expect(pastilles.nth(2)).toContainText("Programmée");

  // 52 dates à venir, 6 affichées.
  const autres = lien.getByText("+ 46 autres dates");
  await expect(autres).toBeVisible();
  await expect(autres).toHaveCSS("color", "rgb(43, 120, 190)");

  const largeurs = await page.evaluate(() => ({
    contenu: document.documentElement.scrollWidth,
    fenetre: window.innerWidth,
  }));
  expect(largeurs.contenu).toBeLessThanOrEqual(largeurs.fenetre);

  await autres.click();
  await expect(page).toHaveURL(`/mes-annonces/${annonce.id}`);
});

test("toutes les dates passées : « Aucune date à venir », sans pastille", async ({ page }) => {
  const annonce = await creerAnnonce([-21, -14, -7], "Phase 63 passée");
  await seConnecter(page);
  const lien = carte(page, annonce.id);
  await expect(lien.getByText("Aucune date à venir")).toBeVisible();
  await expect(lien.locator("li > span").filter({ hasText: /·/ })).toHaveCount(0);
});

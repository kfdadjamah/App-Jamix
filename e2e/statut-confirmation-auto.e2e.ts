import { expect, test } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { COMPTE_TEST, seConnecter } from "./connexion";

// Statut selon les jours restants : > 7 programmée, de 7 à 4 en attente de confirmation (avec la
// mention de confirmation automatique), 3 et moins confirmée automatiquement. Écrit en base
// (branche Neon de développement) : crée une annonce sur le compte de test puis la supprime.
const prisma = new PrismaClient();
const MS_PAR_JOUR = 24 * 60 * 60 * 1000;
let annonceId = "";

function jour(decalage: number) {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return new Date(d.getTime() + decalage * MS_PAR_JOUR);
}

test.beforeAll(async () => {
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
      description: "Statut confirmation auto J-3",
      estRecurrente: true,
      occurrences: {
        create: [9, 6, 3, 1].map((decalage) => ({
          date: jour(decalage),
          heureDebut: "20:00",
          heureFin: "23:00",
          statut: "PROGRAMMEE" as const,
          confirmationJ7: jour(decalage - 7),
        })),
      },
    },
  });
  annonceId = annonce.id;
});

test.afterAll(async () => {
  await prisma.annonce.deleteMany({ where: { id: annonceId } });
  await prisma.$disconnect();
});

test("programmée > J-7, en attente avec mention de J-3, confirmée automatiquement à J-3 et moins", async ({
  page,
}) => {
  await seConnecter(page);
  await page.goto(`/mes-annonces/${annonceId}`);

  const lignes = page.locator("ul > li").filter({ hasText: /Programmée|En attente|Confirmée/ });
  await expect(lignes).toHaveCount(4);
  // Tri par date croissante : J+1, J+3, J+6, J+9.
  await expect(lignes.nth(0)).toContainText("Confirmée");
  await expect(lignes.nth(1)).toContainText("Confirmée");
  await expect(lignes.nth(2)).toContainText("En attente de confirmation");
  await expect(lignes.nth(2)).toContainText(
    "Sans confirmation à J-3, la date sera automatiquement confirmée."
  );
  await expect(lignes.nth(3)).toContainText("Programmée");
  // Les dates confirmées automatiquement n'ont ni relance ni bouton « Confirmer ».
  await expect(lignes.nth(0)).not.toContainText("Sans confirmation");
  await expect(lignes.nth(1)).not.toContainText("Sans confirmation");
});

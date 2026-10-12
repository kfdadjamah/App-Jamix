import { expect, test, devices, type Page } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { COMPTE_TEST, seConnecter } from "./connexion";

// Ces tests écrivent en base (branche Neon de développement) : ils créent leurs propres annonces
// sur le compte de test et les suppriment à la fin, sans toucher aux données du seed.
test.describe.configure({ mode: "serial" });

const prisma = new PrismaClient();
const MS_PAR_JOUR = 24 * 60 * 60 * 1000;
const idsCrees: string[] = [];

async function creerAnnonce() {
  const organisateur = await prisma.organisateur.findUniqueOrThrow({
    where: { email: COMPTE_TEST.email },
    include: { bars: { orderBy: { createdAt: "asc" }, take: 1 } },
  });
  const jour = new Date();
  jour.setUTCHours(0, 0, 0, 0);
  const date = new Date(jour.getTime() + 30 * MS_PAR_JOUR);
  const annonce = await prisma.annonce.create({
    data: {
      barId: organisateur.bars[0].id,
      statut: "PUBLIEE",
      publieeLe: new Date(),
      estRecurrente: false,
      styles: ["Jazz"],
      instruments: [],
      occurrences: {
        create: [
          {
            date,
            heureDebut: "20:00",
            heureFin: "23:00",
            statut: "PROGRAMMEE" as const,
            confirmationJ7: new Date(date.getTime() - 7 * MS_PAR_JOUR),
          },
        ],
      },
    },
  });
  idsCrees.push(annonce.id);
  return annonce.id;
}

function carte(page: Page, annonceId: string) {
  return page.locator(`a[href="/mes-annonces/${annonceId}"]`).locator("..");
}

async function glisser(page: Page, annonceId: string, dx: number) {
  const zone = await page.locator(`a[href="/mes-annonces/${annonceId}"]`).boundingBox();
  if (!zone) throw new Error("Carte introuvable");
  const x = zone.x + zone.width / 2;
  const y = zone.y + zone.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + dx / 2, y, { steps: 5 });
  await page.mouse.move(x + dx, y, { steps: 5 });
  await page.mouse.up();
}

async function decalage(page: Page, annonceId: string) {
  return carte(page, annonceId).evaluate((element) => {
    const transform = (element.parentElement as HTMLElement).style.transform;
    return Number(/translateX\((-?[\d.]+)px\)/.exec(transform)?.[1] ?? 0);
  });
}

test.afterAll(async () => {
  await prisma.annonce.deleteMany({ where: { id: { in: idsCrees } } });
  await prisma.$disconnect();
});

test.beforeEach(async ({ page }) => {
  await seConnecter(page);
});

for (const [nom, viewport] of [
  ["souris", undefined],
  ["mobile 360 px", { width: 360, height: 740 }],
] as const) {
  test.describe(nom, () => {
    if (viewport) test.use({ viewport, hasTouch: devices["Pixel 7"].hasTouch });

    test("glissé à gauche : « Supprimer » apparaît, rien n'est supprimé, le bouton ouvre la confirmation", async ({
      page,
    }) => {
      const id = await creerAnnonce();
      await page.reload();

      await glisser(page, id, -120);
      await expect(page).toHaveURL("/mes-annonces");
      await expect.poll(() => decalage(page, id)).toBe(-96);
      await expect(page.getByRole("dialog")).toHaveCount(0);
      expect(await prisma.annonce.count({ where: { id } })).toBe(1);

      await page.getByRole("button", { name: "Supprimer", exact: true }).click();
      const fenetre = page.getByRole("dialog");
      await expect(fenetre).toBeVisible();
      await fenetre.getByRole("button", { name: "← Retour" }).click();
      await expect(fenetre).toHaveCount(0);
      expect(await prisma.annonce.count({ where: { id } })).toBe(1);
    });

    test("glissé à droite : « Modifier » apparaît, le bouton mène au formulaire", async ({
      page,
    }) => {
      const id = await creerAnnonce();
      await page.reload();

      await glisser(page, id, 120);
      await expect(page).toHaveURL("/mes-annonces");
      await expect.poll(() => decalage(page, id)).toBe(96);

      await page.getByRole("button", { name: "Modifier", exact: true }).click();
      await expect(page).toHaveURL(`/mes-annonces/${id}`);
    });

    test("glissé court : la carte se referme ; tap : la carte s'ouvre toujours", async ({
      page,
    }) => {
      const id = await creerAnnonce();
      await page.reload();

      await glisser(page, id, -40);
      await expect.poll(() => decalage(page, id)).toBe(0);
      await expect(page).toHaveURL("/mes-annonces");

      await page.locator(`a[href="/mes-annonces/${id}"]`).click();
      await expect(page).toHaveURL(`/mes-annonces/${id}`);
    });
  });
}

import { expect, test } from "@playwright/test";

// Pastilles de statut en fond plein (Phase 49). Lecture seule : la base Neon est partagée.

const COULEURS: Record<string, string> = {
  Confirmée: "rgb(23, 128, 126)",
  Programmée: "rgb(43, 120, 190)",
  "En attente de confirmation": "rgb(148, 96, 16)",
  Annulée: "rgb(107, 124, 140)",
};

test("les pastilles de statut ont un fond plein de la couleur du statut, texte blanc gras", async ({
  page,
}) => {
  await page.goto("/");
  const suggestion = page.getByText("Prochaines dates").locator("..").locator("a").first();
  if ((await page.locator('main a[href^="/jams/"]').count()) === 0) {
    test.skip((await suggestion.count()) === 0, "aucune annonce publiée");
    await suggestion.click();
  }
  const pastilles = page
    .locator("main span")
    .filter({ hasText: /^(Confirmée|Programmée|En attente de confirmation|Annulée)$/ });
  await expect(pastilles.first()).toBeVisible();
  for (const pastille of await pastilles.all()) {
    const libelle = (await pastille.innerText()).trim();
    await expect(pastille).toHaveCSS("background-color", COULEURS[libelle]);
    await expect(pastille).toHaveCSS("color", "rgb(255, 255, 255)");
    await expect(pastille).toHaveCSS("font-weight", "700");
  }
});

import { expect, test, type Locator, type Page } from "@playwright/test";

// États pressés (:active, Phase 52). Lecture seule : aucune donnée écrite, le bouton est relâché hors de lui.

async function couleurs(element: Locator) {
  return element.evaluate((noeud) => {
    const style = getComputedStyle(noeud);
    return [style.backgroundColor, style.borderTopColor, style.color].join("|");
  });
}

async function verifierChangeAuClic(page: Page, element: Locator) {
  await expect(element.first()).toBeVisible();
  const cible = element.first();
  const repos = await couleurs(cible);
  await cible.hover();
  await page.waitForTimeout(200);
  const survol = await couleurs(cible);
  await page.mouse.down();
  await page.waitForTimeout(200);
  const presse = await couleurs(cible);
  await page.mouse.move(0, 0);
  await page.mouse.up();
  expect(presse, "la couleur calculée change sous mouse.down()").not.toBe(repos);
  return { repos, survol, presse };
}

test("accueil : pastille de connexion, bascule, discret, flèche, jour", async ({ page }) => {
  await page.goto("/");
  await verifierChangeAuClic(page, page.getByRole("link", { name: "Connexion organisateur" }));
  await verifierChangeAuClic(page, page.getByRole("button", { name: "Carte" }));
  await verifierChangeAuClic(page, page.getByRole("link", { name: "Aujourd'hui" }));
  await verifierChangeAuClic(page, page.getByRole("link", { name: "Semaine suivante" }));
  await verifierChangeAuClic(page, page.locator('a[aria-label*="," i]').nth(1));
});

test("principal : Bleu signal → Marine au clic", async ({ page }) => {
  await page.goto("/connexion");
  const bouton = page.locator('form button[type="submit"]').first();
  await page.mouse.move(0, 0);
  const repos = await couleurs(bouton);
  expect(repos.split("|")[0]).toBe("rgb(43, 120, 190)");
  const { presse } = await verifierChangeAuClic(page, bouton);
  expect(presse.split("|")[0]).toBe("rgb(11, 54, 88)");
});

test("secondaire : fond Voile et bordure Bleu clair au clic", async ({ page }) => {
  await page.goto("/contact");
  const retour = page.getByRole("link", { name: /Retour/ }).or(page.getByRole("button", { name: /Retour/ }));
  const { presse } = await verifierChangeAuClic(page, retour);
  const [fond, bordure] = presse.split("|");
  expect(fond).toBe("rgb(230, 241, 250)");
  expect(bordure).toBe("rgb(78, 154, 217)");
});

test("lien du pied de page : couleur Bleu signal au clic", async ({ page }) => {
  await page.goto("/");
  const { presse } = await verifierChangeAuClic(page, page.getByRole("link", { name: "CGU" }));
  expect(presse.split("|")[2]).toBe("rgb(43, 120, 190)");
});

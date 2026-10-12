import { expect, test, type Locator, type Page } from "@playwright/test";
import { seConnecter } from "./connexion";

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

// Phase 54 : « couleur = fonction ». Un échantillon par fonction, vérifié par la couleur calculée.
const FONCTIONS = {
  principal: "rgb(43, 120, 190)",
  erreur: "rgb(179, 38, 30)",
  succes: "rgb(23, 128, 126)",
  alerte: "rgb(148, 96, 16)",
  voile: "rgb(230, 241, 250)",
  blanc: "rgb(255, 255, 255)",
};

async function fond(element: Locator) {
  return element.evaluate((noeud) => getComputedStyle(noeud).backgroundColor);
}

test("fonction principale : Bleu signal", async ({ page }) => {
  await page.goto("/connexion");
  await page.mouse.move(0, 0);
  expect(await fond(page.locator('form button[type="submit"]').first())).toBe(FONCTIONS.principal);
});

test("fonction neutre : « ← Retour » en blanc", async ({ page }) => {
  await page.goto("/contact");
  await page.mouse.move(0, 0);
  const retour = page.getByRole("link", { name: /Retour/ }).or(page.getByRole("button", { name: /Retour/ }));
  expect(await fond(retour.first())).toBe(FONCTIONS.blanc);
});

test("fonction attente/relance : le token Alerte reste #946010, sans bouton dédié", async ({ page }) => {
  await page.goto("/");
  const alerte = await page.evaluate(() => {
    const sonde = document.createElement("span");
    sonde.style.color = "var(--harbor-alerte)";
    document.body.appendChild(sonde);
    const couleur = getComputedStyle(sonde).color;
    sonde.remove();
    return couleur;
  });
  expect(alerte).toBe(FONCTIONS.alerte);
});

test.describe("organisateur connecté", () => {
  test.beforeEach(async ({ page }) => {
    await seConnecter(page);
  });

  test("fonction suppression : « Retirer » une photo enregistrée en Erreur plein", async ({ page }) => {
    await page.goto("/mon-profil");
    const retirer = page.getByRole("button", { name: "Retirer" });
    test.skip((await retirer.count()) === 0, "aucune photo de bar enregistrée sur le compte de test");
    await page.mouse.move(0, 0);
    expect(await fond(retirer.first())).toBe(FONCTIONS.erreur);
  });

  test("fonction neutre : « Déconnexion » en blanc, jamais en couleur de fonction", async ({ page }) => {
    await page.goto("/mon-profil");
    await page.mouse.move(0, 0);
    expect(await fond(page.getByRole("button", { name: "Déconnexion" }))).toBe(FONCTIONS.blanc);
  });
});

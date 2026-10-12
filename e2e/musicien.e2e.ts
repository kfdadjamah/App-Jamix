import { expect, test, type Page } from "@playwright/test";

// Accueil musicien (design Harbor). Lecture seule : la base Neon est partagée.

const STATUTS = /^(Confirmée|Programmée|En attente de confirmation|Annulée)$/;

function ajouterJoursIso(dateIso: string, jours: number) {
  return new Date(new Date(dateIso).getTime() + jours * 86400000)
    .toISOString()
    .slice(0, 10);
}

const aujourdhuiIso = () => new Date().toISOString().slice(0, 10);

/** Se place sur une date qui a des jams (aujourd'hui, sinon la première date suggérée). */
async function allerAUneDateAvecJams(page: Page): Promise<boolean> {
  await page.goto("/");
  if ((await page.locator('main a[href^="/jams/"]').count()) > 0) return true;
  const suggestion = page
    .getByText("Prochaines dates")
    .locator("..")
    .locator("a")
    .first();
  if ((await suggestion.count()) === 0) return false;
  await suggestion.click();
  await expect(page).toHaveURL(/\?date=\d{4}-\d{2}-\d{2}/);
  await expect(page.locator('main a[href^="/jams/"]').first()).toBeVisible();
  return true;
}

test("l'accueil affiche le logo, la bascule, la semaine et le bandeau de 7 jours", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { level: 1, name: "Jammix" }),
  ).toBeVisible();
  await expect(page.getByText("Les Jams à Lyon, ce soir")).toBeVisible();
  await expect(page.getByText(/Cette semaine ·/)).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Liste" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Aujourd'hui" })).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Semaine suivante" }),
  ).toBeVisible();
  await expect(page.locator(".grid-cols-7 > *")).toHaveCount(7);
  await expect(page.locator('.grid-cols-7 a[aria-current="date"]')).toHaveCount(
    1,
  );
});

test("visiteur : seul « Connexion organisateur » à droite, sans lien logo ni champ date visible", async ({
  page,
}) => {
  await page.goto("/");
  const entete = page.getByRole("banner");
  await expect(
    entete.getByRole("link", { name: "Connexion organisateur" }),
  ).toBeVisible();
  await expect(entete.getByRole("link")).toHaveCount(1);
  await expect(
    page.getByRole("link", { name: "Accéder à mes annonces" }),
  ).toHaveCount(0);
});

test.describe("bandeau de 7 jours", () => {
  test("la date minimale est aujourd'hui : pas de semaine précédente", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(
      page.getByRole("link", { name: "Semaine précédente" }),
    ).toHaveCount(0);
    // Les jours passés de la semaine en cours ne sont pas cliquables.
    await expect(page.locator(".grid-cols-7 a")).not.toHaveCount(0);
    await expect(page.getByLabel("Choisir une date")).toHaveAttribute(
      "min",
      aujourdhuiIso(),
    );
  });

  test("les flèches déplacent la date de 7 jours, « Aujourd'hui » revient au jour courant", async ({
    page,
  }) => {
    const aujourdhui = aujourdhuiIso();
    await page.goto("/");

    await page.getByRole("link", { name: "Semaine suivante" }).click();
    await expect(page).toHaveURL(`/?date=${ajouterJoursIso(aujourdhui, 7)}`);
    await expect(
      page.getByRole("link", { name: "Semaine précédente" }),
    ).toBeVisible();

    await page.getByRole("link", { name: "Semaine précédente" }).click();
    await expect(page).toHaveURL(`/?date=${aujourdhui}`);

    await page.getByRole("link", { name: "Semaine suivante" }).click();
    await page.getByRole("link", { name: "Aujourd'hui" }).click();
    await expect(page).toHaveURL(`/?date=${aujourdhui}`);
  });

  test("cliquer un jour met à jour ?date= et le sélectionne", async ({
    page,
  }) => {
    const cible = ajouterJoursIso(aujourdhuiIso(), 3);
    await page.goto("/");
    await page.locator(`.grid-cols-7 a[href="/?date=${cible}"]`).click();
    await expect(page).toHaveURL(`/?date=${cible}`);
    await expect(
      page.locator('.grid-cols-7 a[aria-current="date"]'),
    ).toHaveAttribute("href", `/?date=${cible}`);
  });

  test("l'icône calendrier mène à une date lointaine", async ({ page }) => {
    const lointaine = ajouterJoursIso(aujourdhuiIso(), 60);
    await page.goto("/");
    const champ = page.getByLabel("Choisir une date");
    await expect(champ).toBeVisible();

    // Le sélecteur natif ne se pilote pas : on simule le choix de la date.
    await champ.evaluate((champ, valeur) => {
      const input = champ as HTMLInputElement;
      Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value",
      )!.set!.call(input, valeur);
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }, lointaine);

    await expect(page).toHaveURL(`/?date=${lointaine}`);
    await expect(
      page.locator('.grid-cols-7 a[aria-current="date"]'),
    ).toHaveAttribute("href", `/?date=${lointaine}`);
  });

  test("un point n'apparaît que sous les jours annoncés « jams publiées »", async ({
    page,
  }) => {
    await page.goto("/");
    const jours = page.locator(".grid-cols-7 > *");
    const total = await jours.count();
    for (let i = 0; i < total; i++) {
      const jour = jours.nth(i);
      const aPoint = (await jour.locator('[data-point="oui"]').count()) > 0;
      const libelle = (await jour.getAttribute("aria-label")) ?? "";
      if (aPoint) expect(libelle).toMatch(/, jams publiées$/);
      else expect(libelle).not.toMatch(/jams publiées/);
    }
  });
});

test("la bascule Liste/Carte reflète la vue choisie", async ({ page }) => {
  test.skip(
    !(await allerAUneDateAvecJams(page)),
    "Aucune jam publiée à venir dans la base",
  );
  await expect(page.getByRole("button", { name: "Liste" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.getByRole("button", { name: "Carte" }).click();
  await expect(page).toHaveURL(/vue=carte/);
  await expect(page.getByRole("button", { name: "Carte" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  // La vue conservée quand on change de jour.
  await page.getByRole("link", { name: "Semaine suivante" }).click();
  await expect(page).toHaveURL(/vue=carte/);
});

test("la carte d'annonce affiche le statut, l'horaire et le menu Itinéraire", async ({
  page,
}) => {
  test.skip(
    !(await allerAUneDateAvecJams(page)),
    "Aucune jam publiée à venir dans la base",
  );

  const carte = page
    .locator("main div.relative")
    .filter({ has: page.locator('a[href^="/jams/"]') })
    .first();
  await expect(carte.getByText(STATUTS)).toBeVisible();
  await expect(carte.getByText(/\d{2}:\d{2}/).first()).toBeVisible();

  await carte.getByRole("button", { name: "Itinéraire" }).click();
  await expect(page.getByRole("menu")).toBeVisible();
  await expect(page.getByRole("menuitem").first()).toHaveAttribute(
    "href",
    /^https?:\/\//,
  );
  await page.keyboard.press("Escape");
  await expect(page.getByRole("menu")).toHaveCount(0);
});

test("une date avec des jams les liste et mène à la page d'une jam", async ({
  page,
}) => {
  test.skip(
    !(await allerAUneDateAvecJams(page)),
    "Aucune jam publiée à venir dans la base",
  );

  const lienJam = page.locator('main a[href^="/jams/"]').first();
  const nomBar = (await lienJam.textContent())!.trim();
  await lienJam.click();

  await expect(page).toHaveURL(/\/jams\/[^/]+$/);
  await expect(
    page.getByRole("heading", { level: 1, name: nomBar }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Itinéraire" })).toBeVisible();
  await expect(page.getByRole("link", { name: "← Retour" })).toHaveAttribute(
    "href",
    /^\/\?date=/,
  );
});

test("la vue carte affiche la carte claire et les étiquettes", async ({
  page,
}) => {
  test.skip(
    !(await allerAUneDateAvecJams(page)),
    "Aucune jam publiée à venir dans la base",
  );

  await page.getByRole("button", { name: "Carte" }).click();
  await expect(page.locator(".maplibregl-canvas")).toBeVisible();
  await expect(page.locator(".maplibregl-marker").first()).toBeVisible();
});

test("une jam inexistante renvoie une 404 avec un message clair", async ({
  page,
}) => {
  const reponse = await page.goto("/jams/inexistante");
  expect(reponse?.status()).toBe(404);
  await expect(
    page.getByText("Cette jam n'est plus disponible."),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Voir les jams du jour" }),
  ).toHaveAttribute("href", "/");
});

test.describe("sur mobile", () => {
  test.use({ viewport: { width: 400, height: 844 } });

  for (const chemin of ["/", "/connexion", "/inscription"]) {
    test(`${chemin} ne déborde pas horizontalement`, async ({ page }) => {
      await page.goto(chemin);
      const deborde = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth,
      );
      expect(deborde).toBe(false);
    });
  }

  test.describe("calendrier au toucher (390 px)", () => {
    test.use({
      viewport: { width: 390, height: 844 },
      hasTouch: true,
      isMobile: true,
    });

    test("le bouton est entre « Aujourd'hui » et « › », en 40×40, et la bascule est pleine largeur", async ({
      page,
    }) => {
      await page.goto("/");
      const box = async (l: ReturnType<typeof page.locator>) =>
        (await l.boundingBox())!;
      const aujourdhui = await box(page.getByRole("link", { name: "Aujourd'hui" }));
      const calendrier = await box(page.getByLabel("Choisir une date"));
      const suivante = await box(page.getByRole("link", { name: "Semaine suivante" }));
      const liste = await box(page.getByRole("button", { name: "Liste" }));
      const carte = await box(page.getByRole("button", { name: "Carte" }));

      expect(calendrier.width).toBeGreaterThanOrEqual(40);
      expect(calendrier.height).toBeGreaterThanOrEqual(40);
      expect(calendrier.x).toBeGreaterThanOrEqual(aujourdhui.x + aujourdhui.width);
      expect(calendrier.x + calendrier.width).toBeLessThanOrEqual(suivante.x);
      expect(Math.abs(calendrier.y - aujourdhui.y)).toBeLessThan(20);
      // La bascule occupe toute la largeur de la colonne (hors marges de 24 px et remplissage de la bascule).
      expect(liste.x).toBeLessThanOrEqual(32);
      expect(carte.x + carte.width).toBeGreaterThanOrEqual(390 - 32);
    });

    test("un vrai toucher sur le bouton cible le champ date, choisir une date navigue", async ({
      page,
    }) => {
      const lointaine = ajouterJoursIso(aujourdhuiIso(), 45);
      await page.goto("/");
      const champ = page.getByLabel("Choisir une date");
      // Le toucher atterrit bien sur le champ (pas sur un autre élément qui le recouvre).
      const cible = await champ.evaluate((el) => {
        const r = el.getBoundingClientRect();
        return document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2) === el;
      });
      expect(cible).toBe(true);
      await champ.tap();
      await champ.fill(lointaine);
      await expect(page).toHaveURL(`/?date=${lointaine}`);
    });
  });

  test("captures mobile 400 px : liste et carte", async ({ page }) => {
    test.skip(
      !(await allerAUneDateAvecJams(page)),
      "Aucune jam publiée à venir dans la base",
    );

    await page.screenshot({
      path: "test-results/harbor/accueil-liste-400.png",
      fullPage: true,
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);

    await page.getByRole("button", { name: "Carte" }).click();
    await expect(page.locator(".maplibregl-canvas")).toBeVisible();
    await expect(page.locator(".maplibregl-marker").first()).toBeVisible();
    await page.waitForTimeout(1000); // tuiles de fond
    await page.screenshot({
      path: "test-results/harbor/accueil-carte-400.png",
    });
  });
});

test("le bandeau n'a que l'icône maison ; mot-symbole et accroche sous le bandeau sur toutes les pages", async ({
  page,
}) => {
  for (const chemin of ["/", "/contact", "/cgu", "/mentions-legales"]) {
    await page.goto(chemin);
    if (chemin !== "/") {
      const lien = page.locator('header a[href="/"]');
      await expect(lien).toHaveAttribute("aria-label", "Accueil");
      await expect(lien.locator("svg")).toBeVisible();
      await expect(lien).toHaveText("");
    }
    await expect(page.locator("header")).not.toContainText("Jammix");
    await expect(page.getByText("Les Jams à Lyon, ce soir")).toBeVisible();
    await expect(page.getByText("mix", { exact: true }).first()).toBeVisible();
  }
  await page.goto("/contact");
  await page.screenshot({ path: "test-results/harbor/contact-marque.png" });
});

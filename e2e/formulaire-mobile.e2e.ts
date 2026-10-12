import { expect, test } from "@playwright/test";
import { seConnecter } from "./connexion";

// Formulaire de nouvelle annonce resserré, heures lisibles (Phase 51). Lecture seule : rien n'est enregistré.
test.use({ viewport: { width: 360, height: 780 } });

test("sections resserrées et champs d'heure côte à côte à 360 px", async ({ page }) => {
  await seConnecter(page);
  await page.goto("/mes-annonces/nouvelle");

  const formulaire = page.locator("form").first();
  await expect(formulaire).toHaveCSS("row-gap", "20px");

  const debut = page.locator('input[name="heureDebut"]');
  const fin = page.locator('input[name="heureFin"]');
  await expect(debut).toBeVisible();
  const boiteDebut = (await debut.boundingBox())!;
  const boiteFin = (await fin.boundingBox())!;

  // Chacun dans sa demi-colonne, sans chevauchement.
  expect(boiteDebut.x + boiteDebut.width).toBeLessThanOrEqual(boiteFin.x);
  expect(boiteFin.x + boiteFin.width).toBeLessThanOrEqual(360);
  // Alignés sur la même ligne, même si un libellé passait sur deux lignes.
  expect(Math.abs(boiteDebut.y - boiteFin.y)).toBeLessThan(1);

  // Pas de défilement horizontal.
  const debordement = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(debordement).toBeLessThanOrEqual(0);
});

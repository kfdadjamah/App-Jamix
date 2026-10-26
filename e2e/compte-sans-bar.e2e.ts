import { expect, test } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

// Entorse à la règle « lecture seule » des tests : un compte jetable (sans prénom, sans bar,
// comme celui de l'organisateur bloqué en PROD) est créé puis supprimé. Jamais hors base de dev.
const EMAIL = `e2e-sans-bar-${Date.now()}@jamix.fr`;
const MOT_DE_PASSE = "test1234";
const prisma = new PrismaClient();

test.beforeAll(async () => {
  if (process.env.NEON_BRANCH !== "developpement") {
    throw new Error("Ce test écrit en base : il ne tourne que sur la branche Neon « developpement ».");
  }
  await prisma.organisateur.create({
    data: { email: EMAIL, nom: "Sofiane", motDePasseHash: await bcrypt.hash(MOT_DE_PASSE, 4) },
  });
});

test.afterAll(async () => {
  await prisma.organisateur.deleteMany({ where: { email: EMAIL, bars: { none: {} } } });
  await prisma.$disconnect();
});

test("un compte sans bar voit son profil et peut ajouter un bar, pas « Compte introuvable »", async ({ page }) => {
  await page.goto("/connexion");
  await page.getByRole("textbox", { name: /^Email/ }).fill(EMAIL);
  await page.getByRole("textbox", { name: /^Mot de passe/ }).fill(MOT_DE_PASSE);
  await page.getByRole("button", { name: "Se connecter" }).click();

  // Sans prénom, la connexion renvoie vers le profil.
  await expect(page).toHaveURL(/\/mon-profil\?prenom=requis/);
  await expect(page.getByText("Compte introuvable.")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Mon profil" })).toBeVisible();
  await expect(page.getByTestId("aucun-bar")).toBeVisible();
  await expect(page.getByRole("button", { name: "Ajouter un bar" })).toBeEnabled();
});

import { expect, test } from "@playwright/test";
import { COMPTE_TEST, seConnecter } from "./connexion";

// Lecture seule : l'email du compte de test n'est jamais modifié.
test.describe("email visible dans le profil", () => {
  test.beforeEach(async ({ page }) => {
    await seConnecter(page);
    await page.goto("/mon-profil");
  });

  test("section repliée : l'email du compte est visible sous le titre", async ({ page }) => {
    const bouton = page.getByRole("button", { name: "Email", exact: true });
    await expect(bouton).toHaveAttribute("aria-expanded", "false");
    const email = page.getByTestId("email-actuel");
    await expect(email).toBeVisible();
    await expect(email).toHaveText(COMPTE_TEST.email);
    const [b, e] = await Promise.all([bouton.boundingBox(), email.boundingBox()]);
    expect(e!.y).toBeGreaterThan(b!.y);
  });

  test("section dépliée : l'email reste visible, au-dessus de « Nouvel email »", async ({ page }) => {
    await page.getByRole("button", { name: "Email", exact: true }).click();
    const email = page.getByTestId("email-actuel");
    const champ = page.getByRole("textbox", { name: "Nouvel email" });
    await expect(email).toBeVisible();
    await expect(champ).toBeVisible();
    const [e, c] = await Promise.all([email.boundingBox(), champ.boundingBox()]);
    expect(e!.y).toBeLessThan(c!.y);
  });

  test("aucun débordement horizontal à 360 px avec un email long", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await page.getByTestId("email-actuel").evaluate((n) => {
      n.textContent = "un-email-vraiment-tres-long-pour-tester@sous-domaine-interminable.exemple-organisation.fr";
    });
    const defile = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(defile).toBe(false);
  });
});

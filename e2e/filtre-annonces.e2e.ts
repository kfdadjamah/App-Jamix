import { expect, test } from "@playwright/test";
import { seConnecter } from "./connexion";

const BLEU_SIGNAL = "rgb(43, 120, 190)";
const BLANC = "rgb(255, 255, 255)";

test.describe("Filtre par bar : état actif coloré", () => {
  test.beforeEach(async ({ page }) => {
    await seConnecter(page);
  });

  test("« Tous » est actif à l'arrivée, puis l'état actif suit le bar choisi", async ({ page }) => {
    const filtres = page.locator("main button[aria-pressed]");
    test.skip((await filtres.count()) < 3, "Le compte de test a moins de deux bars");

    const tous = filtres.first();
    const autre = filtres.nth(1);

    await expect(tous).toHaveAttribute("aria-pressed", "true");
    await expect(tous).toHaveCSS("background-color", BLEU_SIGNAL);
    await expect(tous).toHaveCSS("color", BLANC);
    await expect(tous).toHaveCSS("border-top-color", BLEU_SIGNAL);
    await expect(autre).not.toHaveCSS("background-color", BLEU_SIGNAL);

    await autre.click();
    await expect(autre).toHaveAttribute("aria-pressed", "true");
    await expect(autre).toHaveCSS("background-color", BLEU_SIGNAL);
    await expect(autre).toHaveCSS("color", BLANC);
    await expect(tous).toHaveAttribute("aria-pressed", "false");
    await expect(tous).not.toHaveCSS("background-color", BLEU_SIGNAL);
  });
});

import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { COMPTE_TEST, seConnecter } from "./connexion";

// Lecture seule : un vrai envoi écrirait en base et enverrait un email. Le succès est
// exercé via le champ piège (faux succès, rien d'envoyé ni d'enregistré) ; le vrai
// envoi est couvert par les tests Vitest (lib/email.test.ts, lib/contact.test.ts).

/** Vrai si `.env` renseigne EMAIL_CONTACT : un envoi réel partirait alors. */
function adresseContactRenseignee(): boolean {
  try {
    return /^\s*EMAIL_CONTACT\s*=\s*"?[^"\s]+/m.test(readFileSync(".env", "utf8"));
  } catch {
    return false;
  }
}

const champ = (page: Page, nom: RegExp) => page.getByRole("textbox", { name: nom });

async function remplir(page: Page, valeurs: { nom: string; email: string; message: string }) {
  await champ(page, /^Nom/).fill(valeurs.nom);
  await champ(page, /^Email/).fill(valeurs.email);
  await champ(page, /^Message/).fill(valeurs.message);
}

test("« Contact » mène à la page Contact, publique, avec « ← Retour » vers l'accueil", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("contentinfo").getByRole("link", { name: "Contact" }).click();
  await expect(page).toHaveURL("/contact");
  await expect(page.getByRole("heading", { level: 1, name: "Contact" })).toBeVisible();
  await expect(page.getByRole("link", { name: "← Retour" })).toHaveAttribute("href", "/");
  await expect(page.getByRole("contentinfo").getByRole("link", { name: "Contact" })).toHaveAttribute(
    "aria-current",
    "page"
  );
  await expect(page.getByRole("main").getByRole("link", { name: "CGU" })).toHaveAttribute(
    "href",
    "/cgu"
  );
});

test("un visiteur trouve le champ email vide", async ({ page }) => {
  await page.goto("/contact");
  await expect(champ(page, /^Email/)).toHaveValue("");
});

test("les erreurs s'affichent sous chaque champ, la saisie conservée", async ({ page }) => {
  await page.goto("/contact");
  await page.getByRole("button", { name: "Envoyer" }).click();
  await expect(page.getByText("Le nom est requis.")).toBeVisible();
  await expect(page.getByText("Adresse email invalide.")).toBeVisible();
  await expect(page.getByText("Le message doit contenir au moins 10 caractères.")).toBeVisible();

  await remplir(page, { nom: "Alex", email: "pas-un-email", message: "Court" });
  await page.getByRole("button", { name: "Envoyer" }).click();
  await expect(page.getByText("Adresse email invalide.")).toBeVisible();
  await expect(page.getByText("Le nom est requis.")).toBeHidden();
  await expect(champ(page, /^Nom/)).toHaveValue("Alex");
  await expect(champ(page, /^Email/)).toHaveValue("pas-un-email");
  await expect(champ(page, /^Message/)).toHaveValue("Court");
});

test("le compteur suit la longueur du message, plafonnée à 2000", async ({ page }) => {
  await page.goto("/contact");
  await expect(page.getByText("0/2000")).toBeVisible();
  await champ(page, /^Message/).fill("Bonjour !");
  await expect(page.getByText("9/2000")).toBeVisible();
  await champ(page, /^Message/).fill("a".repeat(2100));
  await expect(page.getByText("2000/2000")).toBeVisible();
});

test("un envoi réussi affiche la confirmation et vide le formulaire", async ({ page }) => {
  await page.goto("/contact");
  await remplir(page, { nom: "Alex", email: "alex@exemple.fr", message: "Bonjour, une question." });
  // Champ piège rempli comme le ferait un robot : faux succès sans envoi.
  await page.locator('input[name="siteWeb"]').fill("https://robot.example", { force: true });
  await page.getByRole("button", { name: "Envoyer" }).click();

  await expect(page.getByText("Message envoyé, nous vous répondrons par email.")).toBeVisible();
  await expect(champ(page, /^Nom/)).toHaveValue("");
  await expect(champ(page, /^Email/)).toHaveValue("");
  await expect(champ(page, /^Message/)).toHaveValue("");
});

test("sans adresse de contact, l'envoi échoue et la saisie est conservée", async ({ page }) => {
  test.skip(adresseContactRenseignee(), "EMAIL_CONTACT renseignée : un vrai email partirait");
  await page.goto("/contact");
  await remplir(page, { nom: "Alex", email: "alex@exemple.fr", message: "Bonjour, une question." });
  await page.getByRole("button", { name: "Envoyer" }).click();

  await expect(page.getByText("L'envoi a échoué, réessayez plus tard.")).toBeVisible();
  await expect(champ(page, /^Nom/)).toHaveValue("Alex");
  await expect(champ(page, /^Message/)).toHaveValue("Bonjour, une question.");
});

test("le champ piège reste hors de la navigation au clavier", async ({ page }) => {
  await page.goto("/contact");
  const piege = page.locator('input[name="siteWeb"]');
  await expect(piege).toHaveAttribute("tabindex", "-1");
  await expect(page.getByRole("textbox", { name: /Site web/ })).toHaveCount(0);
});

test("un organisateur connecté trouve son email prérempli et modifiable", async ({ page }) => {
  await seConnecter(page);
  await page.goto("/contact");
  const email = champ(page, /^Email/);
  await expect(email).toHaveValue(COMPTE_TEST.email);
  await email.fill("autre@exemple.fr");
  await expect(email).toHaveValue("autre@exemple.fr");
});

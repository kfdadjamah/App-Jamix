import { describe, expect, it } from "vitest";
import {
  schemaChangementEmail,
  schemaChangementMotDePasse,
  schemaFicheBar,
  schemaSuppressionCompte,
} from "./inscription";

describe("schemaFicheBar", () => {
  it("accepte un nom et une adresse", () => {
    expect(
      schemaFicheBar.safeParse({ nomBar: "Le Sirius", adresseBar: "4 quai Augagneur, Lyon" })
        .success
    ).toBe(true);
  });

  it("refuse un nom vide après trim", () => {
    expect(schemaFicheBar.safeParse({ nomBar: "   ", adresseBar: "Lyon" }).success).toBe(false);
  });

  it("refuse une adresse vide après trim", () => {
    expect(schemaFicheBar.safeParse({ nomBar: "Le Sirius", adresseBar: "  " }).success).toBe(
      false
    );
  });
});

describe("schemaChangementEmail", () => {
  it("refuse un email invalide", () => {
    expect(
      schemaChangementEmail.safeParse({ nouvelEmail: "pas-un-email", motDePasseActuel: "x" })
        .success
    ).toBe(false);
  });

  it("exige le mot de passe actuel", () => {
    expect(
      schemaChangementEmail.safeParse({ nouvelEmail: "a@b.fr", motDePasseActuel: "" }).success
    ).toBe(false);
  });
});

describe("schemaChangementMotDePasse", () => {
  it("accepte un nouveau mot de passe confirmé", () => {
    expect(
      schemaChangementMotDePasse.safeParse({
        motDePasseActuel: "ancien",
        nouveauMotDePasse: "nouveau-mdp",
        confirmation: "nouveau-mdp",
      }).success
    ).toBe(true);
  });

  it("refuse une confirmation différente", () => {
    const resultat = schemaChangementMotDePasse.safeParse({
      motDePasseActuel: "ancien",
      nouveauMotDePasse: "nouveau-mdp",
      confirmation: "autre-mdp",
    });
    expect(resultat.success).toBe(false);
    expect(resultat.error?.issues[0]?.path).toEqual(["confirmation"]);
  });

  it("refuse un nouveau mot de passe trop court", () => {
    expect(
      schemaChangementMotDePasse.safeParse({
        motDePasseActuel: "ancien",
        nouveauMotDePasse: "court",
        confirmation: "court",
      }).success
    ).toBe(false);
  });
});

describe("schemaSuppressionCompte", () => {
  it("exige la saisie exacte de SUPPRIMER", () => {
    expect(
      schemaSuppressionCompte.safeParse({ motDePasseActuel: "x", confirmation: "supprimer" })
        .success
    ).toBe(false);
    expect(
      schemaSuppressionCompte.safeParse({ motDePasseActuel: "x", confirmation: "SUPPRIMER" })
        .success
    ).toBe(true);
  });
});

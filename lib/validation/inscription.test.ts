import { describe, expect, it } from "vitest";
import {
  schemaChangementEmail,
  schemaChangementMotDePasse,
  schemaConnexion,
  schemaFicheBar,
  schemaInscription,
  schemaMotDePasseOublie,
  schemaNomComplet,
  schemaNomCompletVideAutorise,
  schemaReinitialisationMotDePasse,
  schemaSuppressionCompte,
} from "./inscription";

describe("normalisation de l'email", () => {
  it("retire les espaces et passe en minuscules", () => {
    const resultat = schemaConnexion.safeParse({ email: "  Jean@MonBar.FR ", motDePasse: "x" });
    expect(resultat.success && resultat.data.email).toBe("jean@monbar.fr");
  });

  it("s'applique au mot de passe oublié", () => {
    const resultat = schemaMotDePasseOublie.safeParse({ email: "Jean@MonBar.fr" });
    expect(resultat.success && resultat.data.email).toBe("jean@monbar.fr");
  });

  it("refuse toujours un email invalide", () => {
    expect(schemaMotDePasseOublie.safeParse({ email: "pas-un-email" }).success).toBe(false);
  });
});

describe("schemaReinitialisationMotDePasse", () => {
  it("accepte un mot de passe de 8 caractères confirmé", () => {
    expect(
      schemaReinitialisationMotDePasse.safeParse({
        nouveauMotDePasse: "12345678",
        confirmation: "12345678",
      }).success
    ).toBe(true);
  });

  it("refuse un mot de passe de moins de 8 caractères", () => {
    expect(
      schemaReinitialisationMotDePasse.safeParse({
        nouveauMotDePasse: "1234567",
        confirmation: "1234567",
      }).success
    ).toBe(false);
  });

  it("refuse une confirmation différente", () => {
    expect(
      schemaReinitialisationMotDePasse.safeParse({
        nouveauMotDePasse: "12345678",
        confirmation: "12345679",
      }).success
    ).toBe(false);
  });
});

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

describe("nomComplet", () => {
  it("retire les espaces de début et de fin", () => {
    const resultat = schemaNomComplet.safeParse({ nomComplet: "  Camille Martin  " });
    expect(resultat.success && resultat.data.nomComplet).toBe("Camille Martin");
  });

  it("refuse un nom vide ou fait d'espaces", () => {
    expect(schemaNomComplet.safeParse({ nomComplet: "" }).success).toBe(false);
    expect(schemaNomComplet.safeParse({ nomComplet: "   " }).success).toBe(false);
  });

  it("accepte 80 caractères et refuse 81", () => {
    expect(schemaNomComplet.safeParse({ nomComplet: "a".repeat(80) }).success).toBe(true);
    expect(schemaNomComplet.safeParse({ nomComplet: "a".repeat(81) }).success).toBe(false);
  });

  it("ignore les espaces autour pour la limite de 80", () => {
    expect(schemaNomComplet.safeParse({ nomComplet: ` ${"a".repeat(80)} ` }).success).toBe(true);
  });

  it("est obligatoire à l'inscription", () => {
    const base = { email: "a@b.fr", motDePasse: "12345678", nomBar: "Bar", adresseBar: "1 rue X" };
    expect(schemaInscription.safeParse(base).success).toBe(false);
    expect(schemaInscription.safeParse({ ...base, nomComplet: "Camille Martin" }).success).toBe(true);
  });

  it("variante du profil : le vide passe, le trop long non", () => {
    expect(schemaNomCompletVideAutorise.safeParse({ nomComplet: "  " }).success).toBe(true);
    expect(schemaNomCompletVideAutorise.safeParse({ nomComplet: "a".repeat(81) }).success).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import {
  schemaChangementEmail,
  schemaChangementMotDePasse,
  schemaConnexion,
  schemaFicheBar,
  schemaInscription,
  schemaMotDePasseOublie,
  schemaIdentite,
  schemaIdentiteSansPrenom,
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
      schemaFicheBar.safeParse({
        nomBar: "Le Sirius",
        adresseBar: "4 quai Augagneur, Lyon",
        codePostalBar: "69002",
      }).success
    ).toBe(true);
  });

  it("exige un code postal de 5 chiffres", () => {
    const base = { nomBar: "Le Sirius", adresseBar: "4 quai Augagneur, Lyon" };
    for (const codePostalBar of ["", "6900", "690022", "69 02", "abcde"]) {
      expect(schemaFicheBar.safeParse({ ...base, codePostalBar }).success).toBe(false);
    }
    expect(schemaFicheBar.safeParse({ ...base, codePostalBar: " 69002 " }).success).toBe(true);
  });

  it("refuse un nom vide après trim", () => {
    expect(schemaFicheBar.safeParse({ nomBar: "   ", adresseBar: "Lyon", codePostalBar: "69001" }).success).toBe(false);
  });

  it("refuse une adresse vide après trim", () => {
    expect(schemaFicheBar.safeParse({ nomBar: "Le Sirius", adresseBar: "  ", codePostalBar: "69001" }).success).toBe(
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

describe("prénom et nom", () => {
  it("retirent les espaces de début et de fin", () => {
    const resultat = schemaIdentite.safeParse({ prenom: "  Camille ", nom: " Martin  " });
    expect(resultat.success && [resultat.data.prenom, resultat.data.nom]).toEqual(["Camille", "Martin"]);
  });

  it("refusent un champ vide ou fait d'espaces", () => {
    expect(schemaIdentite.safeParse({ prenom: "", nom: "Martin" }).success).toBe(false);
    expect(schemaIdentite.safeParse({ prenom: "Camille", nom: "   " }).success).toBe(false);
  });

  it("acceptent 40 caractères et refusent 41", () => {
    expect(schemaIdentite.safeParse({ prenom: "a".repeat(40), nom: "b".repeat(40) }).success).toBe(true);
    expect(schemaIdentite.safeParse({ prenom: "a".repeat(41), nom: "b" }).success).toBe(false);
    expect(schemaIdentite.safeParse({ prenom: "a", nom: "b".repeat(41) }).success).toBe(false);
  });

  it("sont obligatoires à l'inscription", () => {
    const base = { email: "a@b.fr", motDePasse: "12345678", nomBar: "Bar", adresseBar: "1 rue X", codePostalBar: "69001" };
    expect(schemaInscription.safeParse(base).success).toBe(false);
    expect(schemaInscription.safeParse({ ...base, prenom: "Camille" }).success).toBe(false);
    expect(schemaInscription.safeParse({ ...base, prenom: "Camille", nom: "Martin" }).success).toBe(true);
  });

  it("compte sans prénom : prénom exigé, nom libre, trop long refusé", () => {
    expect(schemaIdentiteSansPrenom.safeParse({ prenom: "  ", nom: "" }).success).toBe(false);
    expect(schemaIdentiteSansPrenom.safeParse({ prenom: "", nom: "Martin" }).success).toBe(false);
    expect(schemaIdentiteSansPrenom.safeParse({ prenom: "Camille", nom: "" }).success).toBe(true);
    expect(schemaIdentiteSansPrenom.safeParse({ prenom: "Camille", nom: "Camille Martin" }).success).toBe(true);
    expect(schemaIdentiteSansPrenom.safeParse({ prenom: "a".repeat(41), nom: "b" }).success).toBe(false);
  });
});

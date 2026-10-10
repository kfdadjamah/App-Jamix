import { describe, expect, it } from "vitest";
import { schemaContact } from "./contact";

const valide = { nom: "Alex", email: "alex@exemple.fr", message: "Bonjour, une question." };

function erreurs(champs: Partial<typeof valide>) {
  const resultat = schemaContact.safeParse({ ...valide, ...champs });
  return resultat.success ? [] : resultat.error.issues.map((issue) => issue.message);
}

describe("schemaContact", () => {
  it("accepte un message valide", () => {
    expect(erreurs({})).toEqual([]);
  });

  it("exige un nom de 1 à 100 caractères", () => {
    expect(erreurs({ nom: "   " })).toEqual(["Le nom est requis."]);
    expect(erreurs({ nom: "a".repeat(100) })).toEqual([]);
    expect(erreurs({ nom: "a".repeat(101) })).toEqual([
      "Le nom ne peut pas dépasser 100 caractères.",
    ]);
  });

  it("exige une adresse mail valide", () => {
    expect(erreurs({ email: "pas-un-email" })).toEqual(["Adresse email invalide."]);
  });

  it("exige un message de 10 à 2000 caractères, après normalisation", () => {
    expect(erreurs({ message: "  court   " })).toEqual([
      "Le message doit contenir au moins 10 caractères.",
    ]);
    expect(erreurs({ message: "a".repeat(2000) })).toEqual([]);
    expect(erreurs({ message: "a".repeat(2001) })).toEqual([
      "Le message ne peut pas dépasser 2000 caractères.",
    ]);
    // \r\n compte pour 1 caractère, comme dans le navigateur.
    expect(erreurs({ message: `${"a".repeat(999)}\r\n${"a".repeat(1000)}` })).toEqual([]);
  });

  it("normalise le message et retire les espaces du nom", () => {
    const resultat = schemaContact.parse({ ...valide, nom: "  Alex ", message: " Ligne 1\r\nLigne 2 " });
    expect(resultat.nom).toBe("Alex");
    expect(resultat.message).toBe("Ligne 1\nLigne 2");
  });
});

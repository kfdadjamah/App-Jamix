import { describe, expect, it } from "vitest";
import { schemaAnnonceBrouillon, schemaAnnoncePublication } from "./annonce";

const publicationMinimale = {
  dates: ["2030-01-10"],
  heureDebut: "20:00",
  styles: ["Jazz"],
};

describe("description d'une annonce", () => {
  it("est facultative, en brouillon comme en publication", () => {
    const brouillon = schemaAnnonceBrouillon.safeParse({});
    const publication = schemaAnnoncePublication.safeParse(publicationMinimale);
    expect(brouillon.success && brouillon.data.description).toBe("");
    expect(publication.success && publication.data.description).toBe("");
  });

  it("une description faite d'espaces est enregistrée comme absente", () => {
    const resultat = schemaAnnonceBrouillon.safeParse({ description: "  \r\n  " });
    expect(resultat.success && resultat.data.description).toBe("");
  });

  it("accepte 500 caractères et refuse au-delà, brouillon comme publication", () => {
    for (const schema of [schemaAnnonceBrouillon, schemaAnnoncePublication]) {
      expect(
        schema.safeParse({ ...publicationMinimale, description: "a".repeat(500) }).success
      ).toBe(true);
      const refus = schema.safeParse({ ...publicationMinimale, description: "a".repeat(501) });
      expect(refus.success).toBe(false);
      expect(!refus.success && refus.error.issues[0]?.message).toBe(
        "La description ne peut pas dépasser 500 caractères."
      );
    }
  });

  it("compte un retour à la ligne envoyé en \\r\\n pour un seul caractère", () => {
    const texte = "a".repeat(249) + "\r\n" + "a".repeat(250);
    const resultat = schemaAnnonceBrouillon.safeParse({ description: texte });
    expect(resultat.success && resultat.data.description).toBe(
      "a".repeat(249) + "\n" + "a".repeat(250)
    );
  });

  it("retire les espaces de début et de fin, garde les retours à la ligne internes", () => {
    const resultat = schemaAnnonceBrouillon.safeParse({ description: "  Déroulé :\n\n1. Bœuf  " });
    expect(resultat.success && resultat.data.description).toBe("Déroulé :\n\n1. Bœuf");
  });
});

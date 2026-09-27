import { describe, expect, it } from "vitest";
import { decisionSortie, instantane } from "./garde-sortie";

function formulaire(entrees: [string, string | File][]): FormData {
  const formData = new FormData();
  for (const [cle, valeur] of entrees) formData.append(cle, valeur);
  return formData;
}

describe("instantane", () => {
  it("est indépendant de l'ordre des champs et des cases cochées", () => {
    const a = formulaire([
      ["styles", "Jazz"],
      ["styles", "Blues"],
      ["heureDebut", "20:00"],
    ]);
    const b = formulaire([
      ["heureDebut", "20:00"],
      ["styles", "Blues"],
      ["styles", "Jazz"],
    ]);
    expect(instantane(a)).toBe(instantane(b));
  });

  it("détecte une case cochée en plus", () => {
    const avant = formulaire([["styles", "Jazz"]]);
    const apres = formulaire([
      ["styles", "Jazz"],
      ["styles", "Funk"],
    ]);
    expect(instantane(avant)).not.toBe(instantane(apres));
  });

  it("ignore le choix de portée", () => {
    const sansPortee = formulaire([
      ["heureDebut", "20:00"],
      ["porteeOccurrenceId", ""],
    ]);
    const avecPortee = formulaire([
      ["heureDebut", "20:00"],
      ["porteeOccurrenceId", "occ-1"],
    ]);
    expect(instantane(sansPortee)).toBe(instantane(avecPortee));
  });

  it("représente un input file vide de façon stable", () => {
    const vide1 = formulaire([["photo1", new File([], "", { lastModified: 1 })]]);
    const vide2 = formulaire([["photo1", new File([], "", { lastModified: 2 })]]);
    expect(instantane(vide1)).toBe(instantane(vide2));
  });

  it("détecte une photo sélectionnée", () => {
    const vide = formulaire([["photo1", new File([], "")]]);
    const avecPhoto = formulaire([["photo1", new File(["x"], "bar.jpg", { type: "image/jpeg" })]]);
    expect(instantane(vide)).not.toBe(instantane(avecPhoto));
  });
});

describe("decisionSortie", () => {
  it("sans modification -> sortie directe, même pour une annonce publiée", () => {
    expect(decisionSortie({ modifie: false, enregistrableEnBrouillon: true })).toBe("directe");
    expect(decisionSortie({ modifie: false, enregistrableEnBrouillon: false })).toBe("directe");
  });

  it("nouvelle annonce ou brouillon modifié -> enregistrement en brouillon", () => {
    expect(decisionSortie({ modifie: true, enregistrableEnBrouillon: true })).toBe("brouillon");
  });

  it("annonce publiée modifiée -> avertissement", () => {
    expect(decisionSortie({ modifie: true, enregistrableEnBrouillon: false })).toBe("avertir");
  });
});

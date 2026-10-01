import { describe, expect, it } from "vitest";
import {
  ERREUR_BAR_FIGE,
  ERREUR_BAR_REQUIS,
  barApresModification,
  estBarEnDouble,
  messageSuppressionBar,
  nettoyerEspaces,
  nomBarCorrespond,
} from "./bars";

const BARS = [
  { id: "a", nom: "Le Sirius", adresse: "4 quai Augagneur, Lyon" },
  { id: "b", nom: "La Clef de Voûte", adresse: "1 place Gabriel Rambaud, Lyon" },
];

describe("nettoyerEspaces", () => {
  it("retire les espaces en début et fin et réduit les espaces multiples", () => {
    expect(nettoyerEspaces("  Le   Sirius \t")).toBe("Le Sirius");
  });
});

describe("estBarEnDouble", () => {
  it("détecte un doublon en ignorant la casse et les espaces en trop", () => {
    expect(
      estBarEnDouble(BARS, { nom: "  le SIRIUS ", adresse: "4  quai augagneur,   Lyon" })
    ).toBe(true);
  });

  it("accepte un même nom à une autre adresse", () => {
    expect(estBarEnDouble(BARS, { nom: "Le Sirius", adresse: "10 rue Mercière, Lyon" })).toBe(
      false
    );
  });

  it("ne compare pas un bar modifié à lui-même", () => {
    expect(
      estBarEnDouble(BARS, { nom: "Le Sirius", adresse: "4 quai Augagneur, Lyon" }, "a")
    ).toBe(false);
  });

  it("refuse de renommer un bar comme un autre bar du compte", () => {
    expect(
      estBarEnDouble(
        BARS,
        { nom: "la clef de voûte", adresse: "1 place Gabriel Rambaud, Lyon" },
        "a"
      )
    ).toBe(true);
  });
});

describe("barApresModification", () => {
  it("applique le bar choisi sur un brouillon", () => {
    expect(
      barApresModification({ annonceEstPubliee: false, barIdActuel: "a", barIdSoumis: "b" })
    ).toEqual({ barId: "b" });
  });

  it("exige un bar sur un brouillon", () => {
    expect(
      barApresModification({ annonceEstPubliee: false, barIdActuel: "a", barIdSoumis: null })
    ).toEqual({ erreur: ERREUR_BAR_REQUIS });
  });

  it("garde le bar d'une annonce publiée quand aucun bar n'est soumis", () => {
    expect(
      barApresModification({ annonceEstPubliee: true, barIdActuel: "a", barIdSoumis: null })
    ).toEqual({ barId: "a" });
  });

  it("refuse de changer le bar d'une annonce publiée", () => {
    expect(
      barApresModification({ annonceEstPubliee: true, barIdActuel: "a", barIdSoumis: "b" })
    ).toEqual({ erreur: ERREUR_BAR_FIGE });
  });
});

describe("nomBarCorrespond", () => {
  it("ignore la casse et les espaces en trop", () => {
    expect(nomBarCorrespond("  le   SIRIUS ", "Le Sirius")).toBe(true);
  });

  it("refuse un nom différent ou vide", () => {
    expect(nomBarCorrespond("Le Siriu", "Le Sirius")).toBe(false);
    expect(nomBarCorrespond("", "Le Sirius")).toBe(false);
  });
});

describe("messageSuppressionBar", () => {
  it("sans annonce", () => {
    expect(messageSuppressionBar(0, 0)).toBe("Ce bar sera supprimé définitivement.");
  });

  it("au pluriel, avec des dates à venir publiées", () => {
    expect(messageSuppressionBar(3, 5)).toBe(
      "Ce bar et ses 3 annonces (dont 5 dates à venir publiées) seront supprimés définitivement. Les musiciens ne les verront plus."
    );
  });

  it("au singulier", () => {
    expect(messageSuppressionBar(1, 1)).toBe(
      "Ce bar et son annonce (dont 1 date à venir publiée) seront supprimés définitivement. Les musiciens ne les verront plus."
    );
  });

  it("sans date à venir publiée : ni parenthèse ni mention des musiciens", () => {
    expect(messageSuppressionBar(2, 0)).toBe(
      "Ce bar et ses 2 annonces seront supprimés définitivement."
    );
  });
});

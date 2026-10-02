import { describe, expect, it } from "vitest";
import { calculerStatutInitial, statutAffiche, valeursReprisesParBar } from "./annonces";

const AUJOURDHUI = new Date("2026-09-23");

function joursApres(jours: number): Date {
  return new Date(AUJOURDHUI.getTime() + jours * 24 * 60 * 60 * 1000);
}

describe("calculerStatutInitial", () => {
  it("date à J-8 (publiée aujourd'hui) -> PROGRAMMEE, confirmationJ7 = J-1 par rapport à aujourd'hui", () => {
    const resultat = calculerStatutInitial(joursApres(8), AUJOURDHUI);
    expect(resultat.statut).toBe("PROGRAMMEE");
    expect(resultat.confirmationJ7).toEqual(joursApres(1));
  });

  it("date à J-7 exactement -> CONFIRMEE (limite : 7 jours ou moins)", () => {
    const resultat = calculerStatutInitial(joursApres(7), AUJOURDHUI);
    expect(resultat.statut).toBe("CONFIRMEE");
    expect(resultat.confirmationJ7).toBeNull();
  });

  it("date à J-2 -> CONFIRMEE directement", () => {
    const resultat = calculerStatutInitial(joursApres(2), AUJOURDHUI);
    expect(resultat.statut).toBe("CONFIRMEE");
    expect(resultat.confirmationJ7).toBeNull();
  });
});

describe("statutAffiche", () => {
  it("PROGRAMMEE avec confirmationJ7 dans le passé -> EN_ATTENTE_CONFIRMATION", () => {
    const resultat = statutAffiche({
      statut: "PROGRAMMEE",
      confirmationJ7: joursApres(-1),
    }, AUJOURDHUI);
    expect(resultat).toBe("EN_ATTENTE_CONFIRMATION");
  });

  it("PROGRAMMEE avec confirmationJ7 dans le futur -> PROGRAMMEE inchangé", () => {
    const resultat = statutAffiche({
      statut: "PROGRAMMEE",
      confirmationJ7: joursApres(1),
    }, AUJOURDHUI);
    expect(resultat).toBe("PROGRAMMEE");
  });

  it("CONFIRMEE reste inchangé", () => {
    const resultat = statutAffiche({ statut: "CONFIRMEE", confirmationJ7: null }, AUJOURDHUI);
    expect(resultat).toBe("CONFIRMEE");
  });

  it("ANNULEE reste inchangé", () => {
    const resultat = statutAffiche({ statut: "ANNULEE", confirmationJ7: null }, AUJOURDHUI);
    expect(resultat).toBe("ANNULEE");
  });
});

describe("valeursReprisesParBar", () => {
  function annonce(surcharge: Partial<Parameters<typeof valeursReprisesParBar>[0][number]> = {}) {
    return {
      barId: "bar-a",
      statut: "PUBLIEE" as const,
      publieeLe: joursApres(-10),
      styles: ["Jazz"],
      styleAutre: null,
      instruments: ["Batterie"],
      instrumentAutre: null,
      photoUrl1: null,
      photoUrl2: null,
      occurrences: [{ date: joursApres(5), heureDebut: "20:00", heureFin: "23:00" }],
      ...surcharge,
    };
  }

  it("retient l'annonce publiée au publieeLe le plus récent du bar", () => {
    const table = valeursReprisesParBar([
      annonce({ styles: ["Blues"], publieeLe: joursApres(-20) }),
      annonce({ styles: ["Funk"], publieeLe: joursApres(-2) }),
      annonce({ styles: ["Rock"], publieeLe: joursApres(-5) }),
    ]);
    expect(table["bar-a"].styles).toEqual(["Funk"]);
    expect(table["bar-a"].publieeLe).toBe(joursApres(-2).toISOString());
  });

  it("ignore les brouillons, même plus récents", () => {
    const table = valeursReprisesParBar([
      annonce({ styles: ["Blues"] }),
      annonce({ statut: "BROUILLON", publieeLe: null, styles: ["Funk"] }),
    ]);
    expect(table["bar-a"].styles).toEqual(["Blues"]);
  });

  it("un bar sans annonce publiée est absent de la table", () => {
    const table = valeursReprisesParBar([
      annonce({ barId: "bar-b", statut: "BROUILLON", publieeLe: null }),
    ]);
    expect(table).toEqual({});
  });

  it("une annonce aux dates passées ou annulées reste reprenable", () => {
    const table = valeursReprisesParBar([
      annonce({ occurrences: [{ date: joursApres(-30), heureDebut: "19:00", heureFin: null }] }),
    ]);
    expect(table["bar-a"].heureDebut).toBe("19:00");
  });

  it("horaire de la première occurrence (date la plus ancienne), heureFin absente → vide", () => {
    const table = valeursReprisesParBar([
      annonce({
        occurrences: [
          { date: joursApres(14), heureDebut: "21:00", heureFin: "23:30" },
          { date: joursApres(7), heureDebut: "20:30", heureFin: null },
        ],
      }),
    ]);
    expect(table["bar-a"].heureDebut).toBe("20:30");
    expect(table["bar-a"].heureFin).toBe("");
  });

  it("sépare les bars et reprend précisions « Autre » et photos", () => {
    const table = valeursReprisesParBar([
      annonce({ barId: "bar-a", styles: ["Jazz"] }),
      annonce({
        barId: "bar-b",
        styles: ["Autre"],
        styleAutre: "Manouche",
        instruments: ["Autre"],
        instrumentAutre: "Contrebasse",
        photoUrl1: "https://blob/annonces/1.webp",
        occurrences: [],
      }),
    ]);
    expect(table["bar-a"].styles).toEqual(["Jazz"]);
    expect(table["bar-b"]).toMatchObject({
      styleAutre: "Manouche",
      instrumentAutre: "Contrebasse",
      photoUrl1: "https://blob/annonces/1.webp",
      photoUrl2: null,
      heureDebut: "",
      heureFin: "",
    });
  });
});

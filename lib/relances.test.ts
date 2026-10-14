import { describe, expect, it } from "vitest";
import { compterRelancesActives, messageRelance, pastillesDeCarte } from "./relances";

const AUJOURDHUI = new Date("2026-09-23");

function joursApres(jours: number): Date {
  return new Date(AUJOURDHUI.getTime() + jours * 24 * 60 * 60 * 1000);
}

describe("messageRelance", () => {
  it("joursAvantDate = 7 (limite haute du palier) -> En attente de confirmation", () => {
    const message = messageRelance(
      { statut: "PROGRAMMEE", confirmationJ7: joursApres(-1), date: joursApres(7) },
      AUJOURDHUI
    );
    expect(message).toBe("En attente de confirmation");
  });

  it("joursAvantDate = 6 -> En attente de confirmation", () => {
    const message = messageRelance(
      { statut: "PROGRAMMEE", confirmationJ7: joursApres(-1), date: joursApres(6) },
      AUJOURDHUI
    );
    expect(message).toBe("En attente de confirmation");
  });

  it("joursAvantDate = 5 -> Confirmation à faire bientôt", () => {
    const message = messageRelance(
      { statut: "PROGRAMMEE", confirmationJ7: joursApres(-1), date: joursApres(5) },
      AUJOURDHUI
    );
    expect(message).toBe("Confirmation à faire bientôt");
  });

  it("joursAvantDate = 4 -> Confirmation à faire bientôt", () => {
    const message = messageRelance(
      { statut: "PROGRAMMEE", confirmationJ7: joursApres(-1), date: joursApres(4) },
      AUJOURDHUI
    );
    expect(message).toBe("Confirmation à faire bientôt");
  });

  it("joursAvantDate = 3 -> Confirmation urgente", () => {
    const message = messageRelance(
      { statut: "PROGRAMMEE", confirmationJ7: joursApres(-1), date: joursApres(3) },
      AUJOURDHUI
    );
    expect(message).toBe("Confirmation urgente");
  });

  it("joursAvantDate = 2 -> Confirmation urgente", () => {
    const message = messageRelance(
      { statut: "PROGRAMMEE", confirmationJ7: joursApres(-1), date: joursApres(2) },
      AUJOURDHUI
    );
    expect(message).toBe("Confirmation urgente");
  });

  it("joursAvantDate = 1 -> Dernier rappel", () => {
    const message = messageRelance(
      { statut: "PROGRAMMEE", confirmationJ7: joursApres(-1), date: joursApres(1) },
      AUJOURDHUI
    );
    expect(message).toBe("Dernier rappel : confirmez aujourd'hui");
  });

  it("joursAvantDate = 0 -> Dernier rappel", () => {
    const message = messageRelance(
      { statut: "PROGRAMMEE", confirmationJ7: joursApres(-1), date: joursApres(0) },
      AUJOURDHUI
    );
    expect(message).toBe("Dernier rappel : confirmez aujourd'hui");
  });

  it("date passée (J+1) -> null", () => {
    const message = messageRelance(
      { statut: "PROGRAMMEE", confirmationJ7: joursApres(-8), date: joursApres(-1) },
      AUJOURDHUI
    );
    expect(message).toBeNull();
  });

  it("PROGRAMMEE non échue (confirmationJ7 dans le futur) -> null", () => {
    const message = messageRelance(
      { statut: "PROGRAMMEE", confirmationJ7: joursApres(1), date: joursApres(8) },
      AUJOURDHUI
    );
    expect(message).toBeNull();
  });

  it("CONFIRMEE -> null", () => {
    const message = messageRelance(
      { statut: "CONFIRMEE", confirmationJ7: null, date: joursApres(3) },
      AUJOURDHUI
    );
    expect(message).toBeNull();
  });

  it("ANNULEE -> null", () => {
    const message = messageRelance(
      { statut: "ANNULEE", confirmationJ7: null, date: joursApres(3) },
      AUJOURDHUI
    );
    expect(message).toBeNull();
  });
});

describe("compterRelancesActives", () => {
  it("compte uniquement les occurrences EN_ATTENTE_CONFIRMATION", () => {
    const occurrences = [
      { statut: "PROGRAMMEE" as const, confirmationJ7: joursApres(-1), date: joursApres(6) },
      { statut: "PROGRAMMEE" as const, confirmationJ7: joursApres(1), date: joursApres(8) },
      { statut: "CONFIRMEE" as const, confirmationJ7: null, date: joursApres(3) },
      { statut: "ANNULEE" as const, confirmationJ7: null, date: joursApres(3) },
      { statut: "PROGRAMMEE" as const, confirmationJ7: joursApres(-5), date: joursApres(2) },
    ];
    expect(compterRelancesActives(occurrences, AUJOURDHUI)).toBe(2);
  });

  it("exclut une date passée et compte une date du jour (J0)", () => {
    const occurrences = [
      { statut: "PROGRAMMEE" as const, confirmationJ7: joursApres(-8), date: joursApres(-1) },
      { statut: "PROGRAMMEE" as const, confirmationJ7: joursApres(-7), date: joursApres(0) },
    ];
    expect(compterRelancesActives(occurrences, AUJOURDHUI)).toBe(1);
  });

  it("retourne 0 sur un tableau vide", () => {
    expect(compterRelancesActives([])).toBe(0);
  });
});

describe("pastillesDeCarte", () => {
  function occurrence(jours: number, statut: "PROGRAMMEE" | "CONFIRMEE" | "ANNULEE" = "PROGRAMMEE") {
    return { statut, confirmationJ7: joursApres(jours - 7), date: joursApres(jours) };
  }

  it("hebdomadaire sur 12 mois : 6 pastilles, le reste en « autres »", () => {
    const occurrences = Array.from({ length: 52 }, (_, i) => occurrence(10 + i * 7));
    const { affichees, autres } = pastillesDeCarte(occurrences, AUJOURDHUI);
    expect(affichees).toHaveLength(6);
    expect(autres).toBe(46);
    expect(affichees[0].date).toEqual(joursApres(10));
  });

  it("dates passées exclues des pastilles et du compte", () => {
    const occurrences = [occurrence(-14), occurrence(-7), occurrence(10)];
    const { affichees, autres, aVenir } = pastillesDeCarte(occurrences, AUJOURDHUI);
    expect(affichees.map((o) => o.date)).toEqual([joursApres(10)]);
    expect(autres).toBe(0);
    expect(aVenir).toBe(1);
  });

  it("dates à confirmer en tête, toutes affichées, puis les suivantes chronologiquement", () => {
    const occurrences = [
      occurrence(12),
      occurrence(1, "CONFIRMEE"),
      occurrence(5),
      occurrence(0),
      occurrence(20),
    ];
    const { affichees } = pastillesDeCarte(occurrences, AUJOURDHUI);
    expect(affichees.map((o) => o.date)).toEqual([
      joursApres(0),
      joursApres(5),
      joursApres(1),
      joursApres(12),
      joursApres(20),
    ]);
  });

  it("plus de 6 dates à confirmer : toutes affichées, aucune autre", () => {
    const occurrences = [...Array.from({ length: 7 }, (_, i) => occurrence(i)), occurrence(30)];
    const { affichees, autres } = pastillesDeCarte(occurrences, AUJOURDHUI);
    expect(affichees).toHaveLength(7);
    expect(autres).toBe(1);
  });

  it("une date à venir annulée prend sa place dans l'ordre", () => {
    const occurrences = [occurrence(10), occurrence(17, "ANNULEE"), occurrence(24)];
    const { affichees } = pastillesDeCarte(occurrences, AUJOURDHUI);
    expect(affichees.map((o) => o.statut)).toEqual(["PROGRAMMEE", "ANNULEE", "PROGRAMMEE"]);
  });
});

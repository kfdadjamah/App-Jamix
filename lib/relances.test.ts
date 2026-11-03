import { describe, expect, it } from "vitest";
import { compterRelancesActives, messageRelance, pastillesDeCarte } from "./relances";

const AUJOURDHUI = new Date("2026-09-23");

function joursApres(jours: number): Date {
  return new Date(AUJOURDHUI.getTime() + jours * 24 * 60 * 60 * 1000);
}

const MENTION = "Sans confirmation à J-3, la date sera automatiquement confirmée.";

describe("messageRelance", () => {
  function programmee(joursRestants: number) {
    return {
      statut: "PROGRAMMEE" as const,
      confirmationJ7: joursApres(joursRestants - 7),
      date: joursApres(joursRestants),
    };
  }

  it.each([7, 6])("%i jours restants -> En attente de confirmation + mention J-3", (jours) => {
    expect(messageRelance(programmee(jours), AUJOURDHUI)).toBe(
      `En attente de confirmation. ${MENTION}`
    );
  });

  it.each([5, 4])("%i jours restants -> Confirmation à faire bientôt + mention J-3", (jours) => {
    expect(messageRelance(programmee(jours), AUJOURDHUI)).toBe(
      `Confirmation à faire bientôt. ${MENTION}`
    );
  });

  it.each([3, 2, 1, 0])("%i jours restants -> aucune relance (confirmée automatiquement)", (jours) => {
    expect(messageRelance(programmee(jours), AUJOURDHUI)).toBeNull();
  });

  it("date passée -> null", () => {
    expect(messageRelance(programmee(-1), AUJOURDHUI)).toBeNull();
  });

  it("PROGRAMMEE non échue (plus de 7 jours) -> null", () => {
    expect(messageRelance(programmee(8), AUJOURDHUI)).toBeNull();
  });

  it("CONFIRMEE -> null", () => {
    const message = messageRelance(
      { statut: "CONFIRMEE", confirmationJ7: null, date: joursApres(5) },
      AUJOURDHUI
    );
    expect(message).toBeNull();
  });

  it("ANNULEE -> null", () => {
    const message = messageRelance(
      { statut: "ANNULEE", confirmationJ7: null, date: joursApres(5) },
      AUJOURDHUI
    );
    expect(message).toBeNull();
  });
});

describe("compterRelancesActives", () => {
  it("compte uniquement les occurrences en attente (de J-7 à J-4)", () => {
    const occurrences = [
      { statut: "PROGRAMMEE" as const, confirmationJ7: joursApres(-1), date: joursApres(6) },
      { statut: "PROGRAMMEE" as const, confirmationJ7: joursApres(1), date: joursApres(8) },
      { statut: "CONFIRMEE" as const, confirmationJ7: null, date: joursApres(5) },
      { statut: "ANNULEE" as const, confirmationJ7: null, date: joursApres(5) },
      { statut: "PROGRAMMEE" as const, confirmationJ7: joursApres(-5), date: joursApres(2) },
      { statut: "PROGRAMMEE" as const, confirmationJ7: joursApres(-3), date: joursApres(4) },
    ];
    expect(compterRelancesActives(occurrences, AUJOURDHUI)).toBe(2);
  });

  it("exclut une date passée et une date du jour (confirmée automatiquement)", () => {
    const occurrences = [
      { statut: "PROGRAMMEE" as const, confirmationJ7: joursApres(-8), date: joursApres(-1) },
      { statut: "PROGRAMMEE" as const, confirmationJ7: joursApres(-7), date: joursApres(0) },
    ];
    expect(compterRelancesActives(occurrences, AUJOURDHUI)).toBe(0);
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
    // Seule la date à J-5 est en attente ; celle du jour (J0) est confirmée automatiquement.
    expect(affichees.map((o) => o.date)).toEqual([
      joursApres(5),
      joursApres(0),
      joursApres(1),
      joursApres(12),
      joursApres(20),
    ]);
  });

  it("plus de 6 dates à confirmer : toutes affichées, aucune autre", () => {
    const occurrences = [...Array.from({ length: 7 }, (_, i) => occurrence(4 + (i % 4))), occurrence(30)];
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

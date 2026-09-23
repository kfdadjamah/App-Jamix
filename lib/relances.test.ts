import { describe, expect, it } from "vitest";
import { compterRelancesActives, messageRelance } from "./relances";

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
      { statut: "PROGRAMMEE" as const, confirmationJ7: joursApres(-1) },
      { statut: "PROGRAMMEE" as const, confirmationJ7: joursApres(1) },
      { statut: "CONFIRMEE" as const, confirmationJ7: null },
      { statut: "ANNULEE" as const, confirmationJ7: null },
      { statut: "PROGRAMMEE" as const, confirmationJ7: joursApres(-5) },
    ];
    expect(compterRelancesActives(occurrences)).toBe(2);
  });

  it("retourne 0 sur un tableau vide", () => {
    expect(compterRelancesActives([])).toBe(0);
  });
});

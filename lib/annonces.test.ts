import { describe, expect, it } from "vitest";
import { calculerStatutInitial, statutAffiche } from "./annonces";

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
    });
    expect(resultat).toBe("EN_ATTENTE_CONFIRMATION");
  });

  it("PROGRAMMEE avec confirmationJ7 dans le futur -> PROGRAMMEE inchangé", () => {
    const resultat = statutAffiche({
      statut: "PROGRAMMEE",
      confirmationJ7: joursApres(1),
    });
    expect(resultat).toBe("PROGRAMMEE");
  });

  it("CONFIRMEE reste inchangé", () => {
    const resultat = statutAffiche({ statut: "CONFIRMEE", confirmationJ7: null });
    expect(resultat).toBe("CONFIRMEE");
  });

  it("ANNULEE reste inchangé", () => {
    const resultat = statutAffiche({ statut: "ANNULEE", confirmationJ7: null });
    expect(resultat).toBe("ANNULEE");
  });
});

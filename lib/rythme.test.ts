import { describe, expect, it } from "vitest";
import { mentionAnnonce, mentionRythme } from "./rythme";

const d = (...isos: string[]) => isos.map((iso) => new Date(iso));

describe("mentionRythme", () => {
  it("sans date : aucune mention", () => {
    expect(mentionRythme([])).toBeNull();
  });

  it("une seule date : Exceptionnelle", () => {
    expect(mentionRythme(d("2026-11-03"))).toBe("Exceptionnelle");
  });

  it("mardis consécutifs : Tous les mardis", () => {
    expect(mentionRythme(d("2026-11-10", "2026-11-17", "2026-11-24", "2026-12-08"))).toBe(
      "Tous les mardis",
    );
  });

  it("mardis consécutifs avec un trou : toujours Tous les mardis", () => {
    expect(mentionRythme(d("2026-11-10", "2026-11-17", "2026-12-08", "2026-12-15"))).toBe(
      "Tous les mardis",
    );
  });

  it("ordre et doublons sans effet", () => {
    expect(mentionRythme(d("2026-11-24", "2026-11-10", "2026-11-17", "2026-11-17"))).toBe(
      "Tous les mardis",
    );
  });

  it("mardis espacés de 14 jours : Un mardi sur deux", () => {
    expect(mentionRythme(d("2026-11-10", "2026-11-24", "2026-12-08", "2027-01-05"))).toBe(
      "Un mardi sur deux",
    );
  });

  it("1ers vendredis du mois : Le 1er vendredi du mois", () => {
    expect(mentionRythme(d("2026-11-06", "2026-12-04", "2027-01-01", "2027-02-05"))).toBe(
      "Le 1er vendredi du mois",
    );
  });

  it("1ers mardis espacés de 28 jours : mensuel prioritaire sur hebdomadaire", () => {
    expect(mentionRythme(d("2026-11-03", "2026-12-01"))).toBe("Le 1er mardi du mois");
  });

  it("3e mercredi avec un mois sauté : Le 3e mercredi du mois", () => {
    expect(mentionRythme(d("2026-11-18", "2027-01-20"))).toBe("Le 3e mercredi du mois");
  });

  it("derniers jeudis de mois consécutifs : Le dernier jeudi du mois", () => {
    // 26 nov. (4e), 31 déc. (5e), 28 janv. (4e), 25 févr. (4e)
    expect(mentionRythme(d("2026-11-26", "2026-12-31", "2027-01-28", "2027-02-25"))).toBe(
      "Le dernier jeudi du mois",
    );
  });

  it("jours de la semaine différents : Récurrente", () => {
    expect(mentionRythme(d("2026-11-10", "2026-11-12", "2026-11-17"))).toBe("Récurrente");
  });

  it("dimanches consécutifs : Tous les dimanches", () => {
    expect(mentionRythme(d("2026-11-08", "2026-11-15"))).toBe("Tous les dimanches");
  });
});

describe("mentionAnnonce", () => {
  it("règle hebdomadaire : la mention vient de la règle, trous compris", () => {
    expect(
      mentionAnnonce({
        rythme: "CHAQUE_SEMAINE",
        jourSemaine: 2,
        occurrences: d("2026-11-03", "2026-11-24").map((date) => ({ date })),
      })
    ).toBe("Tous les mardis");
  });

  it("dimanche (7) : Tous les dimanches", () => {
    expect(
      mentionAnnonce({ rythme: "CHAQUE_SEMAINE", jourSemaine: 7, occurrences: [{ date: new Date("2026-11-08") }] })
    ).toBe("Tous les dimanches");
  });

  it("sans règle : déduite des dates ; sans date : aucune mention", () => {
    expect(mentionAnnonce({ occurrences: [{ date: new Date("2026-11-03") }] })).toBe("Exceptionnelle");
    expect(mentionAnnonce({ rythme: "CHAQUE_SEMAINE", jourSemaine: 2, occurrences: [] })).toBeNull();
  });
});

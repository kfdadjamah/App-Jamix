import { describe, expect, it } from "vitest";
import {
  ERREUR_FIN_AVANT_DEBUT,
  ERREUR_PLUS_DE_12_MOIS,
  datesAPublier,
  datesDeLaRegle,
  erreurBornes,
  finMaximale,
  retireesPertinentes,
  type RegleRecurrence,
} from "./recurrence";

const mardis = (debut: string, fin: string): RegleRecurrence => ({
  rythme: "CHAQUE_SEMAINE",
  jourSemaine: 2,
  debut,
  fin,
});

describe("datesDeLaRegle", () => {
  it("tous les mardis du 3 nov. 2026 au 26 janv. 2027 : 13 mardis", () => {
    const dates = datesDeLaRegle(mardis("2026-11-03", "2027-01-26"));
    expect(dates).toHaveLength(13);
    expect(dates[0]).toBe("2026-11-03");
    expect(dates.at(-1)).toBe("2027-01-26");
    expect(dates.every((date) => new Date(date).getUTCDay() === 2)).toBe(true);
  });

  it("la première date est le premier jour choisi à partir du début", () => {
    const dates = datesDeLaRegle({ ...mardis("2026-11-04", "2026-11-30"), jourSemaine: 7 });
    expect(dates).toEqual(["2026-11-08", "2026-11-15", "2026-11-22", "2026-11-29"]);
  });

  it("aucun jour correspondant entre les bornes : aucune date", () => {
    expect(datesDeLaRegle(mardis("2026-11-04", "2026-11-09"))).toEqual([]);
  });

  it("bornes invalides : aucune date", () => {
    expect(datesDeLaRegle(mardis("2026-11-10", "2026-11-03"))).toEqual([]);
  });
});

describe("erreurBornes", () => {
  it("fin antérieure au début", () => {
    expect(erreurBornes(mardis("2026-11-10", "2026-11-03"))).toBe(ERREUR_FIN_AVANT_DEBUT);
  });

  it("12 mois exactement : accepté ; un jour de plus : refusé", () => {
    expect(finMaximale("2026-11-03")).toBe("2027-11-03");
    expect(erreurBornes(mardis("2026-11-03", "2027-11-03"))).toBeNull();
    expect(erreurBornes(mardis("2026-11-03", "2027-11-04"))).toBe(ERREUR_PLUS_DE_12_MOIS);
  });
});

describe("datesAPublier", () => {
  it("retire les dates passées et les dates retirées", () => {
    const dates = datesAPublier(
      mardis("2026-11-03", "2026-12-01"),
      ["2026-11-24"],
      "2026-11-10"
    );
    expect(dates).toEqual(["2026-11-10", "2026-11-17", "2026-12-01"]);
  });
});

describe("retireesPertinentes", () => {
  it("oublie une date que la règle ne produit plus", () => {
    const regle = mardis("2026-11-03", "2026-11-17");
    expect(retireesPertinentes(regle, ["2026-11-10", "2026-11-11", "2026-12-01"])).toEqual([
      "2026-11-10",
    ]);
  });
});

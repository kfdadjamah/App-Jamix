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

describe("datesDeLaRegle, une semaine sur deux et mensuel (phase 61)", () => {
  it("un mardi sur deux : 14 jours exactement, à partir de la première date", () => {
    const dates = datesDeLaRegle({ ...mardis("2026-11-04", "2027-01-31"), rythme: "UNE_SEMAINE_SUR_DEUX" });
    expect(dates[0]).toBe("2026-11-10");
    expect(dates).toHaveLength(6);
    const ecarts = dates.slice(1).map((date, i) => (Date.parse(date) - Date.parse(dates[i])) / 86_400_000);
    expect(ecarts.every((ecart) => ecart === 14)).toBe(true);
  });

  it("le dernier jeudi du mois sur 6 mois : 6 dates, chacune le dernier jeudi de son mois", () => {
    const dates = datesDeLaRegle({
      rythme: "MENSUEL",
      jourSemaine: 4,
      semaineDuMois: -1,
      debut: "2026-11-01",
      fin: "2027-04-30",
    });
    expect(dates).toEqual([
      "2026-11-26",
      "2026-12-31",
      "2027-01-28",
      "2027-02-25",
      "2027-03-25",
      "2027-04-29",
    ]);
  });

  it("le 1er vendredi du mois ; un mois dont la date précède le début est sauté", () => {
    const dates = datesDeLaRegle({
      rythme: "MENSUEL",
      jourSemaine: 5,
      semaineDuMois: 1,
      debut: "2026-11-07",
      fin: "2027-02-05",
    });
    expect(dates).toEqual(["2026-12-04", "2027-01-01", "2027-02-05"]);
  });

  it("le 4e dimanche : jamais au-delà du 28", () => {
    const dates = datesDeLaRegle({
      rythme: "MENSUEL",
      jourSemaine: 7,
      semaineDuMois: 4,
      debut: "2026-11-01",
      fin: "2027-01-31",
    });
    expect(dates).toEqual(["2026-11-22", "2026-12-27", "2027-01-24"]);
  });

  it("mensuel sans semaine du mois : aucune date", () => {
    expect(datesDeLaRegle({ ...mardis("2026-11-01", "2027-01-31"), rythme: "MENSUEL" })).toEqual([]);
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

import { describe, expect, it } from "vitest";
import {
  cleRegle,
  planRecreation,
  regleModifiee,
  saisieDeLAnnonce,
  type SaisieRegle,
} from "./modification-regle";

const mardis: SaisieRegle = {
  typeJam: "recurrente",
  dateUnique: "",
  rythme: "CHAQUE_SEMAINE",
  jourSemaine: "2",
  semaineDuMois: "",
  debutRecurrence: "2026-11-03",
  finRecurrence: "2027-01-26",
  datesRetirees: [],
  datesUneAUne: [],
};

const annonceSansRegle = {
  estRecurrente: true,
  rythme: null,
  jourSemaine: null,
  semaineDuMois: null,
  debutRecurrence: null,
  finRecurrence: null,
  datesRetirees: [],
};

describe("regleModifiee", () => {
  it("une saisie identique ne modifie rien", () => {
    expect(regleModifiee(mardis, { ...mardis })).toBe(false);
  });

  it("changer le jour, le rythme, le début, la fin ou le type modifie la règle", () => {
    expect(regleModifiee(mardis, { ...mardis, jourSemaine: "4" })).toBe(true);
    expect(regleModifiee(mardis, { ...mardis, rythme: "UNE_SEMAINE_SUR_DEUX" })).toBe(true);
    expect(regleModifiee(mardis, { ...mardis, debutRecurrence: "2026-11-10" })).toBe(true);
    expect(regleModifiee(mardis, { ...mardis, finRecurrence: "2027-03-30" })).toBe(true);
    expect(
      regleModifiee(mardis, { ...mardis, typeJam: "exceptionnelle", dateUnique: "2026-11-03" })
    ).toBe(true);
  });

  it("retirer une date produite par la règle la modifie ; une date retirée hors règle est ignorée", () => {
    expect(regleModifiee(mardis, { ...mardis, datesRetirees: ["2026-11-10"] })).toBe(true);
    expect(regleModifiee(mardis, { ...mardis, datesRetirees: ["2026-11-11"] })).toBe(false);
  });

  it("la semaine du mois ne compte qu'en mensuel", () => {
    expect(regleModifiee(mardis, { ...mardis, semaineDuMois: "1" })).toBe(false);
    const mensuel = { ...mardis, rythme: "MENSUEL" as const, semaineDuMois: "1" };
    expect(regleModifiee(mensuel, { ...mensuel, semaineDuMois: "-1" })).toBe(true);
  });

  it("dates choisies une à une : une règle partielle ne modifie rien, un « × » ou un rythme complet si", () => {
    const uneAUne = { ...mardis, jourSemaine: "", debutRecurrence: "", finRecurrence: "", datesUneAUne: ["2026-11-03", "2026-11-12"] };
    expect(regleModifiee(uneAUne, { ...uneAUne, jourSemaine: "5", rythme: "MENSUEL" })).toBe(false);
    expect(regleModifiee(uneAUne, { ...uneAUne, datesUneAUne: ["2026-11-03"] })).toBe(true);
    expect(regleModifiee(uneAUne, { ...mardis })).toBe(true);
  });

  it("vider le jour d'une règle complète la modifie", () => {
    expect(regleModifiee(mardis, { ...mardis, jourSemaine: "" })).toBe(true);
  });
});

describe("saisieDeLAnnonce", () => {
  it("ancienne annonce publiée sans règle : seules ses dates à venir sont choisies une à une", () => {
    const saisie = saisieDeLAnnonce(annonceSansRegle, ["2026-10-06", "2026-10-20", "2026-11-03"], {
      publiee: true,
      aujourdHui: "2026-10-20",
    });
    expect(saisie.datesUneAUne).toEqual(["2026-10-20", "2026-11-03"]);
  });

  it("brouillon sans règle : toutes ses dates", () => {
    const saisie = saisieDeLAnnonce(annonceSansRegle, ["2026-10-06", "2026-11-03"], {
      publiee: false,
      aujourdHui: "2026-10-20",
    });
    expect(saisie.datesUneAUne).toEqual(["2026-10-06", "2026-11-03"]);
  });

  it("ancienne annonce à une date : exceptionnelle à cette date", () => {
    const saisie = saisieDeLAnnonce({ ...annonceSansRegle, estRecurrente: false }, ["2026-11-03"], {
      publiee: true,
    });
    expect(saisie.typeJam).toBe("exceptionnelle");
    expect(saisie.dateUnique).toBe("2026-11-03");
  });

  it("la saisie d'une annonce et sa clé sont stables (aucune fenêtre sans modification)", () => {
    const annonce = {
      estRecurrente: true,
      rythme: "MENSUEL" as const,
      jourSemaine: 5,
      semaineDuMois: 1,
      debutRecurrence: new Date("2026-11-01"),
      finRecurrence: new Date("2027-04-30"),
      datesRetirees: [new Date("2026-12-04")],
    };
    const saisie = saisieDeLAnnonce(annonce, [], { publiee: true });
    expect(cleRegle(saisie)).toBe(cleRegle({ ...saisie, datesRetirees: ["2026-12-04"] }));
    expect(saisie.semaineDuMois).toBe("1");
  });
});

describe("planRecreation", () => {
  it("garde les dates communes, supprime celles qui disparaissent, crée les nouvelles", () => {
    const plan = planRecreation(
      ["2026-11-03", "2026-11-10", "2026-11-17"],
      ["2026-11-10", "2026-11-17", "2026-11-24"],
      "2026-11-01"
    );
    expect(plan).toEqual({ aSupprimer: ["2026-11-03"], aCreer: ["2026-11-24"] });
  });

  it("ne touche jamais aux dates passées ; aujourd'hui compte comme à venir", () => {
    const plan = planRecreation(
      ["2026-10-27", "2026-11-03", "2026-11-10"],
      ["2026-10-29", "2026-11-05"],
      "2026-11-03"
    );
    expect(plan).toEqual({ aSupprimer: ["2026-11-03", "2026-11-10"], aCreer: ["2026-11-05"] });
  });
});

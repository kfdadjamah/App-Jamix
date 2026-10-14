import { describe, expect, it } from "vitest";
import { resoudreDates, schemaAnnonceBrouillon, schemaAnnoncePublication } from "./annonce";

const publicationMinimale = {
  dates: ["2030-01-10"],
  heureDebut: "20:00",
  styles: ["Jazz"],
};

describe("description d'une annonce", () => {
  it("est facultative, en brouillon comme en publication", () => {
    const brouillon = schemaAnnonceBrouillon.safeParse({});
    const publication = schemaAnnoncePublication.safeParse(publicationMinimale);
    expect(brouillon.success && brouillon.data.description).toBe("");
    expect(publication.success && publication.data.description).toBe("");
  });

  it("une description faite d'espaces est enregistrée comme absente", () => {
    const resultat = schemaAnnonceBrouillon.safeParse({ description: "  \r\n  " });
    expect(resultat.success && resultat.data.description).toBe("");
  });

  it("accepte 500 caractères et refuse au-delà, brouillon comme publication", () => {
    for (const schema of [schemaAnnonceBrouillon, schemaAnnoncePublication]) {
      expect(
        schema.safeParse({ ...publicationMinimale, description: "a".repeat(500) }).success
      ).toBe(true);
      const refus = schema.safeParse({ ...publicationMinimale, description: "a".repeat(501) });
      expect(refus.success).toBe(false);
      expect(!refus.success && refus.error.issues[0]?.message).toBe(
        "La description ne peut pas dépasser 500 caractères."
      );
    }
  });

  it("compte un retour à la ligne envoyé en \\r\\n pour un seul caractère", () => {
    const texte = "a".repeat(249) + "\r\n" + "a".repeat(250);
    const resultat = schemaAnnonceBrouillon.safeParse({ description: texte });
    expect(resultat.success && resultat.data.description).toBe(
      "a".repeat(249) + "\n" + "a".repeat(250)
    );
  });

  it("retire les espaces de début et de fin, garde les retours à la ligne internes", () => {
    const resultat = schemaAnnonceBrouillon.safeParse({ description: "  Déroulé :\n\n1. Bœuf  " });
    expect(resultat.success && resultat.data.description).toBe("Déroulé :\n\n1. Bœuf");
  });
});

describe("« Tous les styles »", () => {
  it("suffit seule pour publier", () => {
    const resultat = schemaAnnoncePublication.safeParse({
      ...publicationMinimale,
      styles: ["Tous les styles"],
    });
    expect(resultat.success).toBe(true);
  });

  it("est refusée avec un autre style, brouillon comme publication", () => {
    for (const schema of [schemaAnnonceBrouillon, schemaAnnoncePublication]) {
      const refus = schema.safeParse({
        ...publicationMinimale,
        styles: ["Tous les styles", "Jazz"],
      });
      expect(refus.success).toBe(false);
      expect(!refus.success && refus.error.issues[0]?.message).toBe(
        '"Tous les styles" ne peut pas être combiné avec un autre style.'
      );
    }
  });

  it("est refusée avec une précision « Autre »", () => {
    for (const schema of [schemaAnnonceBrouillon, schemaAnnoncePublication]) {
      const refus = schema.safeParse({
        ...publicationMinimale,
        styles: ["Tous les styles"],
        styleAutre: "Manouche",
      });
      expect(refus.success).toBe(false);
    }
  });

  it("un brouillon peut toujours n'avoir aucun style", () => {
    expect(schemaAnnonceBrouillon.safeParse({ styles: [] }).success).toBe(true);
  });
});

describe("coOrganisateur", () => {
  it("espaces retirés, vide ou absent → chaîne vide", () => {
    expect(schemaAnnonceBrouillon.parse({ coOrganisateur: "  Marc  " }).coOrganisateur).toBe("Marc");
    expect(schemaAnnonceBrouillon.parse({ coOrganisateur: "   " }).coOrganisateur).toBe("");
    expect(schemaAnnonceBrouillon.parse({}).coOrganisateur).toBe("");
  });

  it("40 caractères acceptés, 41 refusés", () => {
    expect(schemaAnnonceBrouillon.safeParse({ coOrganisateur: "a".repeat(40) }).success).toBe(true);
    expect(schemaAnnonceBrouillon.safeParse({ coOrganisateur: "a".repeat(41) }).success).toBe(false);
  });
});

describe("resoudreDates (phase 60)", () => {
  const aujourdHui = "2026-11-10";
  const recurrente = (champs: Record<string, unknown>) =>
    schemaAnnonceBrouillon.parse({
      typeJam: "recurrente",
      rythme: "CHAQUE_SEMAINE",
      jourSemaine: "2",
      debutRecurrence: "2026-11-03",
      finRecurrence: "2026-12-01",
      ...champs,
    });

  it("recalcule les dates depuis la règle et ignore celles du client", () => {
    const resultat = resoudreDates(recurrente({ dates: ["2026-11-12"] }), {
      publication: true,
      aujourdHui,
    });
    expect("dates" in resultat && resultat.dates).toEqual([
      "2026-11-10",
      "2026-11-17",
      "2026-11-24",
      "2026-12-01",
    ]);
  });

  it("une date retirée n'est pas publiée et reste mémorisée", () => {
    const resultat = resoudreDates(recurrente({ datesRetirees: ["2026-11-24", "2026-11-25"] }), {
      publication: true,
      aujourdHui,
    });
    expect("dates" in resultat && resultat.dates).not.toContain("2026-11-24");
    expect("dates" in resultat && resultat.datesRetirees).toEqual(["2026-11-24"]);
  });

  it("publication : messages d'erreur prévus", () => {
    const erreur = (champs: Record<string, unknown>) =>
      resoudreDates(recurrente(champs), { publication: true, aujourdHui });
    expect(erreur({ finRecurrence: "2026-11-01" })).toEqual({
      erreur: "La date de fin doit suivre la date de début.",
    });
    expect(erreur({ finRecurrence: "2027-11-04" })).toEqual({
      erreur: "La récurrence ne peut pas dépasser 12 mois.",
    });
    expect(erreur({ debutRecurrence: "2026-11-04", finRecurrence: "2026-11-09" })).toEqual({
      erreur: "Aucune date ne correspond à ce rythme entre ces deux dates.",
    });
    expect(erreur({ jourSemaine: "" })).toEqual({
      erreur: "Choisissez un jour, une date de début et une date de fin.",
    });
  });

  it("brouillon : règle incomplète ou invalide acceptée, sans date", () => {
    for (const champs of [{ jourSemaine: "" }, { finRecurrence: "2026-11-01" }]) {
      const resultat = resoudreDates(recurrente(champs), { publication: false, aujourdHui });
      expect("dates" in resultat && resultat.dates).toEqual([]);
    }
  });

  it("ancien brouillon sans règle : garde seulement ses dates déjà enregistrées", () => {
    const resultat = resoudreDates(
      recurrente({ jourSemaine: "", dates: ["2026-12-05", "2026-12-12", "2027-01-01"] }),
      { publication: false, aujourdHui, datesExistantes: ["2026-12-05", "2026-12-12", "2026-12-19"] }
    );
    expect("dates" in resultat && resultat.dates).toEqual(["2026-12-05", "2026-12-12"]);
  });

  it("exceptionnelle : une seule date, à partir d'aujourd'hui", () => {
    const exceptionnelle = (dateUnique: string) =>
      schemaAnnonceBrouillon.parse({ typeJam: "exceptionnelle", dateUnique });
    expect(resoudreDates(exceptionnelle(""), { publication: true, aujourdHui })).toEqual({
      erreur: "Choisissez une date.",
    });
    expect(resoudreDates(exceptionnelle("2026-11-09"), { publication: true, aujourdHui })).toEqual({
      erreur: "Choisissez une date.",
    });
    const resultat = resoudreDates(exceptionnelle("2026-11-20"), { publication: true, aujourdHui });
    expect(resultat).toMatchObject({ estRecurrente: false, rythme: null, dates: ["2026-11-20"] });
  });
});

describe("resoudreDates, une semaine sur deux et mensuel (phase 61)", () => {
  const aujourdHui = "2026-11-10";
  const mensuel = (champs: Record<string, unknown>) =>
    schemaAnnonceBrouillon.parse({
      typeJam: "recurrente",
      rythme: "MENSUEL",
      jourSemaine: "4",
      semaineDuMois: "-1",
      debutRecurrence: "2026-11-10",
      finRecurrence: "2027-04-30",
      ...champs,
    });

  it("mensuel : les derniers jeudis, semaine du mois enregistrée", () => {
    const resultat = resoudreDates(mensuel({}), { publication: true, aujourdHui });
    expect(resultat).toMatchObject({ rythme: "MENSUEL", semaineDuMois: -1 });
    expect("dates" in resultat && resultat.dates).toHaveLength(6);
  });

  it("mensuel sans semaine du mois : publication refusée, brouillon accepté", () => {
    expect(resoudreDates(mensuel({ semaineDuMois: "" }), { publication: true, aujourdHui })).toEqual({
      erreur: "Choisissez un jour, une semaine du mois, une date de début et une date de fin.",
    });
    const brouillon = resoudreDates(mensuel({ semaineDuMois: "" }), { publication: false, aujourdHui });
    expect(brouillon).toMatchObject({ rythme: "MENSUEL", semaineDuMois: null, dates: [] });
  });

  it("semaine du mois ignorée hors rythme mensuel", () => {
    const resultat = resoudreDates(mensuel({ rythme: "UNE_SEMAINE_SUR_DEUX" }), {
      publication: true,
      aujourdHui,
    });
    expect(resultat).toMatchObject({ rythme: "UNE_SEMAINE_SUR_DEUX", semaineDuMois: null });
    expect("dates" in resultat && resultat.dates.slice(0, 2)).toEqual(["2026-11-12", "2026-11-26"]);
  });

  it("semaine du mois invalide refusée par le schéma", () => {
    expect(schemaAnnonceBrouillon.safeParse({ semaineDuMois: "5" }).success).toBe(false);
  });
});

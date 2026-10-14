// Récurrence par règle (phases 59 à 63) : dates d'une jam récurrente déduites d'un rythme, d'un jour,
// d'une date de début et d'une date de fin. Fonctions pures, en UTC et date seule (AAAA-MM-JJ),
// partagées par l'aperçu du formulaire et par le serveur, qui ne fait jamais confiance aux dates
// envoyées par le client.

const MS_PAR_JOUR = 24 * 60 * 60 * 1000;

export const RYTHMES = [
  { valeur: "CHAQUE_SEMAINE", libelle: "Chaque semaine" },
  { valeur: "UNE_SEMAINE_SUR_DEUX", libelle: "Une semaine sur deux" },
  { valeur: "MENSUEL", libelle: "Une fois par mois" },
] as const;
export type Rythme = (typeof RYTHMES)[number]["valeur"];

// 1 = lundi … 7 = dimanche, comme `Annonce.jourSemaine`.
export const JOURS_SEMAINE = [
  { valeur: 1, libelle: "Lundi" },
  { valeur: 2, libelle: "Mardi" },
  { valeur: 3, libelle: "Mercredi" },
  { valeur: 4, libelle: "Jeudi" },
  { valeur: 5, libelle: "Vendredi" },
  { valeur: 6, libelle: "Samedi" },
  { valeur: 7, libelle: "Dimanche" },
] as const;

// Rythme mensuel (phase 61) : 1 à 4, -1 = dernier, comme `Annonce.semaineDuMois`.
export const SEMAINES_DU_MOIS = [
  { valeur: 1, libelle: "1er" },
  { valeur: 2, libelle: "2e" },
  { valeur: 3, libelle: "3e" },
  { valeur: 4, libelle: "4e" },
  { valeur: -1, libelle: "Dernier" },
] as const;

export type RegleRecurrence = {
  rythme: Rythme;
  jourSemaine: number;
  // Rythme mensuel seulement ; ignorée par les autres rythmes.
  semaineDuMois?: number | null;
  debut: string;
  fin: string;
};

export const ERREUR_DATE_UNIQUE = "Choisissez une date.";
export const ERREUR_REGLE_INCOMPLETE = "Choisissez un jour, une date de début et une date de fin.";
export const ERREUR_REGLE_MENSUELLE_INCOMPLETE =
  "Choisissez un jour, une semaine du mois, une date de début et une date de fin.";
export const ERREUR_FIN_AVANT_DEBUT = "La date de fin doit suivre la date de début.";
export const ERREUR_PLUS_DE_12_MOIS = "La récurrence ne peut pas dépasser 12 mois.";
export const ERREUR_AUCUNE_DATE = "Aucune date ne correspond à ce rythme entre ces deux dates.";

export function aujourdHuiIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function versDate(iso: string): Date {
  return new Date(`${iso}T00:00:00.000Z`);
}

function versIso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Dernière date de fin autorisée : même jour, 12 mois plus tard. */
export function finMaximale(debut: string): string {
  const d = versDate(debut);
  return versIso(new Date(Date.UTC(d.getUTCFullYear() + 1, d.getUTCMonth(), d.getUTCDate())));
}

/** Message d'erreur d'une règle complète, ou null si ses bornes sont valides. */
export function erreurBornes(regle: RegleRecurrence): string | null {
  if (regle.fin < regle.debut) return ERREUR_FIN_AVANT_DEBUT;
  if (regle.fin > finMaximale(regle.debut)) return ERREUR_PLUS_DE_12_MOIS;
  return null;
}

/** Jour `jourJs` (0 = dimanche) de la semaine `semaineDuMois` (1 à 4, -1 = dernier) d'un mois. */
function jourDuMois(annee: number, mois: number, jourJs: number, semaineDuMois: number): Date {
  if (semaineDuMois === -1) {
    const dernier = new Date(Date.UTC(annee, mois + 1, 0));
    const recul = (dernier.getUTCDay() - jourJs + 7) % 7;
    return new Date(Date.UTC(annee, mois + 1, -recul));
  }
  const premier = new Date(Date.UTC(annee, mois, 1));
  const avance = (jourJs - premier.getUTCDay() + 7) % 7;
  return new Date(Date.UTC(annee, mois, 1 + avance + (semaineDuMois - 1) * 7));
}

/**
 * Toutes les dates produites par la règle, sans filtre (dates passées et retirées comprises),
 * ou [] si les bornes sont invalides ou si la semaine du mois manque au rythme mensuel.
 * Hebdomadaire et une semaine sur deux : la première date est le premier jour choisi à partir du
 * début, puis tous les 7 ou 14 jours. Mensuel : le jour de la semaine du mois choisie, chaque mois,
 * entre le début et la fin.
 */
export function datesDeLaRegle(regle: RegleRecurrence): string[] {
  if (erreurBornes(regle) !== null) return [];
  const jourJs = regle.jourSemaine % 7;
  const debut = versDate(regle.debut);
  const fin = versDate(regle.fin);
  const dates: string[] = [];

  if (regle.rythme === "MENSUEL") {
    if (!regle.semaineDuMois) return [];
    let mois = new Date(Date.UTC(debut.getUTCFullYear(), debut.getUTCMonth(), 1));
    while (mois.getTime() <= fin.getTime()) {
      const date = jourDuMois(mois.getUTCFullYear(), mois.getUTCMonth(), jourJs, regle.semaineDuMois);
      if (date >= debut && date <= fin) dates.push(versIso(date));
      mois = new Date(Date.UTC(mois.getUTCFullYear(), mois.getUTCMonth() + 1, 1));
    }
    return dates;
  }

  const pas = (regle.rythme === "UNE_SEMAINE_SUR_DEUX" ? 14 : 7) * MS_PAR_JOUR;
  const courante = debut;
  while (courante.getUTCDay() !== jourJs) courante.setTime(courante.getTime() + MS_PAR_JOUR);
  while (courante.getTime() <= fin.getTime()) {
    dates.push(versIso(courante));
    courante.setTime(courante.getTime() + pas);
  }
  return dates;
}

/** Dates à publier : celles de la règle, à partir d'aujourd'hui, hors dates retirées. */
export function datesAPublier(
  regle: RegleRecurrence,
  datesRetirees: string[],
  aujourdHui: string = aujourdHuiIso()
): string[] {
  const retirees = new Set(datesRetirees);
  return datesDeLaRegle(regle).filter((date) => date >= aujourdHui && !retirees.has(date));
}

/** Dates retirées encore produites par la règle : une date que la règle ne produit plus est oubliée. */
export function retireesPertinentes(regle: RegleRecurrence, datesRetirees: string[]): string[] {
  const produites = new Set(datesDeLaRegle(regle));
  return [...new Set(datesRetirees)].filter((date) => produites.has(date)).sort();
}

import { StatutOccurrence } from "@prisma/client";
import { aujourdHuiUTC, statutAffiche } from "@/lib/annonces";

const MS_PAR_JOUR = 24 * 60 * 60 * 1000;

export function joursAvantDate(date: Date, aujourdHui: Date = aujourdHuiUTC()): number {
  return Math.round((date.getTime() - aujourdHui.getTime()) / MS_PAR_JOUR);
}

export function messageRelance(
  occurrence: { statut: StatutOccurrence; confirmationJ7: Date | null; date: Date },
  aujourdHui: Date = aujourdHuiUTC()
): string | null {
  if (statutAffiche(occurrence, aujourdHui) !== "EN_ATTENTE_CONFIRMATION") {
    return null;
  }

  const joursRestants = joursAvantDate(occurrence.date, aujourdHui);
  // Pas de relance sur une date passée : la jam a eu lieu (ou non), plus rien à confirmer.
  if (joursRestants < 0) {
    return null;
  }

  if (joursRestants >= 6) {
    return "En attente de confirmation";
  }
  if (joursRestants >= 4) {
    return "Confirmation à faire bientôt";
  }
  if (joursRestants >= 2) {
    return "Confirmation urgente";
  }
  return "Dernier rappel : confirmez aujourd'hui";
}

// Dates passées exclues, J0 compris : même règle que messageRelance.
export function compterRelancesActives(
  occurrences: { statut: StatutOccurrence; confirmationJ7: Date | null; date: Date }[],
  aujourdHui: Date = aujourdHuiUTC()
): number {
  return occurrences.filter((occurrence) => messageRelance(occurrence, aujourdHui) !== null)
    .length;
}

export const PASTILLES_MAX_CARTE = 6;

// Carte de Mes annonces (Phase 63) : dates à venir seulement (J0 compris), toutes les dates à confirmer
// d'abord, puis les suivantes, annulées comprises, jusqu'à PASTILLES_MAX_CARTE au total.
export function pastillesDeCarte<
  T extends { statut: StatutOccurrence; confirmationJ7: Date | null; date: Date },
>(
  occurrences: T[],
  aujourdHui: Date = aujourdHuiUTC()
): { affichees: T[]; autres: number; aVenir: number } {
  const aVenir = occurrences
    .filter((occurrence) => joursAvantDate(occurrence.date, aujourdHui) >= 0)
    .sort((a, b) => a.date.getTime() - b.date.getTime());
  const aConfirmer = aVenir.filter((occurrence) => messageRelance(occurrence, aujourdHui) !== null);
  const suivantes = aVenir.filter((occurrence) => messageRelance(occurrence, aujourdHui) === null);
  const affichees = [
    ...aConfirmer,
    ...suivantes.slice(0, Math.max(0, PASTILLES_MAX_CARTE - aConfirmer.length)),
  ];
  return { affichees, autres: aVenir.length - affichees.length, aVenir: aVenir.length };
}

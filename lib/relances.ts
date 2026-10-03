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

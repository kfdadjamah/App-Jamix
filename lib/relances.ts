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
  if (statutAffiche(occurrence) !== "EN_ATTENTE_CONFIRMATION") {
    return null;
  }

  const joursRestants = joursAvantDate(occurrence.date, aujourdHui);

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

export function compterRelancesActives(
  occurrences: { statut: StatutOccurrence; confirmationJ7: Date | null }[]
): number {
  return occurrences.filter((occurrence) => statutAffiche(occurrence) === "EN_ATTENTE_CONFIRMATION")
    .length;
}

import { StatutOccurrence } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const JOURS_LIMITE_CONFIRMATION_AUTO = 7;
const MS_PAR_JOUR = 24 * 60 * 60 * 1000;

export function aujourdHuiUTC(): Date {
  return new Date(new Date().toISOString().slice(0, 10));
}

export function calculerStatutInitial(
  date: Date,
  publieLe: Date = aujourdHuiUTC()
): { statut: StatutOccurrence; confirmationJ7: Date | null } {
  const ecartJours = Math.round((date.getTime() - publieLe.getTime()) / MS_PAR_JOUR);

  if (ecartJours > JOURS_LIMITE_CONFIRMATION_AUTO) {
    const confirmationJ7 = new Date(date.getTime() - JOURS_LIMITE_CONFIRMATION_AUTO * MS_PAR_JOUR);
    return { statut: "PROGRAMMEE", confirmationJ7 };
  }

  return { statut: "CONFIRMEE", confirmationJ7: null };
}

export function statutAffiche(occurrence: {
  statut: StatutOccurrence;
  confirmationJ7: Date | null;
}): StatutOccurrence {
  if (
    occurrence.statut === "PROGRAMMEE" &&
    occurrence.confirmationJ7 !== null &&
    occurrence.confirmationJ7.getTime() <= aujourdHuiUTC().getTime()
  ) {
    return "EN_ATTENTE_CONFIRMATION";
  }
  return occurrence.statut;
}

export async function recupererAnnoncesPubliees(dateIso: string) {
  const occurrences = await prisma.occurrenceJam.findMany({
    where: {
      date: new Date(dateIso),
      annonce: { statut: "PUBLIEE" },
    },
    include: {
      annonce: { include: { bar: true } },
    },
    orderBy: { heureDebut: "asc" },
  });

  return occurrences;
}

export async function recupererProchainesDatesDisponibles(
  dateIso: string,
  limite: number,
) {
  const occurrences = await prisma.occurrenceJam.findMany({
    where: {
      date: { gt: new Date(dateIso) },
      annonce: { statut: "PUBLIEE" },
    },
    distinct: ["date"],
    orderBy: { date: "asc" },
    take: limite,
    select: { date: true },
  });

  return occurrences.map((occurrence) => occurrence.date.toISOString().slice(0, 10));
}

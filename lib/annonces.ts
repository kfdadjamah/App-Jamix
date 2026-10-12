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

export function statutAffiche(
  occurrence: { statut: StatutOccurrence; confirmationJ7: Date | null },
  aujourdHui: Date = aujourdHuiUTC()
): StatutOccurrence {
  if (
    occurrence.statut === "PROGRAMMEE" &&
    occurrence.confirmationJ7 !== null &&
    occurrence.confirmationJ7.getTime() <= aujourdHui.getTime()
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
      annonce: { include: { bar: { include: { organisateur: { select: { prenom: true } } } } } },
    },
    orderBy: { heureDebut: "asc" },
  });

  return occurrences;
}

/** Jours (AAAA-MM-JJ) de [debutIso, finIso] ayant une occurrence d'annonce publiée, annulée comprise. */
export async function recupererJoursAvecJams(debutIso: string, finIso: string) {
  const occurrences = await prisma.occurrenceJam.findMany({
    where: {
      date: { gte: new Date(debutIso), lte: new Date(finIso) },
      annonce: { statut: "PUBLIEE" },
    },
    distinct: ["date"],
    select: { date: true },
  });

  return occurrences.map((occurrence) => occurrence.date.toISOString().slice(0, 10));
}

/**
 * Occurrence consultable par un musicien (page d'une jam) : annonce publiée, date à venir
 * (aujourd'hui compris), annulée comprise. `null` sinon : inexistante, brouillon ou passée.
 */
export async function recupererOccurrencePubliee(occurrenceId: string) {
  return prisma.occurrenceJam.findFirst({
    where: {
      id: occurrenceId,
      date: { gte: aujourdHuiUTC() },
      annonce: { statut: "PUBLIEE" },
    },
    include: {
      annonce: { include: { bar: { include: { organisateur: { select: { prenom: true } } } } } },
    },
  });
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

/** Valeurs reprises de la dernière annonce publiée d'un bar (phase 21), sans les dates. */
export type ValeursReprises = {
  styles: string[];
  styleAutre: string;
  instruments: string[];
  instrumentAutre: string;
  description: string;
  coOrganisateur: string;
  photoUrl1: string | null;
  photoUrl2: string | null;
  heureDebut: string;
  heureFin: string;
  publieeLe: string;
};

type AnnoncePourReprise = {
  barId: string;
  statut: "BROUILLON" | "PUBLIEE";
  publieeLe: Date | null;
  styles: string[];
  styleAutre: string | null;
  instruments: string[];
  instrumentAutre: string | null;
  description: string | null;
  coOrganisateur: string | null;
  photoUrl1: string | null;
  photoUrl2: string | null;
  occurrences: { date: Date; heureDebut: string; heureFin: string | null }[];
};

/**
 * Table `barId → valeurs reprises` : pour chaque bar, l'annonce publiée au `publieeLe` le plus
 * récent, quelles que soient ses dates (passées ou annulées comprises) ; brouillons ignorés.
 * Horaire : celui de la première occurrence (date la plus ancienne), comme la page de modification.
 */
export function valeursReprisesParBar(
  annonces: AnnoncePourReprise[]
): Record<string, ValeursReprises> {
  const dernieres = new Map<string, AnnoncePourReprise & { publieeLe: Date }>();
  for (const annonce of annonces) {
    if (annonce.statut !== "PUBLIEE" || !annonce.publieeLe) continue;
    const actuelle = dernieres.get(annonce.barId);
    if (!actuelle || annonce.publieeLe.getTime() > actuelle.publieeLe.getTime()) {
      dernieres.set(annonce.barId, { ...annonce, publieeLe: annonce.publieeLe });
    }
  }

  const table: Record<string, ValeursReprises> = {};
  for (const [barId, annonce] of dernieres) {
    const premiereOccurrence = [...annonce.occurrences].sort(
      (a, b) => a.date.getTime() - b.date.getTime()
    )[0];
    table[barId] = {
      styles: annonce.styles,
      styleAutre: annonce.styleAutre ?? "",
      instruments: annonce.instruments,
      instrumentAutre: annonce.instrumentAutre ?? "",
      description: annonce.description ?? "",
      coOrganisateur: annonce.coOrganisateur ?? "",
      photoUrl1: annonce.photoUrl1,
      photoUrl2: annonce.photoUrl2,
      heureDebut: premiereOccurrence?.heureDebut ?? "",
      heureFin: premiereOccurrence?.heureFin ?? "",
      publieeLe: annonce.publieeLe.toISOString(),
    };
  }
  return table;
}

/**
 * Mention « Organisé par Prénom » ou « Organisé par Prénom et Co-organisateur » (phase 57).
 * `null` si l'organisateur n'a pas de prénom (compte ancien) : pas de mention, co-organisateur compris.
 */
export function mentionOrganisePar(
  prenom: string | null | undefined,
  coOrganisateur: string | null | undefined
): string | null {
  const organisateur = prenom?.trim();
  if (!organisateur) return null;
  const co = coOrganisateur?.trim();
  return co ? `Organisé par ${organisateur} et ${co}` : `Organisé par ${organisateur}`;
}

import { prisma } from "@/lib/prisma";

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

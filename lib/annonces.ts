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

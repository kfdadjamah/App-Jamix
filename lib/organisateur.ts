import { sessionCourante } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function recupererIdOrganisateurConnecte() {
  const session = await sessionCourante();
  if (!session?.user?.id) {
    throw new Error("Non authentifié.");
  }
  return session.user.id;
}

/** Bars du compte connecté, du plus ancien au plus récent (le bar de l'inscription en tête). */
export async function recupererBarsDeLOrganisateurConnecte() {
  const organisateurId = await recupererIdOrganisateurConnecte();
  return prisma.bar.findMany({
    where: { organisateurId },
    orderBy: { createdAt: "asc" },
  });
}

/** Le bar demandé, seulement s'il appartient au compte connecté ; `null` sinon. */
export async function recupererBarDuCompte(barId: string) {
  const organisateurId = await recupererIdOrganisateurConnecte();
  return prisma.bar.findFirst({ where: { id: barId, organisateurId } });
}

/** L'annonce demandée, seulement si son bar appartient au compte connecté ; `null` sinon. */
export async function recupererAnnonceDuCompte(annonceId: string) {
  const organisateurId = await recupererIdOrganisateurConnecte();
  return prisma.annonce.findFirst({
    where: { id: annonceId, bar: { organisateurId } },
  });
}

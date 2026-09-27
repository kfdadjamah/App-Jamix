import { prisma } from "@/lib/prisma";
import { hacherJeton, jetonEstValide } from "@/lib/reinitialisation";

/** Jeton encore utilisable, ou `null` s'il est inconnu, utilisé, remplacé ou expiré. */
export async function trouverJetonValide(jetonBrut: string | undefined) {
  if (!jetonBrut) return null;
  const jeton = await prisma.jetonReinitialisation.findUnique({
    where: { hash: hacherJeton(jetonBrut) },
    select: { id: true, organisateurId: true, expireLe: true },
  });
  return jetonEstValide(jeton) ? jeton : null;
}

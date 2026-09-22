import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function recupererBarDeLOrganisateurConnecte() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Non authentifié.");
  }
  const bar = await prisma.bar.findUnique({
    where: { organisateurId: session.user.id },
  });
  if (!bar) {
    throw new Error("Aucun bar associé à ce compte.");
  }
  return bar;
}

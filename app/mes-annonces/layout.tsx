import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { prisma } from "@/lib/prisma";
import { recupererIdOrganisateurConnecte } from "@/lib/organisateur";

// Un compte sans prénom (antérieur à la Phase 42) doit le renseigner avant d'accéder à ses annonces.
export default async function LayoutMesAnnonces({ children }: { children: ReactNode }) {
  const organisateurId = await recupererIdOrganisateurConnecte();
  const organisateur = await prisma.organisateur.findUnique({
    where: { id: organisateurId },
    select: { prenom: true },
  });
  if (!organisateur?.prenom?.trim()) redirect("/mon-profil?prenom=requis");
  return children;
}

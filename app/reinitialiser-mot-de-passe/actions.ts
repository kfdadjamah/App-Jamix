"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { TOURS_HASHING } from "@/lib/auth-constantes";
import { trouverJetonValide } from "@/lib/jeton-reinitialisation";
import { schemaReinitialisationMotDePasse } from "@/lib/validation/inscription";

type ResultatReinitialisation = { erreur: string } | { lienInvalide: true };

export async function reinitialiserMotDePasse(
  formData: FormData
): Promise<ResultatReinitialisation> {
  const resultat = schemaReinitialisationMotDePasse.safeParse({
    nouveauMotDePasse: formData.get("nouveauMotDePasse"),
    confirmation: formData.get("confirmation"),
  });
  if (!resultat.success) {
    return { erreur: resultat.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  // Revérifié à l'envoi : le lien a pu expirer ou servir dans un autre onglet.
  const jetonBrut = formData.get("jeton");
  const jeton = await trouverJetonValide(typeof jetonBrut === "string" ? jetonBrut : undefined);
  if (!jeton) return { lienInvalide: true };

  const motDePasseHash = await bcrypt.hash(resultat.data.nouveauMotDePasse, TOURS_HASHING);

  // Usage unique : le jeton est consommé dans la transaction ; si une requête
  // concurrente l'a déjà supprimé, rien n'est modifié.
  const reinitialise = await prisma.$transaction(async (tx) => {
    const { count } = await tx.jetonReinitialisation.deleteMany({ where: { id: jeton.id } });
    if (count === 0) return false;
    await tx.organisateur.update({
      where: { id: jeton.organisateurId },
      data: { motDePasseHash },
    });
    await tx.jetonReinitialisation.deleteMany({
      where: { organisateurId: jeton.organisateurId },
    });
    return true;
  });
  if (!reinitialise) return { lienInvalide: true };

  redirect("/connexion?reinitialise=1");
}

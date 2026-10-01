"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { prisma } from "@/lib/prisma";
import { TOURS_HASHING } from "@/lib/auth-constantes";
import { emailAvisMotDePasse, envoyerEmail } from "@/lib/email";
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
  const emailOrganisateur = await prisma.$transaction(async (tx) => {
    const { count } = await tx.jetonReinitialisation.deleteMany({ where: { id: jeton.id } });
    if (count === 0) return null;
    const { email } = await tx.organisateur.update({
      where: { id: jeton.organisateurId },
      data: { motDePasseHash },
      select: { email: true },
    });
    await tx.jetonReinitialisation.deleteMany({
      where: { organisateurId: jeton.organisateurId },
    });
    return email;
  });
  if (!emailOrganisateur) return { lienInvalide: true };

  const date = new Date();
  after(() => envoyerEmail(emailAvisMotDePasse(emailOrganisateur, "reinitialise", date)));

  redirect("/connexion?reinitialise=1");
}

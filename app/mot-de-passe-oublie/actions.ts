"use server";

import { after } from "next/server";
import { prisma } from "@/lib/prisma";
import { schemaMotDePasseOublie } from "@/lib/validation/inscription";
import {
  demandeTropRapprochee,
  genererJeton,
  lienReinitialisation,
} from "@/lib/reinitialisation";
import {
  emailReinitialisationMotDePasse,
  envoyerEmail,
  urlApplication,
} from "@/lib/email";

async function traiterDemande(email: string) {
  const organisateur = await prisma.organisateur.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      jetonsReinitialisation: { select: { createdAt: true, expireLe: true } },
    },
  });
  if (!organisateur) return;
  if (demandeTropRapprochee(organisateur.jetonsReinitialisation)) return;

  // Une nouvelle demande invalide les liens précédents.
  const jeton = genererJeton();
  await prisma.$transaction([
    prisma.jetonReinitialisation.deleteMany({ where: { organisateurId: organisateur.id } }),
    prisma.jetonReinitialisation.create({
      data: { hash: jeton.hash, expireLe: jeton.expireLe, organisateurId: organisateur.id },
    }),
  ]);

  await envoyerEmail(
    emailReinitialisationMotDePasse(
      organisateur.email,
      lienReinitialisation(urlApplication(), jeton.brut)
    )
  );
}

/**
 * Réponse identique que l'email soit connu ou non : tout le traitement
 * (recherche, jeton, envoi) a lieu après la réponse, pour que ni le message ni
 * le temps de réponse ne révèlent l'existence d'un compte.
 */
export async function demanderReinitialisation(
  formData: FormData
): Promise<{ erreur: string } | { succes: true }> {
  const resultat = schemaMotDePasseOublie.safeParse({ email: formData.get("email") });
  if (!resultat.success) {
    return { erreur: resultat.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const { email } = resultat.data;
  after(() =>
    traiterDemande(email).catch((erreur) =>
      console.error("[mot-de-passe-oublie] Échec du traitement :", erreur)
    )
  );

  return { succes: true };
}

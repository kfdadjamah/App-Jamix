"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { del } from "@vercel/blob";
import { Prisma } from "@prisma/client";
import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { TOURS_HASHING } from "@/lib/auth-constantes";
import {
  schemaChangementEmail,
  schemaChangementMotDePasse,
  schemaSuppressionCompte,
} from "@/lib/validation/inscription";

type ResultatAction = { erreur: string } | { succes: true };

const ERREUR_MOT_DE_PASSE = "Mot de passe actuel incorrect.";
const ERREUR_EMAIL_UTILISE = "Un compte existe déjà avec cet email.";

async function recupererIdOrganisateurConnecte() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Non authentifié.");
  }
  return session.user.id;
}

async function verifierMotDePasseActuel(
  organisateurId: string,
  motDePasse: string
): Promise<boolean> {
  const organisateur = await prisma.organisateur.findUnique({
    where: { id: organisateurId },
    select: { motDePasseHash: true },
  });
  if (!organisateur) return false;
  return bcrypt.compare(motDePasse, organisateur.motDePasseHash);
}

export async function changerEmail(formData: FormData): Promise<ResultatAction> {
  const resultat = schemaChangementEmail.safeParse({
    nouvelEmail: formData.get("nouvelEmail"),
    motDePasseActuel: formData.get("motDePasseActuel"),
  });
  if (!resultat.success) {
    return { erreur: resultat.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const { nouvelEmail, motDePasseActuel } = resultat.data;
  const organisateurId = await recupererIdOrganisateurConnecte();

  if (!(await verifierMotDePasseActuel(organisateurId, motDePasseActuel))) {
    return { erreur: ERREUR_MOT_DE_PASSE };
  }

  const organisateurExistant = await prisma.organisateur.findUnique({
    where: { email: nouvelEmail },
    select: { id: true },
  });
  if (organisateurExistant && organisateurExistant.id !== organisateurId) {
    return { erreur: ERREUR_EMAIL_UTILISE };
  }

  try {
    await prisma.organisateur.update({
      where: { id: organisateurId },
      data: { email: nouvelEmail },
    });
  } catch (erreur) {
    // Course entre la vérification ci-dessus et l'écriture : contrainte d'unicité.
    if (erreur instanceof Prisma.PrismaClientKnownRequestError && erreur.code === "P2002") {
      return { erreur: ERREUR_EMAIL_UTILISE };
    }
    throw erreur;
  }

  revalidatePath("/mon-compte");
  return { succes: true };
}

export async function changerMotDePasse(formData: FormData): Promise<ResultatAction> {
  const resultat = schemaChangementMotDePasse.safeParse({
    motDePasseActuel: formData.get("motDePasseActuel"),
    nouveauMotDePasse: formData.get("nouveauMotDePasse"),
    confirmation: formData.get("confirmation"),
  });
  if (!resultat.success) {
    return { erreur: resultat.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const { motDePasseActuel, nouveauMotDePasse } = resultat.data;
  const organisateurId = await recupererIdOrganisateurConnecte();

  if (!(await verifierMotDePasseActuel(organisateurId, motDePasseActuel))) {
    return { erreur: ERREUR_MOT_DE_PASSE };
  }

  await prisma.organisateur.update({
    where: { id: organisateurId },
    data: { motDePasseHash: await bcrypt.hash(nouveauMotDePasse, TOURS_HASHING) },
  });

  return { succes: true };
}

export async function supprimerCompte(formData: FormData): Promise<ResultatAction> {
  const resultat = schemaSuppressionCompte.safeParse({
    motDePasseActuel: formData.get("motDePasseActuel"),
    confirmation: formData.get("confirmation"),
  });
  if (!resultat.success) {
    return { erreur: resultat.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const organisateurId = await recupererIdOrganisateurConnecte();

  if (!(await verifierMotDePasseActuel(organisateurId, resultat.data.motDePasseActuel))) {
    return { erreur: ERREUR_MOT_DE_PASSE };
  }

  const bar = await prisma.bar.findUnique({
    where: { organisateurId },
    select: {
      id: true,
      photoUrl: true,
      annonces: { select: { photoUrl1: true, photoUrl2: true } },
    },
  });

  const urlsPhotos = bar
    ? [
        bar.photoUrl,
        ...bar.annonces.flatMap((annonce) => [annonce.photoUrl1, annonce.photoUrl2]),
      ].filter((url): url is string => Boolean(url))
    : [];

  // Pas de cascade Bar→Annonce ni Organisateur→Bar dans le schéma : on supprime
  // dans l'ordre. Les occurrences partent en cascade avec leur annonce.
  await prisma.$transaction([
    ...(bar
      ? [
          prisma.annonce.deleteMany({ where: { barId: bar.id } }),
          prisma.bar.delete({ where: { id: bar.id } }),
        ]
      : []),
    prisma.organisateur.delete({ where: { id: organisateurId } }),
  ]);

  if (urlsPhotos.length > 0) {
    await del(urlsPhotos).catch(() => undefined);
  }

  revalidatePath("/");
  await signOut({ redirectTo: "/" });
  return { succes: true };
}

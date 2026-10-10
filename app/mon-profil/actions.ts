"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { del } from "@vercel/blob";
import { Prisma } from "@prisma/client";
import { auth, signIn, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { TOURS_HASHING } from "@/lib/auth-constantes";
import { emailAvisChangementEmail, emailAvisMotDePasse, envoyerEmail } from "@/lib/email";
import { recadrerEtUploaderPhoto } from "@/lib/image";
import { coordonneesApresModification, urlsPhotosDuCompte } from "@/lib/compte";
import { geocoderAdresse } from "@/lib/geocode";
import { recupererBarDuCompte } from "@/lib/organisateur";
import {
  ERREUR_BAR_EN_DOUBLE,
  ERREUR_DERNIER_BAR,
  ERREUR_LIMITE_BARS,
  ERREUR_NOM_BAR_DIFFERENT,
  NOMBRE_MAX_BARS,
  estBarEnDouble,
  nomBarCorrespond,
} from "@/lib/bars";
import {
  schemaAjoutBar,
  schemaChangementEmail,
  schemaChangementMotDePasse,
  schemaFicheBar,
  schemaNomCompletVideAutorise,
  schemaPhoto,
  schemaSuppressionCompte,
} from "@/lib/validation/inscription";

type ResultatAction = { erreur: string } | { succes: true };
// `adresseIntrouvable` : géocodage échoué, le bar n'apparaît pas sur la carte.
export type ResultatActionBar = { erreur: string } | { succes: true; adresseIntrouvable: boolean };

const ERREUR_MOT_DE_PASSE = "Mot de passe actuel incorrect.";
const ERREUR_EMAIL_UTILISE = "Un compte existe déjà avec cet email.";
const ERREUR_BAR_INTROUVABLE = "Bar introuvable.";

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

function estViolationUnicite(erreur: unknown) {
  return erreur instanceof Prisma.PrismaClientKnownRequestError && erreur.code === "P2002";
}

export async function ajouterBar(formData: FormData): Promise<ResultatActionBar> {
  const photoBrute = formData.get("photo");
  const resultat = schemaAjoutBar.safeParse({
    nomBar: formData.get("nomBar"),
    adresseBar: formData.get("adresseBar"),
    photo: photoBrute instanceof File && photoBrute.size > 0 ? photoBrute : null,
  });
  if (!resultat.success) {
    return { erreur: resultat.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const { nomBar, adresseBar, photo } = resultat.data;
  const organisateurId = await recupererIdOrganisateurConnecte();
  const bars = await prisma.bar.findMany({
    where: { organisateurId },
    select: { id: true, nom: true, adresse: true },
  });
  if (bars.length >= NOMBRE_MAX_BARS) {
    return { erreur: ERREUR_LIMITE_BARS };
  }
  if (estBarEnDouble(bars, { nom: nomBar, adresse: adresseBar })) {
    return { erreur: ERREUR_BAR_EN_DOUBLE };
  }

  // Photo refusée : aucun bar créé.
  let photoUrl: string | null;
  let coordonnees: Awaited<ReturnType<typeof geocoderAdresse>>;
  try {
    [photoUrl, coordonnees] = await Promise.all([
      photo ? recadrerEtUploaderPhoto(photo, "bars") : Promise.resolve(null),
      geocoderAdresse(adresseBar),
    ]);
  } catch {
    return { erreur: "La photo n'a pas pu être traitée." };
  }

  try {
    await prisma.bar.create({
      data: {
        organisateurId,
        nom: nomBar,
        adresse: adresseBar,
        latitude: coordonnees?.latitude ?? null,
        longitude: coordonnees?.longitude ?? null,
        photoUrl,
      },
    });
  } catch (erreur) {
    if (photoUrl) await del(photoUrl).catch(() => undefined);
    if (estViolationUnicite(erreur)) return { erreur: ERREUR_BAR_EN_DOUBLE };
    throw erreur;
  }

  revalidatePath("/mon-profil");
  revalidatePath("/");
  return { succes: true, adresseIntrouvable: !coordonnees };
}

export async function mettreAJourFicheBar(
  barId: string,
  formData: FormData
): Promise<ResultatActionBar> {
  const resultat = schemaFicheBar.safeParse({
    nomBar: formData.get("nomBar"),
    adresseBar: formData.get("adresseBar"),
  });
  if (!resultat.success) {
    return { erreur: resultat.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const { nomBar, adresseBar } = resultat.data;
  const bar = await recupererBarDuCompte(barId);
  if (!bar) return { erreur: ERREUR_BAR_INTROUVABLE };

  const bars = await prisma.bar.findMany({
    where: { organisateurId: bar.organisateurId },
    select: { id: true, nom: true, adresse: true },
  });
  if (estBarEnDouble(bars, { nom: nomBar, adresse: adresseBar }, bar.id)) {
    return { erreur: ERREUR_BAR_EN_DOUBLE };
  }

  // Adresse modifiée : re-géocodage ; en cas d'échec, le bar sort de la carte.
  const coordonnees = await coordonneesApresModification(bar.adresse, adresseBar);

  try {
    await prisma.bar.update({
      where: { id: bar.id },
      data: { nom: nomBar, adresse: adresseBar, ...coordonnees },
    });
  } catch (erreur) {
    if (estViolationUnicite(erreur)) return { erreur: ERREUR_BAR_EN_DOUBLE };
    throw erreur;
  }

  revalidatePath("/mon-profil");
  revalidatePath("/");
  return { succes: true, adresseIntrouvable: coordonnees.latitude === null };
}

export async function mettreAJourPhotoBar(
  barId: string,
  formData: FormData
): Promise<ResultatAction> {
  const fichier = formData.get("photo");
  const resultat = schemaPhoto.safeParse(fichier);
  if (!resultat.success) {
    return { erreur: resultat.error.issues[0]?.message ?? "Photo invalide." };
  }

  const bar = await recupererBarDuCompte(barId);
  if (!bar) return { erreur: ERREUR_BAR_INTROUVABLE };
  const nouvellePhotoUrl = await recadrerEtUploaderPhoto(resultat.data, "bars");

  if (bar.photoUrl) {
    await del(bar.photoUrl).catch(() => undefined);
  }

  await prisma.bar.update({
    where: { id: bar.id },
    data: { photoUrl: nouvellePhotoUrl },
  });

  revalidatePath("/mon-profil");
  return { succes: true };
}

export async function retirerPhotoBar(barId: string): Promise<ResultatAction> {
  const bar = await recupererBarDuCompte(barId);
  if (!bar) return { erreur: ERREUR_BAR_INTROUVABLE };

  if (bar.photoUrl) {
    await del(bar.photoUrl).catch(() => undefined);
  }

  await prisma.bar.update({
    where: { id: bar.id },
    data: { photoUrl: null },
  });

  revalidatePath("/mon-profil");
  return { succes: true };
}

export async function supprimerBar(barId: string, nomSaisi: string): Promise<ResultatAction> {
  const bar = await recupererBarDuCompte(barId);
  if (!bar) return { erreur: ERREUR_BAR_INTROUVABLE };
  // Revérifié côté serveur : le bouton inactif côté client ne suffit pas.
  if (!nomBarCorrespond(nomSaisi, bar.nom)) return { erreur: ERREUR_NOM_BAR_DIFFERENT };

  const nombreBars = await prisma.bar.count({ where: { organisateurId: bar.organisateurId } });
  if (nombreBars <= 1) return { erreur: ERREUR_DERNIER_BAR };

  const annonces = await prisma.annonce.findMany({
    where: { barId: bar.id },
    select: { photoUrl1: true, photoUrl2: true },
  });
  const urlsPhotos = urlsPhotosDuCompte([{ photoUrl: bar.photoUrl, annonces }]);

  // Pas de cascade Bar→Annonce dans le schéma : annonces d'abord (occurrences en cascade), puis le bar.
  await prisma.$transaction([
    prisma.annonce.deleteMany({ where: { barId: bar.id } }),
    prisma.bar.delete({ where: { id: bar.id } }),
  ]);

  if (urlsPhotos.length > 0) {
    await del(urlsPhotos).catch(() => undefined);
  }

  revalidatePath("/");
  revalidatePath("/mes-annonces");
  revalidatePath("/mon-profil");
  return { succes: true };
}

export async function deconnecterOrganisateur() {
  await signOut({ redirectTo: "/" });
}

export async function changerNomComplet(formData: FormData): Promise<ResultatAction> {
  const resultat = schemaNomCompletVideAutorise.safeParse({
    nomComplet: formData.get("nomComplet"),
  });
  if (!resultat.success) {
    return { erreur: resultat.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const { nomComplet } = resultat.data;
  const organisateurId = await recupererIdOrganisateurConnecte();
  const organisateur = await prisma.organisateur.findUnique({
    where: { id: organisateurId },
    select: { nom: true },
  });
  if (!organisateur) return { erreur: "Compte introuvable." };

  if (nomComplet === "") {
    // Un compte sans nom n'est jamais contraint d'en saisir un ; un nom existant ne se retire pas.
    if (organisateur.nom) return { erreur: "Le nom et prénom sont requis." };
    return { succes: true };
  }

  await prisma.organisateur.update({
    where: { id: organisateurId },
    data: { nom: nomComplet },
  });
  revalidatePath("/mon-profil");
  return { succes: true };
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

  const ancien = await prisma.organisateur.findUnique({
    where: { id: organisateurId },
    select: { email: true },
  });

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

  // Avis à l'ancienne adresse, seulement si l'email a réellement changé.
  if (ancien && ancien.email !== nouvelEmail) {
    const date = new Date();
    after(() => envoyerEmail(emailAvisChangementEmail(ancien.email, nouvelEmail, date)));
  }

  revalidatePath("/mon-profil");
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

  const { email } = await prisma.organisateur.update({
    where: { id: organisateurId },
    data: {
      motDePasseHash: await bcrypt.hash(nouveauMotDePasse, TOURS_HASHING),
      motDePasseModifieLe: new Date(),
    },
    select: { email: true },
  });

  // Les autres sessions sont désormais rejetées ; on en réémet une pour cet appareil.
  await signIn("credentials", { email, motDePasse: nouveauMotDePasse, redirect: false });

  const date = new Date();
  after(() => envoyerEmail(emailAvisMotDePasse(email, "modifie", date)));

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

  const bars = await prisma.bar.findMany({
    where: { organisateurId },
    select: {
      photoUrl: true,
      annonces: { select: { photoUrl1: true, photoUrl2: true } },
    },
  });

  const urlsPhotos = urlsPhotosDuCompte(bars);

  // Pas de cascade Bar→Annonce ni Organisateur→Bar dans le schéma : on supprime
  // dans l'ordre, pour tous les bars du compte. Les occurrences partent en cascade avec leur annonce.
  await prisma.$transaction([
    prisma.annonce.deleteMany({ where: { bar: { organisateurId } } }),
    prisma.bar.deleteMany({ where: { organisateurId } }),
    prisma.organisateur.delete({ where: { id: organisateurId } }),
  ]);

  if (urlsPhotos.length > 0) {
    await del(urlsPhotos).catch(() => undefined);
  }

  revalidatePath("/");
  await signOut({ redirectTo: "/" });
  return { succes: true };
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { del } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { recadrerEtUploaderPhoto } from "@/lib/image";
import { recupererBarDeLOrganisateurConnecte } from "@/lib/organisateur";
import {
  schemaAnnonceBrouillon,
  schemaAnnoncePublication,
  type ChampsAnnonceBrouillon,
} from "@/lib/validation/annonce";

type Resultat = { erreur: string } | { succes: true };

function extraireChampsFormulaire(formData: FormData) {
  return {
    date: formData.get("date") ?? "",
    heureDebut: formData.get("heureDebut") ?? "",
    heureFin: formData.get("heureFin") ?? "",
    styles: formData.getAll("styles"),
    styleAutre: formData.get("styleAutre") ?? "",
    instruments: formData.getAll("instruments"),
    instrumentAutre: formData.get("instrumentAutre") ?? "",
  };
}

async function verifierProprietaireAnnonce(annonceId: string) {
  const bar = await recupererBarDeLOrganisateurConnecte();
  const annonce = await prisma.annonce.findUnique({ where: { id: annonceId } });
  if (!annonce || annonce.barId !== bar.id) {
    throw new Error("Annonce introuvable.");
  }
  return annonce;
}

async function synchroniserOccurrence(
  annonceId: string,
  donnees: ChampsAnnonceBrouillon
) {
  if (!donnees.date || !donnees.heureDebut) return;

  const occurrenceExistante = await prisma.occurrenceJam.findFirst({
    where: { annonceId },
  });

  const donneesOccurrence = {
    date: new Date(donnees.date),
    heureDebut: donnees.heureDebut,
    heureFin: donnees.heureFin || null,
  };

  if (occurrenceExistante) {
    await prisma.occurrenceJam.update({
      where: { id: occurrenceExistante.id },
      data: donneesOccurrence,
    });
  } else {
    await prisma.occurrenceJam.create({
      data: { ...donneesOccurrence, annonceId },
    });
  }
}

export async function creerAnnonce(
  action: "brouillon" | "publier",
  formData: FormData
): Promise<Resultat | never> {
  const schema = action === "publier" ? schemaAnnoncePublication : schemaAnnonceBrouillon;
  const photo1Brut = formData.get("photo1");
  const photo2Brut = formData.get("photo2");
  const photo1 = photo1Brut instanceof File && photo1Brut.size > 0 ? photo1Brut : null;
  const photo2 = photo2Brut instanceof File && photo2Brut.size > 0 ? photo2Brut : null;

  const resultat = schema.safeParse({
    ...extraireChampsFormulaire(formData),
    photo1,
    photo2,
  });
  if (!resultat.success) {
    return { erreur: resultat.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const bar = await recupererBarDeLOrganisateurConnecte();
  const donnees = resultat.data;

  const [photoUrl1, photoUrl2] = await Promise.all([
    photo1 ? recadrerEtUploaderPhoto(photo1, "annonces") : Promise.resolve(null),
    photo2 ? recadrerEtUploaderPhoto(photo2, "annonces") : Promise.resolve(null),
  ]);

  const annonce = await prisma.annonce.create({
    data: {
      barId: bar.id,
      statut: action === "publier" ? "PUBLIEE" : "BROUILLON",
      styles: donnees.styles,
      styleAutre: donnees.styleAutre || null,
      instruments: donnees.instruments,
      instrumentAutre: donnees.instrumentAutre || null,
      photoUrl1,
      photoUrl2,
    },
  });

  await synchroniserOccurrence(annonce.id, donnees);

  redirect("/mes-annonces");
}

export async function modifierAnnonce(
  annonceId: string,
  action: "brouillon" | "publier" | "modifier",
  formData: FormData
): Promise<Resultat> {
  const annonceExistante = await verifierProprietaireAnnonce(annonceId);

  const schema = action === "publier" ? schemaAnnoncePublication : schemaAnnonceBrouillon;
  const resultat = schema.safeParse(extraireChampsFormulaire(formData));
  if (!resultat.success) {
    return { erreur: resultat.error.issues[0]?.message ?? "Formulaire invalide." };
  }
  const donnees = resultat.data;

  const nouveauStatut =
    action === "publier" ? "PUBLIEE" : action === "brouillon" ? "BROUILLON" : annonceExistante.statut;

  await prisma.annonce.update({
    where: { id: annonceId },
    data: {
      statut: nouveauStatut,
      styles: donnees.styles,
      styleAutre: donnees.styleAutre || null,
      instruments: donnees.instruments,
      instrumentAutre: donnees.instrumentAutre || null,
    },
  });

  await synchroniserOccurrence(annonceId, donnees);

  revalidatePath("/mes-annonces");
  revalidatePath(`/mes-annonces/${annonceId}`);
  return { succes: true };
}

export async function mettreAJourPhotoAnnonce(
  annonceId: string,
  emplacement: 1 | 2,
  formData: FormData
): Promise<Resultat> {
  const annonce = await verifierProprietaireAnnonce(annonceId);

  const fichier = formData.get("photo");
  if (!(fichier instanceof File) || fichier.size === 0) {
    return { erreur: "Photo invalide." };
  }

  const nouvellePhotoUrl = await recadrerEtUploaderPhoto(fichier, "annonces");
  const ancienneUrl = emplacement === 1 ? annonce.photoUrl1 : annonce.photoUrl2;
  if (ancienneUrl) {
    await del(ancienneUrl).catch(() => undefined);
  }

  await prisma.annonce.update({
    where: { id: annonceId },
    data: emplacement === 1 ? { photoUrl1: nouvellePhotoUrl } : { photoUrl2: nouvellePhotoUrl },
  });

  revalidatePath(`/mes-annonces/${annonceId}`);
  return { succes: true };
}

export async function retirerPhotoAnnonce(
  annonceId: string,
  emplacement: 1 | 2
): Promise<Resultat> {
  const annonce = await verifierProprietaireAnnonce(annonceId);

  const ancienneUrl = emplacement === 1 ? annonce.photoUrl1 : annonce.photoUrl2;
  if (ancienneUrl) {
    await del(ancienneUrl).catch(() => undefined);
  }

  await prisma.annonce.update({
    where: { id: annonceId },
    data: emplacement === 1 ? { photoUrl1: null } : { photoUrl2: null },
  });

  revalidatePath(`/mes-annonces/${annonceId}`);
  return { succes: true };
}

"use server";

import { revalidatePath } from "next/cache";
import { copy, del } from "@vercel/blob";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { calculerStatutInitial } from "@/lib/annonces";
import { recadrerEtUploaderPhoto } from "@/lib/image";
import {
  recupererAnnonceDuCompte,
  recupererBarDuCompte,
  recupererIdOrganisateurConnecte,
} from "@/lib/organisateur";
import { ERREUR_BAR_REQUIS, barApresModification } from "@/lib/bars";
import {
  schemaAnnonceBrouillon,
  schemaAnnoncePublication,
  type ChampsAnnonceBrouillon,
} from "@/lib/validation/annonce";

type Resultat = { erreur: string } | { succes: true };

const ERREUR_ENREGISTREMENT = "L'annonce n'a pas pu être enregistrée. Réessayez.";
const ERREUR_BAR_INTROUVABLE = "Bar introuvable.";
const ERREUR_DEJA_PUBLIEE = "Cette annonce est déjà publiée.";
const ERREUR_PHOTO_REPRISE_INTROUVABLE = "Photo reprise introuvable.";
const ERREUR_PHOTO_REPRISE_COPIE = "La photo reprise n'a pas pu être copiée.";

async function supprimerPhotos(urls: string[]) {
  await Promise.all(urls.map((url) => del(url).catch(() => undefined)));
}

function extraireChampsFormulaire(formData: FormData) {
  return {
    dates: formData.getAll("dates"),
    heureDebut: formData.get("heureDebut") ?? "",
    heureFin: formData.get("heureFin") ?? "",
    styles: formData.getAll("styles"),
    styleAutre: formData.get("styleAutre") ?? "",
    instruments: formData.getAll("instruments"),
    instrumentAutre: formData.get("instrumentAutre") ?? "",
  };
}

function lirePhotoReprise(formData: FormData, cle: string): string | null {
  const url = formData.get(cle);
  return typeof url === "string" && url ? url : null;
}

/** Une photo reprise doit être celle d'une annonce (tout statut) d'un des bars du compte. */
async function photoRepriseAppartientAuCompte(url: string): Promise<boolean> {
  const organisateurId = await recupererIdOrganisateurConnecte();
  const annonce = await prisma.annonce.findFirst({
    where: { bar: { organisateurId }, OR: [{ photoUrl1: url }, { photoUrl2: url }] },
    select: { id: true },
  });
  return annonce !== null;
}

/** Duplique une photo reprise : deux annonces ne partagent jamais un même fichier. */
async function copierPhotoReprise(url: string): Promise<string> {
  const resultat = await copy(url, `annonces/${crypto.randomUUID()}.webp`, {
    access: "public",
    contentType: "image/webp",
  });
  return resultat.url;
}

function lireBarId(formData: FormData): string | null {
  const barId = formData.get("barId");
  return typeof barId === "string" && barId ? barId : null;
}

async function verifierProprietaireAnnonce(annonceId: string) {
  const annonce = await recupererAnnonceDuCompte(annonceId);
  if (!annonce) {
    throw new Error("Annonce introuvable.");
  }
  return annonce;
}

async function synchroniserOccurrences(
  tx: Prisma.TransactionClient,
  annonceId: string,
  donnees: ChampsAnnonceBrouillon,
  annonceEtaitDejaPubliee: boolean,
  nouveauStatut: "BROUILLON" | "PUBLIEE",
  porteeOccurrenceId?: string
) {
  if (!donnees.heureDebut) return;
  const heureFin = donnees.heureFin || null;

  if (annonceEtaitDejaPubliee) {
    // Une fois Publiée, la liste des dates est gelée ; seul l'horaire, partagé par
    // toutes les occurrences (ou une seule, selon la portée choisie), reste synchronisé.
    await tx.occurrenceJam.updateMany({
      where: { annonceId, ...(porteeOccurrenceId ? { id: porteeOccurrenceId } : {}) },
      data: { heureDebut: donnees.heureDebut, heureFin },
    });
    return;
  }

  // Création ou Brouillon : aucune occurrence n'a d'état à préserver,
  // on resynchronise par remplacement complet à partir des dates soumises.
  await tx.occurrenceJam.deleteMany({ where: { annonceId } });
  if (donnees.dates.length === 0) return;

  const vientDEtrePubliee = nouveauStatut === "PUBLIEE" && !annonceEtaitDejaPubliee;

  await tx.occurrenceJam.createMany({
    data: donnees.dates.map((date) => {
      const statutInitial = vientDEtrePubliee
        ? calculerStatutInitial(new Date(date))
        : null;
      return {
        annonceId,
        date: new Date(date),
        heureDebut: donnees.heureDebut!,
        heureFin,
        ...(statutInitial ?? {}),
      };
    }),
  });
}

export async function creerAnnonce(
  action: "brouillon" | "publier",
  formData: FormData
): Promise<Resultat> {
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

  // Le bar est obligatoire dès le brouillon, et doit appartenir au compte.
  const barId = lireBarId(formData);
  if (!barId) {
    return { erreur: action === "publier" ? "Choisissez un bar pour publier l'annonce." : ERREUR_BAR_REQUIS };
  }
  const bar = await recupererBarDuCompte(barId);
  if (!bar) return { erreur: ERREUR_BAR_INTROUVABLE };
  const donnees = resultat.data;

  // Photos reprises (phase 21) : un fichier choisi pour l'emplacement l'emporte.
  const reprise1 = photo1 ? null : lirePhotoReprise(formData, "photoReprise1");
  const reprise2 = photo2 ? null : lirePhotoReprise(formData, "photoReprise2");
  for (const url of [reprise1, reprise2]) {
    if (url && !(await photoRepriseAppartientAuCompte(url))) {
      return { erreur: ERREUR_PHOTO_REPRISE_INTROUVABLE };
    }
  }

  // Si une photo échoue (upload ou copie), on retire celles déjà stockées :
  // aucun enregistrement partiel.
  const uploads = await Promise.allSettled([
    photo1
      ? recadrerEtUploaderPhoto(photo1, "annonces")
      : reprise1
        ? copierPhotoReprise(reprise1)
        : Promise.resolve(null),
    photo2
      ? recadrerEtUploaderPhoto(photo2, "annonces")
      : reprise2
        ? copierPhotoReprise(reprise2)
        : Promise.resolve(null),
  ]);
  const urlsUploadees = uploads.flatMap((u) =>
    u.status === "fulfilled" && u.value ? [u.value] : []
  );
  const echecs = uploads.flatMap((u, i) => (u.status === "rejected" ? [i] : []));
  if (echecs.length > 0) {
    await supprimerPhotos(urlsUploadees);
    const echecCopie = echecs.some((i) => [reprise1, reprise2][i]);
    return { erreur: echecCopie ? ERREUR_PHOTO_REPRISE_COPIE : "La photo n'a pas pu être traitée." };
  }
  const [photoUrl1, photoUrl2] = uploads.map((u) =>
    u.status === "fulfilled" ? u.value : null
  );

  const statut = action === "publier" ? "PUBLIEE" : "BROUILLON";
  try {
    await prisma.$transaction(async (tx) => {
      const annonce = await tx.annonce.create({
        data: {
          barId: bar.id,
          statut,
          publieeLe: statut === "PUBLIEE" ? new Date() : null,
          estRecurrente: donnees.dates.length > 1,
          styles: donnees.styles,
          styleAutre: donnees.styleAutre || null,
          instruments: donnees.instruments,
          instrumentAutre: donnees.instrumentAutre || null,
          photoUrl1,
          photoUrl2,
        },
      });
      await synchroniserOccurrences(tx, annonce.id, donnees, false, statut);
    });
  } catch (erreur) {
    console.error("Création d'annonce impossible :", erreur);
    await supprimerPhotos(urlsUploadees);
    return { erreur: ERREUR_ENREGISTREMENT };
  }

  revalidatePath("/mes-annonces");
  return { succes: true };
}

export async function modifierAnnonce(
  annonceId: string,
  action: "brouillon" | "publier" | "modifier",
  formData: FormData
): Promise<Resultat> {
  const annonceExistante = await verifierProprietaireAnnonce(annonceId);
  const annonceEtaitDejaPubliee = annonceExistante.statut === "PUBLIEE";

  // Une annonce publiée ne repasse jamais en brouillon ni ne se republie :
  // ce serait un moyen de changer son bar, figé une fois publiée.
  if (annonceEtaitDejaPubliee && action !== "modifier") {
    return { erreur: ERREUR_DEJA_PUBLIEE };
  }

  const bar = barApresModification({
    annonceEstPubliee: annonceEtaitDejaPubliee,
    barIdActuel: annonceExistante.barId,
    barIdSoumis: lireBarId(formData),
  });
  if ("erreur" in bar) return bar;
  if (bar.barId !== annonceExistante.barId && !(await recupererBarDuCompte(bar.barId))) {
    return { erreur: ERREUR_BAR_INTROUVABLE };
  }

  const schema = action === "publier" ? schemaAnnoncePublication : schemaAnnonceBrouillon;
  const resultat = schema.safeParse(extraireChampsFormulaire(formData));
  if (!resultat.success) {
    return { erreur: resultat.error.issues[0]?.message ?? "Formulaire invalide." };
  }
  const donnees = resultat.data;

  const nouveauStatut =
    action === "publier" ? "PUBLIEE" : action === "brouillon" ? "BROUILLON" : annonceExistante.statut;

  const porteeOccurrenceIdBrut = formData.get("porteeOccurrenceId");
  const porteeOccurrenceId =
    typeof porteeOccurrenceIdBrut === "string" && porteeOccurrenceIdBrut
      ? porteeOccurrenceIdBrut
      : undefined;

  try {
    await prisma.$transaction(async (tx) => {
      await tx.annonce.update({
        where: { id: annonceId },
        data: {
          barId: bar.barId,
          statut: nouveauStatut,
          // Écrite une seule fois, au passage Brouillon → Publiée.
          publieeLe:
            nouveauStatut === "PUBLIEE"
              ? (annonceExistante.publieeLe ?? new Date())
              : annonceExistante.publieeLe,
          estRecurrente: annonceEtaitDejaPubliee
            ? annonceExistante.estRecurrente
            : donnees.dates.length > 1,
          styles: donnees.styles,
          styleAutre: donnees.styleAutre || null,
          instruments: donnees.instruments,
          instrumentAutre: donnees.instrumentAutre || null,
        },
      });
      await synchroniserOccurrences(
        tx,
        annonceId,
        donnees,
        annonceEtaitDejaPubliee,
        nouveauStatut,
        porteeOccurrenceId
      );
    });
  } catch (erreur) {
    console.error("Modification d'annonce impossible :", erreur);
    return { erreur: ERREUR_ENREGISTREMENT };
  }

  revalidatePath("/mes-annonces");
  revalidatePath(`/mes-annonces/${annonceId}`);
  return { succes: true };
}

export async function confirmerOccurrence(occurrenceId: string): Promise<Resultat> {
  const occurrence = await prisma.occurrenceJam.findUnique({
    where: { id: occurrenceId },
  });
  if (!occurrence || !(await recupererAnnonceDuCompte(occurrence.annonceId))) {
    return { erreur: "Occurrence introuvable." };
  }

  await prisma.occurrenceJam.update({
    where: { id: occurrenceId },
    data: { statut: "CONFIRMEE", confirmationJ7: null },
  });

  revalidatePath(`/mes-annonces/${occurrence.annonceId}`);
  revalidatePath("/mes-annonces");
  return { succes: true };
}

export async function annulerOccurrence(occurrenceId: string): Promise<Resultat> {
  const occurrence = await prisma.occurrenceJam.findUnique({
    where: { id: occurrenceId },
  });
  if (!occurrence || !(await recupererAnnonceDuCompte(occurrence.annonceId))) {
    return { erreur: "Occurrence introuvable." };
  }

  await prisma.occurrenceJam.update({
    where: { id: occurrenceId },
    data: { statut: "ANNULEE", confirmationJ7: null },
  });

  revalidatePath(`/mes-annonces/${occurrence.annonceId}`);
  revalidatePath("/mes-annonces");
  return { succes: true };
}

export async function annulerAnnonce(annonceId: string): Promise<Resultat> {
  await verifierProprietaireAnnonce(annonceId);

  await prisma.occurrenceJam.updateMany({
    where: { annonceId },
    data: { statut: "ANNULEE", confirmationJ7: null },
  });

  revalidatePath(`/mes-annonces/${annonceId}`);
  revalidatePath("/mes-annonces");
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

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
import { aujourdHuiIso, ERREUR_REGLE_INCOMPLETE } from "@/lib/recurrence";
import {
  cleRegle,
  estUneAUne,
  planRecreation,
  saisieDeLAnnonce,
  type SaisieRegle,
} from "@/lib/modification-regle";
import {
  resoudreDates,
  schemaAnnonceBrouillon,
  schemaAnnoncePublication,
  type ChampsAnnonceBrouillon,
  type DatesResolues,
} from "@/lib/validation/annonce";

type Resultat = { erreur: string } | { succes: true; destination?: string };

const ERREUR_ENREGISTREMENT = "L'annonce n'a pas pu être enregistrée. Réessayez.";
const ERREUR_BAR_INTROUVABLE = "Bar introuvable.";
const ERREUR_DEJA_PUBLIEE = "Cette annonce est déjà publiée.";
const ERREUR_PHOTO_REPRISE_INTROUVABLE = "Photo reprise introuvable.";
const ERREUR_PHOTO_REPRISE_COPIE = "La photo reprise n'a pas pu être copiée.";
const ERREUR_HEURE_REQUISE = "L'heure de début est requise.";

async function supprimerPhotos(urls: string[]) {
  await Promise.all(urls.map((url) => del(url).catch(() => undefined)));
}

function extraireChampsFormulaire(formData: FormData) {
  return {
    typeJam: formData.get("typeJam") ?? undefined,
    dateUnique: formData.get("dateUnique") ?? "",
    rythme: formData.get("rythme") ?? "",
    jourSemaine: formData.get("jourSemaine") ?? "",
    semaineDuMois: formData.get("semaineDuMois") ?? "",
    debutRecurrence: formData.get("debutRecurrence") ?? "",
    finRecurrence: formData.get("finRecurrence") ?? "",
    datesRetirees: formData.getAll("datesRetirees"),
    dates: formData.getAll("dates"),
    heureDebut: formData.get("heureDebut") ?? "",
    heureFin: formData.get("heureFin") ?? "",
    styles: formData.getAll("styles"),
    styleAutre: formData.get("styleAutre") ?? "",
    instruments: formData.getAll("instruments"),
    instrumentAutre: formData.get("instrumentAutre") ?? "",
    titre: formData.get("titre") ?? "",
    description: formData.get("description") ?? "",
    coOrganisateur: formData.get("coOrganisateur") ?? "",
  };
}

/** Type et règle de récurrence à écrire sur l'annonce (phases 60 et 61). */
function champsRegle(resolues: DatesResolues) {
  const versDate = (iso: string | null) => (iso ? new Date(iso) : null);
  return {
    estRecurrente: resolues.estRecurrente,
    rythme: resolues.rythme,
    jourSemaine: resolues.jourSemaine,
    semaineDuMois: resolues.semaineDuMois,
    debutRecurrence: versDate(resolues.debutRecurrence),
    finRecurrence: versDate(resolues.finRecurrence),
    datesRetirees: resolues.datesRetirees.map((date) => new Date(date)),
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
  // Dates recalculées par le serveur (`resoudreDates`), ignorées une fois l'annonce publiée.
  dates: string[],
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
  // on resynchronise par remplacement complet à partir des dates recalculées.
  await tx.occurrenceJam.deleteMany({ where: { annonceId } });
  if (dates.length === 0) return;

  const vientDEtrePubliee = nouveauStatut === "PUBLIEE" && !annonceEtaitDejaPubliee;

  await tx.occurrenceJam.createMany({
    data: dates.map((date) => {
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

/** Règle à enregistrer (absente pour des dates choisies une à une) et dates à venir visées. */
type Recreation = { regle: DatesResolues | null; dates: string[] };

function saisieSoumise(donnees: ChampsAnnonceBrouillon): SaisieRegle {
  return {
    typeJam: donnees.typeJam,
    dateUnique: donnees.dateUnique ?? "",
    rythme: donnees.rythme || "CHAQUE_SEMAINE",
    jourSemaine: donnees.jourSemaine ?? "",
    semaineDuMois: donnees.semaineDuMois ?? "",
    debutRecurrence: donnees.debutRecurrence ?? "",
    finRecurrence: donnees.finRecurrence ?? "",
    datesRetirees: donnees.datesRetirees,
    datesUneAUne: donnees.dates,
  };
}

/**
 * Annonce publiée (phase 62) : null si la règle soumise ne change pas ses dates (rien n'est recréé),
 * sinon la nouvelle règle et ses dates à venir, contrôlées comme à la publication. La comparaison est
 * refaite ici, sans se fier au client.
 */
function preparerRecreation(
  annonce: Parameters<typeof saisieDeLAnnonce>[0],
  datesExistantes: string[],
  donnees: ChampsAnnonceBrouillon
): { erreur: string } | Recreation | null {
  const aujourdHui = aujourdHuiIso();
  const avant = saisieDeLAnnonce(annonce, datesExistantes, { publiee: true, aujourdHui });
  const apres = saisieSoumise(donnees);
  if (cleRegle(avant) === cleRegle(apres)) return null;
  if (!donnees.heureDebut) return { erreur: ERREUR_HEURE_REQUISE };

  // Ancienne annonce aux dates choisies une à une, sans rythme choisi : le « × » en retire, rien
  // n'en ajoute, et la règle reste absente.
  if (avant.datesUneAUne.length > 0 && estUneAUne(apres)) {
    const aVenir = new Set(avant.datesUneAUne);
    const dates = apres.datesUneAUne.filter((date) => aVenir.has(date)).sort();
    if (dates.length === 0) return { erreur: ERREUR_REGLE_INCOMPLETE };
    return { regle: null, dates };
  }

  const resolues = resoudreDates(donnees, { publication: true, aujourdHui });
  if ("erreur" in resolues) return resolues;
  return { regle: resolues, dates: resolues.dates };
}

/**
 * Passe les dates à venir (aujourd'hui compris) à celles de la nouvelle règle : une date commune garde
 * son occurrence et son statut, une date qui disparaît est supprimée, une nouvelle suit J-7 évaluée
 * maintenant. Les dates passées ne bougent pas. L'horaire du formulaire vaut pour toutes les dates :
 * la portée ciblée est ignorée quand la règle change.
 */
async function recreerDatesAVenir(
  tx: Prisma.TransactionClient,
  annonceId: string,
  donnees: ChampsAnnonceBrouillon,
  dates: string[]
) {
  const heureDebut = donnees.heureDebut!;
  const heureFin = donnees.heureFin || null;
  const existantes = await tx.occurrenceJam.findMany({ where: { annonceId }, select: { date: true } });
  const { aSupprimer, aCreer } = planRecreation(
    existantes.map(({ date }) => date.toISOString().slice(0, 10)),
    dates
  );

  if (aSupprimer.length > 0) {
    await tx.occurrenceJam.deleteMany({
      where: { annonceId, date: { in: aSupprimer.map((date) => new Date(date)) } },
    });
  }
  await tx.occurrenceJam.updateMany({ where: { annonceId }, data: { heureDebut, heureFin } });
  if (aCreer.length > 0) {
    await tx.occurrenceJam.createMany({
      data: aCreer.map((date) => ({
        annonceId,
        date: new Date(date),
        heureDebut,
        heureFin,
        ...calculerStatutInitial(new Date(date)),
      })),
    });
  }
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
  const resolues = resoudreDates(donnees, { publication: action === "publier" });
  if ("erreur" in resolues) return resolues;

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
          ...champsRegle(resolues),
          styles: donnees.styles,
          styleAutre: donnees.styleAutre || null,
          instruments: donnees.instruments,
          instrumentAutre: donnees.instrumentAutre || null,
          titre: donnees.titre || null,
          description: donnees.description || null,
          coOrganisateur: donnees.coOrganisateur || null,
          photoUrl1,
          photoUrl2,
        },
      });
      await synchroniserOccurrences(tx, annonce.id, donnees, resolues.dates, false, statut);
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

  const datesExistantes = (
    await prisma.occurrenceJam.findMany({
      where: { annonceId },
      select: { date: true },
      orderBy: { date: "asc" },
    })
  ).map(({ date }) => date.toISOString().slice(0, 10));

  let resolues: DatesResolues | null = null;
  let recreation: Recreation | null = null;
  if (!annonceEtaitDejaPubliee) {
    const resultatDates = resoudreDates(donnees, {
      publication: action === "publier",
      datesExistantes,
    });
    if ("erreur" in resultatDates) return resultatDates;
    resolues = resultatDates;
  } else {
    // Phase 62 : une annonce publiée dont la règle change voit ses dates à venir recalculées.
    const resultatRecreation = preparerRecreation(annonceExistante, datesExistantes, donnees);
    if (resultatRecreation && "erreur" in resultatRecreation) return resultatRecreation;
    recreation = resultatRecreation;
  }

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
          ...(resolues ? champsRegle(resolues) : {}),
          ...(recreation?.regle ? champsRegle(recreation.regle) : {}),
          styles: donnees.styles,
          styleAutre: donnees.styleAutre || null,
          instruments: donnees.instruments,
          instrumentAutre: donnees.instrumentAutre || null,
          // Champ de l'annonce : toutes ses dates, quelle que soit la portée choisie.
          titre: donnees.titre || null,
          description: donnees.description || null,
          coOrganisateur: donnees.coOrganisateur || null,
        },
      });
      if (recreation) {
        await recreerDatesAVenir(tx, annonceId, donnees, recreation.dates);
        return;
      }
      await synchroniserOccurrences(
        tx,
        annonceId,
        donnees,
        resolues?.dates ?? [],
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
  return { succes: true, destination: await destinationApresModification(annonceId, nouveauStatut) };
}

/** Fiche de la prochaine date non annulée d'une annonce publiée, sinon « Mes annonces ». */
async function destinationApresModification(
  annonceId: string,
  statut: "BROUILLON" | "PUBLIEE"
): Promise<string> {
  if (statut !== "PUBLIEE") return "/mes-annonces";
  const aujourdHui = new Date(new Date().toISOString().slice(0, 10));
  const prochaine = await prisma.occurrenceJam.findFirst({
    where: { annonceId, statut: { not: "ANNULEE" }, date: { gte: aujourdHui } },
    orderBy: { date: "asc" },
    select: { id: true },
  });
  return prochaine ? `/jams/${prochaine.id}` : "/mes-annonces";
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

export async function supprimerAnnonce(annonceId: string): Promise<Resultat> {
  const annonce = await verifierProprietaireAnnonce(annonceId);

  // Les occurrences partent avec l'annonce (onDelete: Cascade).
  await prisma.annonce.delete({ where: { id: annonceId } });
  await supprimerPhotos(
    [annonce.photoUrl1, annonce.photoUrl2].filter((url): url is string => url !== null)
  );

  revalidatePath("/mes-annonces");
  revalidatePath("/");
  return { succes: true };
}

export async function supprimerOccurrence(occurrenceId: string): Promise<Resultat> {
  const occurrence = await prisma.occurrenceJam.findUnique({ where: { id: occurrenceId } });
  if (!occurrence || !(await recupererAnnonceDuCompte(occurrence.annonceId))) {
    return { erreur: "Occurrence introuvable." };
  }

  // Supprimer la dernière date supprime l'annonce.
  const nombreDates = await prisma.occurrenceJam.count({
    where: { annonceId: occurrence.annonceId },
  });
  if (nombreDates <= 1) {
    return supprimerAnnonce(occurrence.annonceId);
  }

  // Une date supprimée seule rejoint les dates retirées : une recréation ne la fait pas revenir (phase 62).
  await prisma.$transaction([
    prisma.occurrenceJam.delete({ where: { id: occurrenceId } }),
    prisma.annonce.update({
      where: { id: occurrence.annonceId },
      data: { datesRetirees: { push: occurrence.date } },
    }),
  ]);

  revalidatePath(`/mes-annonces/${occurrence.annonceId}`);
  revalidatePath("/mes-annonces");
  revalidatePath("/");
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

import { z } from "zod";
import { schemaPhoto } from "@/lib/validation/inscription";
import { STYLES_MUSICAUX, INSTRUMENTS_BACKLINE, TOUS_LES_STYLES } from "@/lib/annonce-constantes";
import {
  ERREUR_AUCUNE_DATE,
  ERREUR_DATE_UNIQUE,
  ERREUR_REGLE_INCOMPLETE,
  ERREUR_REGLE_MENSUELLE_INCOMPLETE,
  RYTHMES,
  aujourdHuiIso,
  datesAPublier,
  erreurBornes,
  retireesPertinentes,
  type RegleRecurrence,
} from "@/lib/recurrence";

const regexHeure = /^([01]\d|2[0-3]):([0-5]\d)$/;
const regexDate = /^\d{4}-\d{2}-\d{2}$/;

const schemaPhotoAnnonce = z.union([schemaPhoto, z.literal(null)]).optional();

// Dates d'un ancien brouillon saisies une à une (avant la phase 60), ou dates retirées d'une règle.
const schemaDates = z
  .array(z.string().regex(regexDate, "Date invalide."))
  .refine((dates) => new Set(dates).size === dates.length, {
    message: "Une même date ne peut pas être ajoutée deux fois.",
  });

const schemaDateFacultative = z.string().regex(regexDate, "Date invalide.").optional().or(z.literal(""));

export const LONGUEUR_MAX_DESCRIPTION = 500;

// Le navigateur compte un retour à la ligne pour 1 caractère (maxLength) mais l'envoie en \r\n :
// on normalise avant de compter. Espaces de début et de fin retirés ; vide → absente.
const schemaDescription = z
  .string()
  .optional()
  .transform((texte) => (texte ?? "").replace(/\r\n?/g, "\n").trim())
  .pipe(
    z
      .string()
      .max(
        LONGUEUR_MAX_DESCRIPTION,
        `La description ne peut pas dépasser ${LONGUEUR_MAX_DESCRIPTION} caractères.`
      )
  );

export const LONGUEUR_MAX_TITRE = 60;

// Espaces de début et de fin retirés ; vide → absent.
const schemaTitre = z
  .string()
  .optional()
  .transform((texte) => (texte ?? "").trim())
  .pipe(
    z
      .string()
      .max(LONGUEUR_MAX_TITRE, `Le titre ne peut pas dépasser ${LONGUEUR_MAX_TITRE} caractères.`)
  );

export const LONGUEUR_MAX_CO_ORGANISATEUR = 40;

// Espaces de début et de fin retirés ; vide → absent.
const schemaCoOrganisateur = z
  .string()
  .optional()
  .transform((texte) => (texte ?? "").trim())
  .pipe(
    z
      .string()
      .max(
        LONGUEUR_MAX_CO_ORGANISATEUR,
        `Le co-organisateur ne peut pas dépasser ${LONGUEUR_MAX_CO_ORGANISATEUR} caractères.`
      )
  );

const champsCommuns = {
  // Jam récurrente (présélectionnée) ou exceptionnelle (phase 60).
  typeJam: z.enum(["recurrente", "exceptionnelle"]).default("recurrente"),
  dateUnique: schemaDateFacultative,
  rythme: z
    .enum(RYTHMES.map((rythme) => rythme.valeur) as [RegleRecurrence["rythme"]])
    .optional()
    .or(z.literal("")),
  jourSemaine: z.string().regex(/^[1-7]$/, "Jour invalide.").optional().or(z.literal("")),
  // Rythme mensuel (phase 61) : 1 à 4, -1 = dernier.
  semaineDuMois: z.string().regex(/^([1-4]|-1)$/, "Semaine du mois invalide.").optional().or(z.literal("")),
  debutRecurrence: schemaDateFacultative,
  finRecurrence: schemaDateFacultative,
  datesRetirees: schemaDates.default([]),
  dates: schemaDates.default([]),
  heureDebut: z.string().regex(regexHeure, "Heure invalide.").optional().or(z.literal("")),
  heureFin: z.string().regex(regexHeure, "Heure invalide.").optional().or(z.literal("")),
  styles: z.array(z.enum(STYLES_MUSICAUX)).default([]),
  styleAutre: z.string().trim().optional(),
  instruments: z.array(z.enum(INSTRUMENTS_BACKLINE)).default([]),
  instrumentAutre: z.string().trim().optional(),
  titre: schemaTitre,
  description: schemaDescription,
  coOrganisateur: schemaCoOrganisateur,
  photo1: schemaPhotoAnnonce,
  photo2: schemaPhotoAnnonce,
};

const ERREUR_TOUS_LES_STYLES = `"${TOUS_LES_STYLES}" ne peut pas être combiné avec un autre style.`;

function stylesExclusifs(champs: { styles: string[]; styleAutre?: string }) {
  if (!champs.styles.includes(TOUS_LES_STYLES)) return true;
  return champs.styles.length === 1 && !champs.styleAutre;
}

export const schemaAnnonceBrouillon = z
  .object(champsCommuns)
  .refine(stylesExclusifs, { message: ERREUR_TOUS_LES_STYLES });
export type ChampsAnnonceBrouillon = z.infer<typeof schemaAnnonceBrouillon>;

export const schemaAnnoncePublication = z.object({
  ...champsCommuns,
  heureDebut: z.string().regex(regexHeure, "L'heure de début est requise."),
  styles: z.array(z.enum(STYLES_MUSICAUX)).min(1, "Sélectionnez au moins un style musical."),
}).refine(stylesExclusifs, { message: ERREUR_TOUS_LES_STYLES });
export type ChampsAnnoncePublication = z.infer<typeof schemaAnnoncePublication>;

/** Type et règle à enregistrer sur l'annonce, avec les dates de ses occurrences. */
export type DatesResolues = {
  estRecurrente: boolean;
  rythme: RegleRecurrence["rythme"] | null;
  jourSemaine: number | null;
  semaineDuMois: number | null;
  debutRecurrence: string | null;
  finRecurrence: string | null;
  datesRetirees: string[];
  dates: string[];
};

/**
 * Dates d'une annonce en création ou en brouillon, recalculées côté serveur (phase 60) : jamais
 * celles du client. Exceptionnelle : la date unique (sans rythme). Récurrente : les dates de la règle, à partir
 * d'aujourd'hui, hors dates retirées. Sans règle complète, un ancien brouillon garde ses dates saisies
 * une à une, seulement parmi celles déjà enregistrées (`datesExistantes`) : le « × » en retire, rien
 * n'en ajoute. À la publication, une règle incomplète ou invalide, ou l'absence de date, est refusée ;
 * le brouillon accepte une règle incomplète.
 */
export function resoudreDates(
  champs: ChampsAnnonceBrouillon,
  { publication, datesExistantes = [], aujourdHui = aujourdHuiIso() }: {
    publication: boolean;
    datesExistantes?: string[];
    aujourdHui?: string;
  }
): { erreur: string } | DatesResolues {
  const sansRegle = {
    rythme: null,
    jourSemaine: null,
    semaineDuMois: null,
    debutRecurrence: null,
    finRecurrence: null,
    datesRetirees: [],
  };

  if (champs.typeJam === "exceptionnelle") {
    const date = champs.dateUnique || null;
    if (publication && (!date || date < aujourdHui)) return { erreur: ERREUR_DATE_UNIQUE };
    // La date unique est aussi gardée dans `debutRecurrence` : un brouillon sans horaire n'a pas
    // d'occurrence, et la retrouverait vide sinon.
    return { estRecurrente: false, ...sansRegle, debutRecurrence: date, dates: date ? [date] : [] };
  }

  const rythme = champs.rythme || "CHAQUE_SEMAINE";
  const jourSemaine = champs.jourSemaine ? Number(champs.jourSemaine) : null;
  // Gardée seulement pour le rythme mensuel.
  const semaineDuMois =
    rythme === "MENSUEL" && champs.semaineDuMois ? Number(champs.semaineDuMois) : null;
  const debut = champs.debutRecurrence || null;
  const fin = champs.finRecurrence || null;
  const regleEnregistree = {
    rythme,
    jourSemaine,
    semaineDuMois,
    debutRecurrence: debut,
    finRecurrence: fin,
  };

  if (jourSemaine === null || !debut || !fin || (rythme === "MENSUEL" && semaineDuMois === null)) {
    if (publication) {
      return {
        erreur: rythme === "MENSUEL" ? ERREUR_REGLE_MENSUELLE_INCOMPLETE : ERREUR_REGLE_INCOMPLETE,
      };
    }
    const existantes = new Set(datesExistantes);
    return {
      estRecurrente: true,
      ...regleEnregistree,
      datesRetirees: [],
      dates: champs.dates.filter((date) => existantes.has(date)).sort(),
    };
  }

  const regle: RegleRecurrence = { rythme, jourSemaine, semaineDuMois, debut, fin };
  const erreur = erreurBornes(regle);
  if (erreur) {
    if (publication) return { erreur };
    return { estRecurrente: true, ...regleEnregistree, datesRetirees: [], dates: [] };
  }
  const datesRetirees = retireesPertinentes(regle, champs.datesRetirees);
  const dates = datesAPublier(regle, datesRetirees, aujourdHui);
  if (publication && dates.length === 0) return { erreur: ERREUR_AUCUNE_DATE };
  return { estRecurrente: true, ...regleEnregistree, datesRetirees, dates };
}

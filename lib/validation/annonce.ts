import { z } from "zod";
import { schemaPhoto } from "@/lib/validation/inscription";
import { STYLES_MUSICAUX, INSTRUMENTS_BACKLINE, TOUS_LES_STYLES } from "@/lib/annonce-constantes";

const regexHeure = /^([01]\d|2[0-3]):([0-5]\d)$/;
const regexDate = /^\d{4}-\d{2}-\d{2}$/;

const schemaPhotoAnnonce = z.union([schemaPhoto, z.literal(null)]).optional();

export const NOMBRE_MAX_DATES = 12;

const schemaDates = z
  .array(z.string().regex(regexDate, "Date invalide."))
  .max(NOMBRE_MAX_DATES, `${NOMBRE_MAX_DATES} dates maximum par annonce.`)
  .refine((dates) => new Set(dates).size === dates.length, {
    message: "Une même date ne peut pas être ajoutée deux fois.",
  });

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

const champsCommuns = {
  dates: schemaDates.default([]),
  heureDebut: z.string().regex(regexHeure, "Heure invalide.").optional().or(z.literal("")),
  heureFin: z.string().regex(regexHeure, "Heure invalide.").optional().or(z.literal("")),
  styles: z.array(z.enum(STYLES_MUSICAUX)).default([]),
  styleAutre: z.string().trim().optional(),
  instruments: z.array(z.enum(INSTRUMENTS_BACKLINE)).default([]),
  instrumentAutre: z.string().trim().optional(),
  description: schemaDescription,
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
  dates: schemaDates.min(1, "Au moins une date est requise."),
  heureDebut: z.string().regex(regexHeure, "L'heure de début est requise."),
  styles: z.array(z.enum(STYLES_MUSICAUX)).min(1, "Sélectionnez au moins un style musical."),
}).refine(stylesExclusifs, { message: ERREUR_TOUS_LES_STYLES });
export type ChampsAnnoncePublication = z.infer<typeof schemaAnnoncePublication>;

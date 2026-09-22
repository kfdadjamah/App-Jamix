import { z } from "zod";
import { schemaPhoto } from "@/lib/validation/inscription";
import { STYLES_MUSICAUX, INSTRUMENTS_BACKLINE } from "@/lib/annonce-constantes";

const regexHeure = /^([01]\d|2[0-3]):([0-5]\d)$/;
const regexDate = /^\d{4}-\d{2}-\d{2}$/;

const schemaPhotoAnnonce = z.union([schemaPhoto, z.literal(null)]).optional();

const champsCommuns = {
  date: z.string().regex(regexDate, "Date invalide.").optional().or(z.literal("")),
  heureDebut: z.string().regex(regexHeure, "Heure invalide.").optional().or(z.literal("")),
  heureFin: z.string().regex(regexHeure, "Heure invalide.").optional().or(z.literal("")),
  styles: z.array(z.enum(STYLES_MUSICAUX)).default([]),
  styleAutre: z.string().trim().optional(),
  instruments: z.array(z.enum(INSTRUMENTS_BACKLINE)).default([]),
  instrumentAutre: z.string().trim().optional(),
  photo1: schemaPhotoAnnonce,
  photo2: schemaPhotoAnnonce,
};

export const schemaAnnonceBrouillon = z.object(champsCommuns);
export type ChampsAnnonceBrouillon = z.infer<typeof schemaAnnonceBrouillon>;

export const schemaAnnoncePublication = z.object({
  ...champsCommuns,
  date: z.string().regex(regexDate, "La date est requise."),
  heureDebut: z.string().regex(regexHeure, "L'heure de début est requise."),
  styles: z.array(z.enum(STYLES_MUSICAUX)).min(1, "Sélectionnez au moins un style musical."),
});
export type ChampsAnnoncePublication = z.infer<typeof schemaAnnoncePublication>;

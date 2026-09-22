import { z } from "zod";

const TAILLE_MAX_PHOTO_OCTETS = 5 * 1024 * 1024; // 5 Mo
const TYPES_IMAGE_ACCEPTES = ["image/jpeg", "image/png", "image/webp"];

export const schemaPhoto = z
  .instanceof(File)
  .refine((fichier) => fichier.size <= TAILLE_MAX_PHOTO_OCTETS, {
    message: "La photo doit faire moins de 5 Mo.",
  })
  .refine((fichier) => TYPES_IMAGE_ACCEPTES.includes(fichier.type), {
    message: "Format d'image non supporté (JPEG, PNG ou WebP uniquement).",
  });

export const schemaInscription = z.object({
  email: z.string().email("Adresse email invalide."),
  motDePasse: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères."),
  nomBar: z.string().trim().min(1, "Le nom du bar est requis."),
  adresseBar: z.string().trim().min(1, "L'adresse du bar est requise."),
  photo: z
    .union([schemaPhoto, z.literal(null)])
    .optional(),
});

export type ChampsInscription = z.infer<typeof schemaInscription>;

// Les champs texte, validés côté client par React Hook Form ; la photo
// (un input file non contrôlé) est validée séparément côté serveur.
export const schemaInscriptionClient = schemaInscription.omit({ photo: true });
export type ChampsInscriptionClient = z.infer<typeof schemaInscriptionClient>;

export const schemaConnexion = z.object({
  email: z.string().email("Adresse email invalide."),
  motDePasse: z.string().min(1, "Le mot de passe est requis."),
});

export type ChampsConnexion = z.infer<typeof schemaConnexion>;

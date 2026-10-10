import { z } from "zod";
import { nettoyerEspaces } from "@/lib/bars";

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

// Emails normalisés (espaces retirés, minuscules) partout où ils sont saisis,
// pour que la casse ne bloque ni la connexion ni la réinitialisation.
const champEmail = z.string().trim().toLowerCase().email("Adresse email invalide.");
const champMotDePasse = z
  .string()
  .min(8, "Le mot de passe doit contenir au moins 8 caractères.");
const champMotDePasseActuel = z.string().min(1, "Le mot de passe actuel est requis.");
// Nom et adresse stockés tels que saisis, débarrassés des espaces superflus.
const champNomBar = z.string().trim().min(1, "Le nom du bar est requis.").transform(nettoyerEspaces);
const champAdresseBar = z
  .string()
  .trim()
  .min(1, "L'adresse du bar est requise.")
  .transform(nettoyerEspaces);

// Nom et prénom : un seul champ, espaces de début et de fin ignorés.
const NOM_COMPLET_MAX = 80;
const champNomComplet = z
  .string()
  .trim()
  .min(1, "Le nom et prénom sont requis.")
  .max(NOM_COMPLET_MAX, `Le nom et prénom ne doivent pas dépasser ${NOM_COMPLET_MAX} caractères.`);

export const schemaNomComplet = z.object({ nomComplet: champNomComplet });
export type ChampsNomComplet = z.infer<typeof schemaNomComplet>;

// Au profil, le vide n'est accepté que pour un compte sans nom (décidé par l'appelant).
export const schemaNomCompletVideAutorise = z.object({
  nomComplet: z
    .string()
    .trim()
    .max(NOM_COMPLET_MAX, `Le nom et prénom ne doivent pas dépasser ${NOM_COMPLET_MAX} caractères.`),
});

export const schemaInscription = z.object({
  nomComplet: champNomComplet,
  email: champEmail,
  motDePasse: champMotDePasse,
  nomBar: champNomBar,
  adresseBar: champAdresseBar,
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
  email: champEmail,
  motDePasse: z.string().min(1, "Le mot de passe est requis."),
});

export type ChampsConnexion = z.infer<typeof schemaConnexion>;

export const schemaFicheBar = z.object({
  nomBar: champNomBar,
  adresseBar: champAdresseBar,
});

export type ChampsFicheBar = z.infer<typeof schemaFicheBar>;

export const schemaAjoutBar = schemaFicheBar.extend({
  photo: z.union([schemaPhoto, z.literal(null)]).optional(),
});

export const schemaChangementEmail = z.object({
  nouvelEmail: champEmail,
  motDePasseActuel: champMotDePasseActuel,
});

export type ChampsChangementEmail = z.infer<typeof schemaChangementEmail>;

export const schemaChangementMotDePasse = z
  .object({
    motDePasseActuel: champMotDePasseActuel,
    nouveauMotDePasse: champMotDePasse,
    confirmation: z.string(),
  })
  .refine((champs) => champs.confirmation === champs.nouveauMotDePasse, {
    message: "La confirmation ne correspond pas au nouveau mot de passe.",
    path: ["confirmation"],
  });

export type ChampsChangementMotDePasse = z.infer<typeof schemaChangementMotDePasse>;

export const schemaMotDePasseOublie = z.object({
  email: champEmail,
});

export type ChampsMotDePasseOublie = z.infer<typeof schemaMotDePasseOublie>;

export const schemaReinitialisationMotDePasse = z
  .object({
    nouveauMotDePasse: champMotDePasse,
    confirmation: z.string(),
  })
  .refine((champs) => champs.confirmation === champs.nouveauMotDePasse, {
    message: "La confirmation ne correspond pas au nouveau mot de passe.",
    path: ["confirmation"],
  });

export type ChampsReinitialisationMotDePasse = z.infer<
  typeof schemaReinitialisationMotDePasse
>;

export const MOT_CONFIRMATION_SUPPRESSION = "SUPPRIMER";

export const schemaSuppressionCompte = z.object({
  motDePasseActuel: champMotDePasseActuel,
  confirmation: z.literal(MOT_CONFIRMATION_SUPPRESSION, {
    message: `Saisissez ${MOT_CONFIRMATION_SUPPRESSION} pour confirmer.`,
  }),
});

export type ChampsSuppressionCompte = z.infer<typeof schemaSuppressionCompte>;

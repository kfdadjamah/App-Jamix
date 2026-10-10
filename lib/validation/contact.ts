import { z } from "zod";

// Champ invisible : un humain le laisse vide, un robot le remplit.
export const CHAMP_PIEGE_CONTACT = "siteWeb";

export const LONGUEUR_MAX_NOM_CONTACT = 100;
export const LONGUEUR_MIN_MESSAGE_CONTACT = 10;
export const LONGUEUR_MAX_MESSAGE_CONTACT = 2000;

/** Retours à la ligne `\r\n` (envoyés par le navigateur) ramenés à `\n`, espaces de bord retirés. */
export function normaliserMessage(texte: string): string {
  return texte.replace(/\r\n?/g, "\n").trim();
}

export const schemaContact = z.object({
  nom: z
    .string()
    .trim()
    .min(1, "Le nom est requis.")
    .max(LONGUEUR_MAX_NOM_CONTACT, `Le nom ne peut pas dépasser ${LONGUEUR_MAX_NOM_CONTACT} caractères.`),
  email: z.string().trim().email("Adresse email invalide."),
  // Normalisé avant de compter, comme la description d'annonce (phase 29).
  message: z
    .string()
    .transform(normaliserMessage)
    .pipe(
      z
        .string()
        .min(
          LONGUEUR_MIN_MESSAGE_CONTACT,
          `Le message doit contenir au moins ${LONGUEUR_MIN_MESSAGE_CONTACT} caractères.`
        )
        .max(
          LONGUEUR_MAX_MESSAGE_CONTACT,
          `Le message ne peut pas dépasser ${LONGUEUR_MAX_MESSAGE_CONTACT} caractères.`
        )
    ),
});

export type ChampsContact = z.input<typeof schemaContact>;

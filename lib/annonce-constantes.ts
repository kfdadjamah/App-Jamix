export const TOUS_LES_STYLES = "Tous les styles";

// « Tous les styles » est exclusive : jamais avec un autre style ni une précision « Autre ».
export const STYLES_MUSICAUX = [
  TOUS_LES_STYLES,
  "Jazz",
  "Blues",
  "Rock",
  "Pop",
  "Funk",
  "Soul",
  "R&B",
  "Latin",
  "Reggae",
  "Bossa nova",
  "Impro",
  "Autre",
] as const;

/** Ligne des styles affichée sur une annonce : « Tous styles » remplace la liste. */
export function libelleStyles(styles: string[]): string {
  return styles.includes(TOUS_LES_STYLES) ? "Tous styles" : styles.join(", ");
}

export const INSTRUMENTS_BACKLINE = [
  "Batterie complète",
  "Ampli guitare",
  "Ampli basse",
  "Clavier/piano",
  "Micros + sono",
  "Cajón",
  "Autre",
] as const;

export const LIBELLES_STATUT_OCCURRENCE: Record<string, string> = {
  CONFIRMEE: "Confirmée",
  PROGRAMMEE: "Programmée",
  EN_ATTENTE_CONFIRMATION: "En attente de confirmation",
  ANNULEE: "Annulée",
};

// Palette Harbor, liste et carte (DESIGN.md).
export const COULEURS_STATUT_OCCURRENCE: Record<string, string> = {
  CONFIRMEE: "#17807E",
  PROGRAMMEE: "#2B78BE",
  EN_ATTENTE_CONFIRMATION: "#B7791F",
  ANNULEE: "#6B7C8C",
};

export const PRIORITE_STATUT_OCCURRENCE: Record<string, number> = {
  CONFIRMEE: 0,
  PROGRAMMEE: 1,
  EN_ATTENTE_CONFIRMATION: 2,
  ANNULEE: 3,
};

export function formaterDateCourte(date: Date): string {
  return date.toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

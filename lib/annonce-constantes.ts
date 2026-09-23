export const STYLES_MUSICAUX = [
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

export function formaterDateCourte(date: Date): string {
  return date.toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

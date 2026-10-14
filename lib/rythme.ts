const MS_PAR_JOUR = 24 * 60 * 60 * 1000;

const JOURS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
const RANGS = ["1er", "2e", "3e", "4e"];

function rangDansLeMois(date: Date): number {
  return Math.ceil(date.getUTCDate() / 7);
}

function estDernierDuMois(date: Date): boolean {
  const joursDansLeMois = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0),
  ).getUTCDate();
  return date.getUTCDate() + 7 > joursDansLeMois;
}

/**
 * Mention de rythme d'une annonce, déduite de toutes ses dates, passées et annulées comprises
 * (phase 59) : « Le 1er vendredi du mois », « Le dernier jeudi du mois », « Un mardi sur deux »,
 * « Tous les mardis », « Exceptionnelle » (une seule date) ou « Récurrente » (dates irrégulières).
 * Les trous sont tolérés : des mardis espacés de 7 et 21 jours restent « Tous les mardis ».
 * Le mensuel passe en premier, sinon des 1ers mardis (28 ou 35 jours d'écart) seraient hebdomadaires.
 * Renvoie null sans date.
 */
export function mentionRythme(dates: Date[]): string | null {
  const triees = [...new Set(dates.map((date) => date.getTime()))]
    .sort((a, b) => a - b)
    .map((temps) => new Date(temps));
  if (triees.length === 0) return null;
  if (triees.length === 1) return "Exceptionnelle";

  const jour = triees[0].getUTCDay();
  if (triees.some((date) => date.getUTCDay() !== jour)) return "Récurrente";

  const rang = rangDansLeMois(triees[0]);
  if (rang <= 4 && triees.every((date) => rangDansLeMois(date) === rang)) {
    return `Le ${RANGS[rang - 1]} ${JOURS[jour]} du mois`;
  }
  if (triees.every(estDernierDuMois)) return `Le dernier ${JOURS[jour]} du mois`;

  const ecarts = triees
    .slice(1)
    .map((date, i) => Math.round((date.getTime() - triees[i].getTime()) / MS_PAR_JOUR));
  if (ecarts.every((ecart) => ecart % 14 === 0)) return `Un ${JOURS[jour]} sur deux`;
  return `Tous les ${JOURS[jour]}s`;
}

/**
 * Mention d'une annonce : depuis sa règle quand elle en a une (phase 60), sinon déduite de ses dates
 * (annonces antérieures, jams exceptionnelles). Renvoie null sans date.
 */
export function mentionAnnonce(annonce: {
  rythme?: string | null;
  jourSemaine?: number | null;
  occurrences: { date: Date }[];
}): string | null {
  if (annonce.occurrences.length === 0) return null;
  if (annonce.rythme === "CHAQUE_SEMAINE" && annonce.jourSemaine) {
    return `Tous les ${JOURS[annonce.jourSemaine % 7]}s`;
  }
  return mentionRythme(annonce.occurrences.map((occurrence) => occurrence.date));
}

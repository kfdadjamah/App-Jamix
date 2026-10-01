// Plusieurs bars par compte (phase 18) : logique pure, testable hors base.

export const NOMBRE_MAX_BARS = 10;

export const ERREUR_BAR_EN_DOUBLE = "Ce bar existe déjà dans votre compte.";
export const ERREUR_LIMITE_BARS = `Limite de ${NOMBRE_MAX_BARS} bars atteinte.`;
export const AVERTISSEMENT_ADRESSE_INTROUVABLE =
  "Adresse introuvable : ce bar n'apparaîtra pas sur la carte. Vérifiez l'adresse.";

/** Texte stocké tel que saisi, débarrassé des espaces en début/fin et des espaces multiples. */
export function nettoyerEspaces(texte: string): string {
  return texte.trim().replace(/\s+/g, " ");
}

function cleComparaison(bar: { nom: string; adresse: string }): string {
  return `${nettoyerEspaces(bar.nom).toLowerCase()}\n${nettoyerEspaces(bar.adresse).toLowerCase()}`;
}

/**
 * Un bar de même nom et même adresse qu'un autre bar du compte est un doublon
 * (casse et espaces en trop ignorés). `idExclu` : le bar en cours de modification.
 */
export function estBarEnDouble(
  barsDuCompte: { id: string; nom: string; adresse: string }[],
  candidat: { nom: string; adresse: string },
  idExclu?: string
): boolean {
  const cle = cleComparaison(candidat);
  return barsDuCompte.some((bar) => bar.id !== idExclu && cleComparaison(bar) === cle);
}

export const ERREUR_BAR_REQUIS = "Choisissez un bar pour enregistrer le brouillon.";
export const ERREUR_BAR_FIGE = "Le bar d'une annonce publiée ne peut pas être changé.";

/**
 * Bar à écrire lors de la modification d'une annonce : modifiable en Brouillon
 * (obligatoire), figé une fois Publiée. La propriété du bar est vérifiée par l'appelant.
 */
export function barApresModification({
  annonceEstPubliee,
  barIdActuel,
  barIdSoumis,
}: {
  annonceEstPubliee: boolean;
  barIdActuel: string;
  barIdSoumis: string | null;
}): { barId: string } | { erreur: string } {
  if (annonceEstPubliee) {
    if (barIdSoumis && barIdSoumis !== barIdActuel) return { erreur: ERREUR_BAR_FIGE };
    return { barId: barIdActuel };
  }
  if (!barIdSoumis) return { erreur: ERREUR_BAR_REQUIS };
  return { barId: barIdSoumis };
}

// Suppression d'un bar (phase 20).

export const ERREUR_DERNIER_BAR = "Un compte doit garder au moins un bar.";
export const ERREUR_NOM_BAR_DIFFERENT = "Le nom saisi ne correspond pas au nom du bar.";
export const MENTION_DERNIER_BAR =
  "Un compte doit garder au moins un bar ; pour tout supprimer, supprimez votre compte";

/** Le nom saisi pour confirmer correspond au nom du bar (casse et espaces en trop ignorés). */
export function nomBarCorrespond(nomSaisi: string, nomBar: string): boolean {
  return nettoyerEspaces(nomSaisi).toLowerCase() === nettoyerEspaces(nomBar).toLowerCase();
}

/**
 * Message de la fenêtre de suppression. `nombreAnnonces` : toutes les annonces du bar,
 * brouillons compris ; `datesAVenirPubliees` : occurrences à venir des annonces publiées,
 * annulées comprises. Sans date à venir, rien n'est visible côté musicien.
 */
export function messageSuppressionBar(
  nombreAnnonces: number,
  datesAVenirPubliees: number
): string {
  if (nombreAnnonces === 0) return "Ce bar sera supprimé définitivement.";

  const annonces = nombreAnnonces === 1 ? "son annonce" : `ses ${nombreAnnonces} annonces`;
  if (datesAVenirPubliees === 0) {
    return `Ce bar et ${annonces} seront supprimés définitivement.`;
  }
  const dates =
    datesAVenirPubliees === 1
      ? "dont 1 date à venir publiée"
      : `dont ${datesAVenirPubliees} dates à venir publiées`;
  return `Ce bar et ${annonces} (${dates}) seront supprimés définitivement. Les musiciens ne les verront plus.`;
}

export const LONGUEUR_APERCU_DESCRIPTION = 30;

/**
 * Début de description affiché sur les cartes (phase 64) : 30 caractères au plus, terminés par « … »
 * si le texte est plus long. On ne coupe pas un mot ; si le premier mot dépasse 30 caractères, il est
 * coupé à 30. Les retours à la ligne comptent comme des espaces. `null` si la description est vide.
 */
export function apercuDescription(description: string | null | undefined, max = LONGUEUR_APERCU_DESCRIPTION) {
  const texte = (description ?? "").replace(/\s+/g, " ").trim();
  if (!texte) return null;
  if (texte.length <= max) return texte;
  let coupe = texte.slice(0, max);
  // Coupure déjà entre deux mots : on garde les `max` caractères ; sinon on recule jusqu'au dernier espace.
  if (texte[max] !== " ") {
    const dernierEspace = coupe.lastIndexOf(" ");
    if (dernierEspace > 0) coupe = coupe.slice(0, dernierEspace);
  }
  return `${coupe.trimEnd()}…`;
}

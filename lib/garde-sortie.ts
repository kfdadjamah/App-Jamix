// Garde de sortie des formulaires d'annonce (phase 16) : logique pure, testable hors navigateur.

// Le choix de portée n'est jamais une modification en cours.
const CHAMPS_EXCLUS = new Set(["porteeOccurrenceId"]);

/**
 * Sérialise l'état d'un formulaire en chaîne stable, pour le comparer à un état de référence.
 * Un fichier est représenté par nom, taille et date de modification ; un input file vide par "".
 * `champsExclus` : champs ignorés en plus de la portée (le bar, sur une nouvelle annonce).
 */
export function instantane(formData: FormData, champsExclus: string[] = []): string {
  const entrees: [string, string][] = [];
  for (const [cle, valeur] of formData.entries()) {
    if (CHAMPS_EXCLUS.has(cle) || champsExclus.includes(cle)) continue;
    if (typeof valeur === "string") {
      entrees.push([cle, valeur]);
    } else {
      const vide = valeur.size === 0 && !valeur.name;
      entrees.push([cle, vide ? "" : `${valeur.name}:${valeur.size}:${valeur.lastModified}`]);
    }
  }
  entrees.sort(([cleA, valA], [cleB, valB]) =>
    cleA === cleB ? valA.localeCompare(valB) : cleA.localeCompare(cleB)
  );
  return JSON.stringify(entrees);
}

export type DecisionSortie = "directe" | "brouillon" | "avertir";

/**
 * Sans changement : sortie directe, quel que soit le statut.
 * Nouvelle annonce ou brouillon modifié : enregistrement en brouillon.
 * Annonce publiée modifiée : avertissement de perte.
 */
export function decisionSortie({
  modifie,
  enregistrableEnBrouillon,
}: {
  modifie: boolean;
  enregistrableEnBrouillon: boolean;
}): DecisionSortie {
  if (!modifie) return "directe";
  return enregistrableEnBrouillon ? "brouillon" : "avertir";
}

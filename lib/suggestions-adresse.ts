type ReponseApiAdresse = {
  features?: Array<{ properties?: { label?: unknown } }>;
};

export const LONGUEUR_MIN_ADRESSE = 3;
export const NB_SUGGESTIONS_MAX = 5;

/** Extrait les libellés d'adresse (« n° rue, CP ville ») d'une réponse de l'API Adresse. */
export function normaliserSuggestions(donnees: unknown): string[] {
  const features = (donnees as ReponseApiAdresse)?.features;
  if (!Array.isArray(features)) return [];
  return features
    .map((f) => f?.properties?.label)
    .filter((l): l is string => typeof l === "string" && l.trim() !== "")
    .slice(0, NB_SUGGESTIONS_MAX);
}

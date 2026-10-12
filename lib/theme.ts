// Drapeau du pilote Harbor (Phase 39) : éteint en production. Lu au build (NEXT_PUBLIC_*),
// donc identique côté serveur et côté client.
export type Theme = "oryzo" | "harbor";

export const THEME_ACCUEIL: Theme =
  process.env.NEXT_PUBLIC_THEME_HARBOR === "true" ? "harbor" : "oryzo";

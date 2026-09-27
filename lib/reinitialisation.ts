import { createHash, randomBytes } from "node:crypto";

export const DUREE_VALIDITE_JETON_MS = 60 * 60 * 1000; // 1 h
export const DELAI_ENTRE_DEMANDES_MS = 2 * 60 * 1000; // 2 min

/** Hash stocké en base : le jeton brut ne quitte jamais l'email. */
export function hacherJeton(jetonBrut: string): string {
  return createHash("sha256").update(jetonBrut).digest("hex");
}

export function genererJeton(maintenant: Date = new Date()) {
  const brut = randomBytes(32).toString("base64url");
  return {
    brut,
    hash: hacherJeton(brut),
    expireLe: new Date(maintenant.getTime() + DUREE_VALIDITE_JETON_MS),
  };
}

export function jetonEstValide(
  jeton: { expireLe: Date } | null,
  maintenant: Date = new Date()
): boolean {
  return jeton !== null && jeton.expireLe.getTime() > maintenant.getTime();
}

/**
 * Délai anti-abus : tant qu'un jeton encore valide a moins de 2 minutes, une
 * nouvelle demande n'envoie rien (le message affiché reste le même).
 */
export function demandeTropRapprochee(
  jetonsExistants: { createdAt: Date; expireLe: Date }[],
  maintenant: Date = new Date()
): boolean {
  return jetonsExistants.some(
    (jeton) =>
      jetonEstValide(jeton, maintenant) &&
      maintenant.getTime() - jeton.createdAt.getTime() < DELAI_ENTRE_DEMANDES_MS
  );
}

export function lienReinitialisation(origine: string, jetonBrut: string): string {
  const url = new URL("/reinitialiser-mot-de-passe", origine);
  url.searchParams.set("jeton", jetonBrut);
  return url.toString();
}

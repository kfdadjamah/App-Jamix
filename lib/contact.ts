import { createHmac } from "node:crypto";

export const LIMITE_ENVOIS_CONTACT = 5;
export const FENETRE_LIMITE_MS = 60 * 60 * 1000; // 1 heure glissante
export const DUREE_CONSERVATION_ENVOIS_MS = 24 * 60 * 60 * 1000;

/**
 * IP du client : premier élément de `x-forwarded-for` (posé par Vercel), sinon
 * `x-real-ip`. En local, sans ces en-têtes, toutes les soumissions partagent
 * l'empreinte de « inconnue ».
 */
export function ipDuClient(enTetes: Headers): string {
  const transmise = enTetes.get("x-forwarded-for")?.split(",")[0]?.trim();
  return transmise || enTetes.get("x-real-ip")?.trim() || "inconnue";
}

/**
 * Empreinte HMAC-SHA-256 de l'IP. Avec une clé secrète, l'IP ne peut pas être
 * retrouvée en hachant tout l'espace IPv4, contrairement à un SHA-256 simple.
 */
export function empreinteIp(ip: string, secret: string): string {
  if (!secret) throw new Error("Clé secrète absente pour l'empreinte IP.");
  return createHmac("sha256", secret).update(ip).digest("hex");
}

/** Vrai si les envois réussis de la dernière heure atteignent déjà la limite. */
export function limiteEnvoisAtteinte(envois: Date[], maintenant: Date): boolean {
  const debut = maintenant.getTime() - FENETRE_LIMITE_MS;
  return envois.filter((date) => date.getTime() > debut).length >= LIMITE_ENVOIS_CONTACT;
}

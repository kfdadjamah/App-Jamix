const MOTIF_CODE_POSTAL = /^(.*?)[\s,]*\b(\d{5})\b\s*(.*)$/;

/**
 * Sépare le code postal d'un libellé de l'API Adresse (« 18 rue X, 69002 Lyon ») :
 * l'adresse est rendue sans lui (« 18 rue X, Lyon »). Sans code postal, le libellé reste inchangé.
 */
export function separerCodePostal(libelle: string): { adresse: string; codePostal: string } {
  const correspondance = MOTIF_CODE_POSTAL.exec(libelle.trim());
  if (!correspondance) return { adresse: libelle.trim(), codePostal: "" };
  const [, rue, codePostal, ville] = correspondance;
  return { adresse: [rue, ville].filter((partie) => partie !== "").join(", "), codePostal };
}

/** Recompose l'adresse affichée : « 18 rue X, 69002 Lyon ». Sans code postal, l'adresse seule. */
export function adresseComplete(bar: { adresse: string; codePostal: string }): string {
  if (!bar.codePostal) return bar.adresse;
  const dernierePartie = bar.adresse.lastIndexOf(",");
  if (dernierePartie === -1) return `${bar.adresse}, ${bar.codePostal}`;
  const rue = bar.adresse.slice(0, dernierePartie);
  const ville = bar.adresse.slice(dernierePartie + 1).trim();
  return `${rue}, ${bar.codePostal} ${ville}`;
}

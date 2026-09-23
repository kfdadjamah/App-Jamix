import { geocoderAdresse } from "@/lib/geocode";

type Geocodeur = typeof geocoderAdresse;

/**
 * Coordonnées à écrire lors d'une modification de la fiche bar. L'adresse
 * n'est re-géocodée que si elle change ; un échec remet lat/long à `null`
 * (la fiche reste valide, le bar sort de la carte).
 */
export async function coordonneesApresModification(
  adresseActuelle: string,
  nouvelleAdresse: string,
  geocoder: Geocodeur = geocoderAdresse
): Promise<{ latitude?: number | null; longitude?: number | null }> {
  if (nouvelleAdresse === adresseActuelle) return {};

  const coordonnees = await geocoder(nouvelleAdresse);
  return {
    latitude: coordonnees?.latitude ?? null,
    longitude: coordonnees?.longitude ?? null,
  };
}

/** Photos à retirer du stockage à la suppression du compte : bar et annonces. */
export function urlsPhotosDuCompte(
  bar: {
    photoUrl: string | null;
    annonces: { photoUrl1: string | null; photoUrl2: string | null }[];
  } | null
): string[] {
  if (!bar) return [];
  return [
    bar.photoUrl,
    ...bar.annonces.flatMap((annonce) => [annonce.photoUrl1, annonce.photoUrl2]),
  ].filter((url): url is string => Boolean(url));
}

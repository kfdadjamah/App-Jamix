type Coordonnees = { latitude: number; longitude: number };

type ReponseApiAdresse = {
  features: Array<{
    geometry: { coordinates: [number, number] };
  }>;
};

/**
 * Géocode une adresse française via l'API Adresse (data.gouv.fr / BAN).
 * Retourne `null` en cas d'échec — la fiche bar reste créable sans coordonnées.
 */
export async function geocoderAdresse(
  adresse: string
): Promise<Coordonnees | null> {
  try {
    const url = `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(
      adresse
    )}&limit=1`;
    const reponse = await fetch(url);
    if (!reponse.ok) return null;

    const donnees = (await reponse.json()) as ReponseApiAdresse;
    const premiereFeature = donnees.features?.[0];
    if (!premiereFeature) return null;

    const [longitude, latitude] = premiereFeature.geometry.coordinates;
    return { latitude, longitude };
  } catch {
    return null;
  }
}

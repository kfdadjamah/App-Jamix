const RAYON_TERRE_KM = 6371;

type Coordonnees = { latitude: number; longitude: number };

function versRadians(degres: number) {
  return (degres * Math.PI) / 180;
}

export function calculerDistanceKm(origine: Coordonnees, destination: Coordonnees) {
  const deltaLat = versRadians(destination.latitude - origine.latitude);
  const deltaLng = versRadians(destination.longitude - origine.longitude);

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(versRadians(origine.latitude)) *
      Math.cos(versRadians(destination.latitude)) *
      Math.sin(deltaLng / 2) ** 2;

  return RAYON_TERRE_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Distance entre le musicien et un bar, ou `null` si la géolocalisation est
 * refusée ou si le bar n'a pas pu être géocodé.
 */
export function distanceJusquAuBar(
  position: Coordonnees | null,
  bar: { latitude: number | null; longitude: number | null },
) {
  if (!position || bar.latitude === null || bar.longitude === null) return null;
  return calculerDistanceKm(position, { latitude: bar.latitude, longitude: bar.longitude });
}

export function formaterDistance(distanceKm: number) {
  // Arrondi aux 100 m d'abord : 0,96 km donne 1000 m, qui doit s'afficher en km.
  const metresArrondis = Math.round(distanceKm * 10) * 100;
  if (metresArrondis < 1000) {
    return `${metresArrondis} m`;
  }
  if (distanceKm < 10) {
    return `${distanceKm.toFixed(1)} km`;
  }
  return `${Math.round(distanceKm)} km`;
}

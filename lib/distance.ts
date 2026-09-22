const RAYON_TERRE_KM = 6371;

function versRadians(degres: number) {
  return (degres * Math.PI) / 180;
}

export function calculerDistanceKm(
  origine: { latitude: number; longitude: number },
  destination: { latitude: number; longitude: number },
) {
  const deltaLat = versRadians(destination.latitude - origine.latitude);
  const deltaLng = versRadians(destination.longitude - origine.longitude);

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(versRadians(origine.latitude)) *
      Math.cos(versRadians(destination.latitude)) *
      Math.sin(deltaLng / 2) ** 2;

  return RAYON_TERRE_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formaterDistance(distanceKm: number) {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000 / 100) * 100} m`;
  }
  if (distanceKm < 10) {
    return `${distanceKm.toFixed(1)} km`;
  }
  return `${Math.round(distanceKm)} km`;
}

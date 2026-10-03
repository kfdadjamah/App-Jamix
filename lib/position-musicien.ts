"use client";

import { useEffect, useState } from "react";

export type PositionMusicien = { latitude: number; longitude: number };

/**
 * Position du navigateur, demandée au montage ; `null` si refusée ou indisponible.
 * Partagée par l'accueil et la page d'une jam : une autorisation déjà donnée n'est pas redemandée.
 */
export function usePositionMusicien(): PositionMusicien | null {
  const [position, setPosition] = useState<PositionMusicien | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (resultat) =>
        setPosition({
          latitude: resultat.coords.latitude,
          longitude: resultat.coords.longitude,
        }),
      () => setPosition(null),
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 5 * 60_000 },
    );
  }, []);

  return position;
}

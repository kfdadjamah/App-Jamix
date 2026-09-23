"use client";

import { distanceJusquAuBar } from "@/lib/distance";
import { type recupererAnnoncesPubliees } from "@/lib/annonces";
import CarteAnnonce from "./carte-annonce";

type Occurrence = Awaited<ReturnType<typeof recupererAnnoncesPubliees>>[number];

export default function ListeAnnonces({
  occurrences,
  positionMusicien,
}: {
  occurrences: Occurrence[];
  positionMusicien: { latitude: number; longitude: number } | null;
}) {
  const occurrencesAvecDistance = occurrences.map((occurrence) => {
    const distanceKm = distanceJusquAuBar(positionMusicien, occurrence.annonce.bar);

    return { occurrence, distanceKm };
  });

  occurrencesAvecDistance.sort((a, b) => {
    if (a.distanceKm === null && b.distanceKm === null) return 0;
    if (a.distanceKm === null) return 1;
    if (b.distanceKm === null) return -1;
    return a.distanceKm - b.distanceKm;
  });

  return (
    <div className="flex flex-col gap-4">
      {occurrencesAvecDistance.map(({ occurrence, distanceKm }) => (
        <CarteAnnonce key={occurrence.id} occurrence={occurrence} distanceKm={distanceKm} />
      ))}
    </div>
  );
}

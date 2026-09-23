"use client";

import { useEffect, useState } from "react";
import { calculerDistanceKm, formaterDistance } from "@/lib/distance";
import { LIBELLES_STATUT_OCCURRENCE, formaterDateCourte } from "@/lib/annonce-constantes";
import { statutAffiche, type recupererAnnoncesPubliees } from "@/lib/annonces";

type Occurrence = Awaited<ReturnType<typeof recupererAnnoncesPubliees>>[number];

export default function ListeAnnonces({ occurrences }: { occurrences: Occurrence[] }) {
  const [positionMusicien, setPositionMusicien] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) =>
        setPositionMusicien({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }),
      () => setPositionMusicien(null),
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 5 * 60_000 },
    );
  }, [occurrences]);

  const occurrencesAvecDistance = occurrences.map((occurrence) => {
    const { latitude, longitude } = occurrence.annonce.bar;
    const distanceKm =
      positionMusicien && latitude !== null && longitude !== null
        ? calculerDistanceKm(positionMusicien, { latitude, longitude })
        : null;

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
        <div
          key={occurrence.id}
          className="flex flex-col gap-2 rounded-[12px] border border-[var(--color-cork-border)] p-4"
        >
          <div className="flex items-center justify-between">
            <span className="text-[18px] font-medium uppercase text-[var(--color-warm-cream)]">
              {occurrence.annonce.bar.nom}
            </span>
            <span className="text-[10px] font-medium uppercase text-[var(--color-driftwood)]">
              {LIBELLES_STATUT_OCCURRENCE[statutAffiche(occurrence)]}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[12px] text-[var(--color-driftwood)]">
              {occurrence.annonce.bar.adresse}
            </span>
            {distanceKm !== null && (
              <span className="whitespace-nowrap text-[12px] text-[var(--color-driftwood)]">
                {formaterDistance(distanceKm)}
              </span>
            )}
          </div>
          <span className="text-[15px] text-[var(--color-warm-cream)]">
            {occurrence.heureDebut}
            {occurrence.heureFin ? ` – ${occurrence.heureFin}` : ""}
          </span>
          {(() => {
            const statut = statutAffiche(occurrence);
            const afficherEcheance =
              (statut === "PROGRAMMEE" || statut === "EN_ATTENTE_CONFIRMATION") &&
              occurrence.confirmationJ7;
            if (!afficherEcheance) return null;
            return (
              <span className="text-[12px] text-[var(--color-driftwood)]">
                Sera confirmée le {formaterDateCourte(new Date(occurrence.confirmationJ7!))}
              </span>
            );
          })()}
          {occurrence.annonce.styles.length > 0 && (
            <span className="text-[12px] uppercase text-[var(--color-driftwood)]">
              {occurrence.annonce.styles.join(", ")}
              {occurrence.annonce.styleAutre ? ` (${occurrence.annonce.styleAutre})` : ""}
            </span>
          )}
          {occurrence.annonce.instruments.length > 0 && (
            <span className="text-[12px] text-[var(--color-driftwood)]">
              Backline : {occurrence.annonce.instruments.join(", ")}
              {occurrence.annonce.instrumentAutre
                ? ` (${occurrence.annonce.instrumentAutre})`
                : ""}
            </span>
          )}
          {(occurrence.annonce.photoUrl1 || occurrence.annonce.photoUrl2) && (
            <div className="flex gap-3">
              {[occurrence.annonce.photoUrl1, occurrence.annonce.photoUrl2]
                .filter(Boolean)
                .map((url) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={url}
                    src={url!}
                    alt={occurrence.annonce.bar.nom}
                    className="h-24 w-24 rounded-[12px] object-cover"
                  />
                ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

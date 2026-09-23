"use client";

import { calculerDistanceKm } from "@/lib/distance";
import { type recupererAnnoncesPubliees } from "@/lib/annonces";
import CarteAnnonce from "./carte-annonce";

type Occurrence = Awaited<ReturnType<typeof recupererAnnoncesPubliees>>[number];

export default function BottomSheetBar({
  occurrences,
  positionMusicien,
  onFermer,
}: {
  occurrences: Occurrence[];
  positionMusicien: { latitude: number; longitude: number } | null;
  onFermer: () => void;
}) {
  if (occurrences.length === 0) return null;

  const nomBar = occurrences[0].annonce.bar.nom;

  return (
    <div className="fixed inset-x-0 bottom-0 z-10 mx-auto flex max-h-[60vh] w-full max-w-md flex-col gap-4 overflow-y-auto rounded-t-[12px] border-t border-[var(--color-cork-border)] bg-[color:var(--color-walnut-shadow)] p-4">
      <div className="flex items-center justify-between">
        <span className="text-[18px] font-medium uppercase text-[var(--color-warm-cream)]">
          {nomBar}
        </span>
        <button
          type="button"
          onClick={onFermer}
          className="text-[12px] font-medium uppercase text-[var(--color-driftwood)]"
        >
          Fermer
        </button>
      </div>
      {occurrences.map((occurrence) => {
        const { latitude, longitude } = occurrence.annonce.bar;
        const distanceKm =
          positionMusicien && latitude !== null && longitude !== null
            ? calculerDistanceKm(positionMusicien, { latitude, longitude })
            : null;
        return <CarteAnnonce key={occurrence.id} occurrence={occurrence} distanceKm={distanceKm} />;
      })}
    </div>
  );
}

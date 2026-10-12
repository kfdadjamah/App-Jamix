"use client";

import { distanceJusquAuBar } from "@/lib/distance";
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
    <div
      className="fixed inset-x-0 bottom-0 z-10 mx-auto flex max-h-[60vh] w-full max-w-md flex-col gap-4 overflow-y-auto p-4 rounded-t-[16px] border-t border-[var(--harbor-trait)] bg-white shadow-[var(--harbor-ombre-menu)]"
    >
      <div className="flex items-center justify-between">
        <span
          className="truncate text-[20px] font-extrabold tracking-[-0.025em] text-[var(--harbor-marine)]"
        >
          {nomBar}
        </span>
        <button
          type="button"
          onClick={onFermer}
          className="rounded-full bg-[var(--harbor-voile)] px-3 py-1.5 text-[12px] font-bold text-[var(--harbor-marine)]"
        >
          Fermer
        </button>
      </div>
      {occurrences.map((occurrence) => {
        const distanceKm = distanceJusquAuBar(positionMusicien, occurrence.annonce.bar);
        return (
          <CarteAnnonce
            key={occurrence.id}
            occurrence={occurrence}
            distanceKm={distanceKm}
            mode="fiche"
          />
        );
      })}
    </div>
  );
}

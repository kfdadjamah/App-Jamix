"use client";

import { distanceJusquAuBar } from "@/lib/distance";
import { type recupererAnnoncesPubliees } from "@/lib/annonces";
import type { Theme } from "@/lib/theme";
import CarteAnnonce from "./carte-annonce";

type Occurrence = Awaited<ReturnType<typeof recupererAnnoncesPubliees>>[number];

export default function BottomSheetBar({
  occurrences,
  positionMusicien,
  onFermer,
  theme = "oryzo",
}: {
  occurrences: Occurrence[];
  positionMusicien: { latitude: number; longitude: number } | null;
  onFermer: () => void;
  theme?: Theme;
}) {
  if (occurrences.length === 0) return null;

  const nomBar = occurrences[0].annonce.bar.nom;
  const harbor = theme === "harbor";

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-10 mx-auto flex max-h-[60vh] w-full max-w-md flex-col gap-4 overflow-y-auto p-4 ${
        harbor
          ? "rounded-t-[16px] border-t border-[var(--harbor-trait)] bg-white shadow-[var(--harbor-ombre-menu)]"
          : "rounded-t-[12px] border-t border-[var(--color-cork-border)] bg-[color:var(--color-walnut-shadow)]"
      }`}
    >
      <div className="flex items-center justify-between">
        <span
          className={
            harbor
              ? "truncate text-[20px] font-extrabold tracking-[-0.025em] text-[var(--harbor-marine)]"
              : "text-[18px] font-medium uppercase text-[var(--color-warm-cream)]"
          }
        >
          {nomBar}
        </span>
        <button
          type="button"
          onClick={onFermer}
          className={
            harbor
              ? "rounded-full bg-[var(--harbor-voile)] px-3 py-1.5 text-[12px] font-bold text-[var(--harbor-marine)]"
              : "text-[12px] font-medium uppercase text-[color:var(--color-texte-secondaire)]"
          }
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
            theme={theme}
          />
        );
      })}
    </div>
  );
}

"use client";

import { distanceJusquAuBar, formaterDistance } from "@/lib/distance";
import { usePositionMusicien } from "@/lib/position-musicien";

// Rien sans géolocalisation acceptée ni bar géocodé (US-18).
export default function DistanceJam({
  bar,
}: {
  bar: { latitude: number | null; longitude: number | null };
}) {
  const distanceKm = distanceJusquAuBar(usePositionMusicien(), bar);
  if (distanceKm === null) return null;

  return (
    <span className="whitespace-nowrap text-[12px] text-[var(--color-driftwood)]">
      {formaterDistance(distanceKm)}
    </span>
  );
}

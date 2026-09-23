"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { type recupererAnnoncesPubliees } from "@/lib/annonces";
import ListeAnnonces from "./liste-annonces";
import ToggleVue, { type Vue } from "./toggle-vue";
import BottomSheetBar from "./bottom-sheet-bar";

const JamMap = dynamic(() => import("@/components/JamMap"), { ssr: false });

type Occurrence = Awaited<ReturnType<typeof recupererAnnoncesPubliees>>[number];

export default function ConsultationMusicien({
  occurrences,
  dateSelectionnee,
  vue,
}: {
  occurrences: Occurrence[];
  dateSelectionnee: string;
  vue: Vue;
}) {
  const [positionMusicien, setPositionMusicien] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [barSelectionneId, setBarSelectionneId] = useState<string | null>(null);

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
  }, []);

  const occurrencesDuBarSelectionne = barSelectionneId
    ? occurrences.filter((occurrence) => occurrence.annonce.bar.id === barSelectionneId)
    : [];

  return (
    <div className="flex flex-col gap-4">
      <ToggleVue vue={vue} dateSelectionnee={dateSelectionnee} />

      {vue === "liste" ? (
        <ListeAnnonces occurrences={occurrences} positionMusicien={positionMusicien} />
      ) : (
        <div className="relative h-[70vh] overflow-hidden rounded-[12px]">
          <JamMap
            occurrences={occurrences}
            positionMusicien={positionMusicien}
            onSelectionBar={setBarSelectionneId}
          />
          {barSelectionneId && (
            <BottomSheetBar
              occurrences={occurrencesDuBarSelectionne}
              positionMusicien={positionMusicien}
              onFermer={() => setBarSelectionneId(null)}
            />
          )}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { type recupererAnnoncesPubliees } from "@/lib/annonces";
import { usePositionMusicien } from "@/lib/position-musicien";
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
  const positionMusicien = usePositionMusicien();
  const [barSelectionneId, setBarSelectionneId] = useState<string | null>(null);

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

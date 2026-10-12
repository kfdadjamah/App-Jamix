"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { type recupererAnnoncesPubliees } from "@/lib/annonces";
import { usePositionMusicien } from "@/lib/position-musicien";
import type { Theme } from "@/lib/theme";
import ListeAnnonces from "./liste-annonces";
import ToggleVue, { type Vue } from "./toggle-vue";
import BottomSheetBar from "./bottom-sheet-bar";

const JamMap = dynamic(() => import("@/components/JamMap"), { ssr: false });

type Occurrence = Awaited<ReturnType<typeof recupererAnnoncesPubliees>>[number];

export default function ConsultationMusicien({
  occurrences,
  dateSelectionnee,
  vue,
  theme = "oryzo",
}: {
  occurrences: Occurrence[];
  dateSelectionnee: string;
  vue: Vue;
  theme?: Theme;
}) {
  const positionMusicien = usePositionMusicien();
  const [barSelectionneId, setBarSelectionneId] = useState<string | null>(null);

  const occurrencesDuBarSelectionne = barSelectionneId
    ? occurrences.filter((occurrence) => occurrence.annonce.bar.id === barSelectionneId)
    : [];

  return (
    <div className="flex flex-col gap-4">
      <ToggleVue vue={vue} dateSelectionnee={dateSelectionnee} theme={theme} />

      {vue === "liste" ? (
        <ListeAnnonces occurrences={occurrences} positionMusicien={positionMusicien} theme={theme} />
      ) : (
        <div className="relative h-[70vh] overflow-hidden rounded-[12px]">
          <JamMap
            theme={theme}
            occurrences={occurrences}
            positionMusicien={positionMusicien}
            onSelectionBar={setBarSelectionneId}
          />
          {barSelectionneId && (
            <BottomSheetBar
              occurrences={occurrencesDuBarSelectionne}
              positionMusicien={positionMusicien}
              onFermer={() => setBarSelectionneId(null)}
              theme={theme}
            />
          )}
        </div>
      )}
    </div>
  );
}

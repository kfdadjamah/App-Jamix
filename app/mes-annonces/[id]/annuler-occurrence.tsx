"use client";

import { useId, useState } from "react";
import { annulerOccurrence } from "../actions";
import ConfirmationAnnulation from "../confirmation-annulation";

export default function AnnulerOccurrence({
  occurrenceId,
  libelleDate,
}: {
  occurrenceId: string;
  libelleDate: string;
}) {
  const [ouverte, setOuverte] = useState(false);
  const idTitre = useId();

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={() => setOuverte(true)}
        className="rounded-[8px] px-2.5 py-2 text-[13px] font-bold bg-[var(--harbor-erreur)] text-white transition-colors duration-[120ms] hover:bg-[color-mix(in_srgb,var(--harbor-erreur),black_10%)] active:bg-[color-mix(in_srgb,var(--harbor-erreur),black_20%)]"
      >
        Annuler cette date
      </button>
      {ouverte && (
        <ConfirmationAnnulation
          id={idTitre}
          titre="Annuler cette date ?"
          recapitulatif={`Date annulée : ${libelleDate}.`}
          action={() => annulerOccurrence(occurrenceId)}
          surFermeture={() => setOuverte(false)}
        />
      )}
    </div>
  );
}

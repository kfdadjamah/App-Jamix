"use client";

import { useState } from "react";
import { annulerOccurrence } from "../actions";

type Resultat = { erreur: string } | { succes: true };

export default function AnnulerOccurrence({ occurrenceId }: { occurrenceId: string }) {
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function surAnnulation() {
    setErreur(null);
    setEnCours(true);
    const resultat: Resultat = await annulerOccurrence(occurrenceId);
    setEnCours(false);
    if ("erreur" in resultat) {
      setErreur(resultat.erreur);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={surAnnulation}
        disabled={enCours}
        className="rounded-[8px] px-2.5 py-1.5 text-[13px] font-bold text-[var(--harbor-marine)] underline-offset-2 transition-colors duration-[120ms] hover:bg-[var(--harbor-voile)] active:bg-[var(--harbor-trait)] hover:underline disabled:opacity-60"
      >
        Annuler cette date
      </button>
      {erreur && (
        <span className="text-[13px] font-semibold text-[var(--harbor-erreur)]">
          {erreur}
        </span>
      )}
    </div>
  );
}

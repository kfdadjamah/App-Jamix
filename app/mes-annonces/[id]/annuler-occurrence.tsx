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
        className="rounded-[8px] px-2.5 py-2 text-[13px] font-bold bg-[var(--harbor-erreur)] text-white transition-colors duration-[120ms] hover:bg-[color-mix(in_srgb,var(--harbor-erreur),black_10%)] active:bg-[color-mix(in_srgb,var(--harbor-erreur),black_20%)] disabled:opacity-60"
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

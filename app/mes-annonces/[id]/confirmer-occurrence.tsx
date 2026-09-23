"use client";

import { useState } from "react";
import { confirmerOccurrence } from "../actions";

type Resultat = { erreur: string } | { succes: true };

export default function ConfirmerOccurrence({ occurrenceId }: { occurrenceId: string }) {
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function surConfirmation() {
    setErreur(null);
    setEnCours(true);
    const resultat: Resultat = await confirmerOccurrence(occurrenceId);
    setEnCours(false);
    if ("erreur" in resultat) {
      setErreur(resultat.erreur);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={surConfirmation}
        disabled={enCours}
        className="rounded-[22.5px] border border-[var(--color-warm-cream)] px-4 py-[7.5px] text-[12px] font-medium uppercase text-[var(--color-warm-cream)] disabled:opacity-60"
      >
        Confirmer
      </button>
      {erreur && (
        <span className="text-[10px] font-medium uppercase text-[var(--color-gold-elegance)]">
          {erreur}
        </span>
      )}
    </div>
  );
}

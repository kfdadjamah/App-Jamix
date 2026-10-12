"use client";

import { useState } from "react";
import { annulerAnnonce } from "../actions";

type Resultat = { erreur: string } | { succes: true };

export default function AnnulerAnnonce({ annonceId }: { annonceId: string }) {
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function surAnnulation() {
    setErreur(null);
    setEnCours(true);
    const resultat: Resultat = await annulerAnnonce(annonceId);
    setEnCours(false);
    if ("erreur" in resultat) {
      setErreur(resultat.erreur);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={surAnnulation}
        disabled={enCours}
        className="rounded-[12px] border border-[var(--harbor-trait)] bg-white px-4 py-2 text-[13px] font-bold text-[var(--harbor-marine)] transition-colors duration-[120ms] hover:bg-[var(--harbor-voile)] active:border-[var(--harbor-bleu-clair)] active:bg-[var(--harbor-voile)] disabled:opacity-60"
      >
        Annuler toutes les dates
      </button>
      {erreur && (
        <span className="text-[13px] font-semibold text-[var(--harbor-erreur)]">
          {erreur}
        </span>
      )}
    </div>
  );
}

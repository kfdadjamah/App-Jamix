"use client";

import { useId, useState } from "react";
import { annulerAnnonce } from "../actions";
import ConfirmationAnnulation from "../confirmation-annulation";

export default function AnnulerAnnonce({ annonceId }: { annonceId: string }) {
  const [ouverte, setOuverte] = useState(false);
  const idTitre = useId();

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={() => setOuverte(true)}
        className="rounded-[8px] px-4 py-2 text-[13px] font-bold bg-[var(--harbor-erreur)] text-white transition-colors duration-[120ms] hover:bg-[color-mix(in_srgb,var(--harbor-erreur),black_10%)] active:bg-[color-mix(in_srgb,var(--harbor-erreur),black_20%)]"
      >
        Annuler toutes les dates
      </button>
      {ouverte && (
        <ConfirmationAnnulation
          id={idTitre}
          titre="Annuler toutes les dates ?"
          recapitulatif="Toutes les dates de l'annonce seront annulées."
          action={() => annulerAnnonce(annonceId)}
          surFermeture={() => setOuverte(false)}
        />
      )}
    </div>
  );
}

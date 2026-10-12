"use client";

import { useRef, useState } from "react";
import { mettreAJourPhotoBar, retirerPhotoBar } from "./actions";

export default function GestionPhotoBar({
  barId,
  photoUrl,
}: {
  barId: string;
  photoUrl: string | null;
}) {
  const refFichier = useRef<HTMLInputElement>(null);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function surChangementFichier() {
    const fichier = refFichier.current?.files?.[0];
    if (!fichier) return;

    setErreur(null);
    setEnCours(true);
    const formData = new FormData();
    formData.set("photo", fichier);
    const resultat = await mettreAJourPhotoBar(barId, formData);
    setEnCours(false);
    if ("erreur" in resultat) {
      setErreur(resultat.erreur);
    }
  }

  async function surRetrait() {
    setErreur(null);
    setEnCours(true);
    const resultat = await retirerPhotoBar(barId);
    setEnCours(false);
    if ("erreur" in resultat) {
      setErreur(resultat.erreur);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <span className="text-[12px] font-semibold text-[var(--harbor-marine-2)]">
        Photo ou logo
      </span>

      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photoUrl}
          alt="Photo du bar"
          className="h-32 w-32 rounded-[12px] object-cover"
        />
      ) : (
        <div className="flex h-32 w-32 items-center justify-center rounded-[12px] border border-dashed border-[var(--harbor-trait)] text-[10px] text-[var(--harbor-marine-2)]">
          Aucune photo
        </div>
      )}

      <div className="flex gap-3">
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          ref={refFichier}
          onChange={surChangementFichier}
          disabled={enCours}
          className="text-[12px] text-[var(--harbor-marine)]"
        />
        {photoUrl && (
          <button
            type="button"
            onClick={surRetrait}
            disabled={enCours}
            className="rounded-[12px] border border-[var(--harbor-trait)] bg-white px-4 py-2 text-[13px] font-bold text-[var(--harbor-marine)] transition-colors duration-[120ms] hover:bg-[var(--harbor-voile)] disabled:opacity-60"
          >
            Retirer
          </button>
        )}
      </div>

      {erreur && (
        <span className="text-[13px] font-semibold text-[var(--harbor-erreur)]">
          {erreur}
        </span>
      )}
    </div>
  );
}

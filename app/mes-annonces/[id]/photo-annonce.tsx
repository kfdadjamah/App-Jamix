"use client";

import { useRef, useState } from "react";
import { mettreAJourPhotoAnnonce, retirerPhotoAnnonce } from "../actions";

type Resultat = { erreur: string } | { succes: true };

export default function PhotoAnnonce({
  annonceId,
  emplacement,
  photoUrl,
  label,
}: {
  annonceId: string;
  emplacement: 1 | 2;
  photoUrl: string | null;
  label: string;
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
    const resultat: Resultat = await mettreAJourPhotoAnnonce(annonceId, emplacement, formData);
    setEnCours(false);
    if ("erreur" in resultat) {
      setErreur(resultat.erreur);
    }
  }

  async function surRetrait() {
    setErreur(null);
    setEnCours(true);
    const resultat: Resultat = await retirerPhotoAnnonce(annonceId, emplacement);
    setEnCours(false);
    if ("erreur" in resultat) {
      setErreur(resultat.erreur);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <span className="text-[12px] font-medium uppercase text-[var(--color-driftwood)]">
        {label}
      </span>

      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photoUrl}
          alt={label}
          className="h-32 w-32 rounded-[12px] object-cover"
        />
      ) : (
        <div className="flex h-32 w-32 items-center justify-center rounded-[12px] border border-dashed border-[var(--color-cork-border)] text-[10px] uppercase text-[var(--color-driftwood)]">
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
          className="text-[12px] text-[var(--color-warm-cream)]"
        />
        {photoUrl && (
          <button
            type="button"
            onClick={surRetrait}
            disabled={enCours}
            className="rounded-[22.5px] border border-[var(--color-warm-cream)] px-4 py-[7.5px] text-[12px] font-medium uppercase text-[var(--color-warm-cream)] disabled:opacity-60"
          >
            Retirer
          </button>
        )}
      </div>

      {erreur && (
        <span className="text-[10px] font-medium uppercase text-[var(--color-gold-elegance)]">
          {erreur}
        </span>
      )}
    </div>
  );
}

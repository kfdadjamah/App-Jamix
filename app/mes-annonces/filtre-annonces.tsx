"use client";

import { Fragment, useState, type ReactNode } from "react";

// Filtre non persisté : l'état local revient sur « Tous » à chaque visite de la page.
export default function FiltreAnnonces({
  bars,
  annonces,
}: {
  bars: { id: string; nom: string }[];
  annonces: { id: string; barId: string; carte: ReactNode }[];
}) {
  const [barId, setBarId] = useState<string | null>(null);

  const options = [{ id: null, nom: "Tous" }, ...bars];
  const annoncesFiltrees =
    barId === null ? annonces : annonces.filter((annonce) => annonce.barId === barId);
  const barChoisi = bars.find((bar) => bar.id === barId);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const actif = option.id === barId;
          return (
            <button
              key={option.id ?? "tous"}
              type="button"
              aria-pressed={actif}
              onClick={() => setBarId(option.id)}
              className={`max-w-full truncate rounded-[22.5px] border border-[var(--color-warm-cream)] px-4 py-[7.5px] text-[12px] font-medium uppercase text-[var(--color-warm-cream)] ${
                actif ? "bg-[var(--color-warm-cream)]/15" : ""
              }`}
            >
              {option.nom}
            </button>
          );
        })}
      </div>

      {annoncesFiltrees.length === 0 && barChoisi && (
        <p className="break-words text-[15px] text-[color:var(--color-texte-secondaire)]">
          Aucune annonce pour {barChoisi.nom}.
        </p>
      )}

      {annoncesFiltrees.map((annonce) => (
        <Fragment key={annonce.id}>{annonce.carte}</Fragment>
      ))}
    </div>
  );
}

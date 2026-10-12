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
              className={`max-w-full truncate rounded-[12px] border border-[var(--harbor-trait)] bg-white px-4 py-2 text-[13px] font-bold text-[var(--harbor-marine)] transition-colors duration-[120ms] hover:bg-[var(--harbor-voile)] ${
                actif ? "bg-[var(--color-warm-cream)]/15" : ""
              }`}
            >
              {option.nom}
            </button>
          );
        })}
      </div>

      {annoncesFiltrees.length === 0 && barChoisi && (
        <p className="break-words text-[15px] text-[var(--harbor-marine-2)]">
          Aucune annonce pour {barChoisi.nom}.
        </p>
      )}

      {annoncesFiltrees.map((annonce) => (
        <Fragment key={annonce.id}>{annonce.carte}</Fragment>
      ))}
    </div>
  );
}

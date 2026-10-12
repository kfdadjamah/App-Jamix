"use client";

import { useEffect, useRef, useState } from "react";
import { applicationsCarto, detecterAppareil, type Destination } from "@/lib/itineraire";

export default function BoutonItineraire({ bar }: { bar: Destination }) {
  const [ouvert, setOuvert] = useState(false);
  const [appareil, setAppareil] = useState({ apple: false, mobile: false });
  const conteneurRef = useRef<HTMLDivElement | null>(null);

  // Détection à l'ouverture, côté client : le menu n'est jamais rendu côté serveur.
  function basculerMenu() {
    if (!ouvert) {
      setAppareil(
        detecterAppareil(navigator.userAgent, window.matchMedia("(pointer: coarse)").matches)
      );
    }
    setOuvert(!ouvert);
  }

  useEffect(() => {
    if (!ouvert) return;
    function surClicExterieur(event: PointerEvent) {
      if (!conteneurRef.current?.contains(event.target as Node)) setOuvert(false);
    }
    function surTouche(event: KeyboardEvent) {
      if (event.key === "Escape") setOuvert(false);
    }
    document.addEventListener("pointerdown", surClicExterieur);
    document.addEventListener("keydown", surTouche);
    return () => {
      document.removeEventListener("pointerdown", surClicExterieur);
      document.removeEventListener("keydown", surTouche);
    };
  }, [ouvert]);

  const applications = applicationsCarto(bar, appareil);

  return (
    <div ref={conteneurRef} className="self-start">
      <button
        type="button"
        onClick={basculerMenu}
        aria-expanded={ouvert}
        aria-haspopup="menu"
        className="rounded-[12px] border border-[var(--harbor-trait)] bg-white px-4 py-2 text-[13px] font-bold text-[var(--harbor-marine)] transition-colors duration-[120ms] hover:bg-[var(--harbor-voile)] active:border-[var(--harbor-bleu-clair)] active:bg-[var(--harbor-voile)]"
      >
        Itinéraire
      </button>
      {/* Dans le flux plutôt qu'en superposition : la fiche de la carte défile et couperait le menu. */}
      {ouvert && (
        <div
          role="menu"
          className="mt-2 flex min-w-[180px] flex-col gap-3 rounded-[12px] border border-[var(--harbor-trait)] bg-white p-4 shadow-[var(--harbor-ombre-menu)]"
        >
          {applications.map((app) => (
            <a
              key={app.nom}
              role="menuitem"
              href={app.url}
              target="_blank"
              rel="noopener"
              onClick={() => setOuvert(false)}
              className="text-[13px] font-semibold text-[var(--harbor-bleu)] hover:underline active:text-[var(--harbor-marine)]"
            >
              {app.nom}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

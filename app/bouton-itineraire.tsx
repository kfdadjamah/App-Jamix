"use client";

import { useEffect, useRef, useState } from "react";

interface Destination {
  nom: string;
  adresse: string;
  latitude: number | null;
  longitude: number | null;
}

interface ApplicationCarto {
  nom: string;
  url: string;
  appleSeulement?: boolean;
  mobileSeulement?: boolean;
}

// Liens universels : ils ouvrent l'application si elle est installée, sa version web sinon.
function applicationsCarto(bar: Destination): ApplicationCarto[] {
  const coordonnees =
    bar.latitude !== null && bar.longitude !== null ? `${bar.latitude},${bar.longitude}` : null;
  const adresse = encodeURIComponent(bar.adresse);
  const destination = coordonnees ?? adresse;

  return [
    {
      nom: "Google Maps",
      url: `https://www.google.com/maps/dir/?api=1&destination=${destination}`,
    },
    {
      nom: "Plans",
      url: `https://maps.apple.com/?daddr=${destination}`,
      appleSeulement: true,
    },
    {
      nom: "Waze",
      url: coordonnees
        ? `https://waze.com/ul?ll=${coordonnees}&navigate=yes`
        : `https://waze.com/ul?q=${adresse}&navigate=yes`,
      mobileSeulement: true,
    },
    {
      nom: "Citymapper",
      url:
        "https://citymapper.com/directions?" +
        (coordonnees ? `endcoord=${coordonnees}&` : "") +
        `endname=${encodeURIComponent(bar.nom)}&endaddress=${adresse}`,
      mobileSeulement: true,
    },
  ];
}

export default function BoutonItineraire({ bar }: { bar: Destination }) {
  const [ouvert, setOuvert] = useState(false);
  const [appareil, setAppareil] = useState({ apple: false, mobile: false });
  const conteneurRef = useRef<HTMLDivElement | null>(null);

  // Détection à l'ouverture, côté client : le menu n'est jamais rendu côté serveur.
  function basculerMenu() {
    if (!ouvert) {
      setAppareil({
        apple: /iPhone|iPad|Macintosh/.test(navigator.userAgent),
        mobile: window.matchMedia("(pointer: coarse)").matches,
      });
    }
    setOuvert(!ouvert);
  }

  useEffect(() => {
    if (!ouvert) return;
    function surClicExterieur(event: PointerEvent) {
      if (!conteneurRef.current?.contains(event.target as Node)) setOuvert(false);
    }
    document.addEventListener("pointerdown", surClicExterieur);
    return () => document.removeEventListener("pointerdown", surClicExterieur);
  }, [ouvert]);

  const applications = applicationsCarto(bar).filter(
    (app) => (!app.appleSeulement || appareil.apple) && (!app.mobileSeulement || appareil.mobile)
  );

  return (
    <div ref={conteneurRef} className="self-start">
      <button
        type="button"
        onClick={basculerMenu}
        aria-expanded={ouvert}
        aria-haspopup="menu"
        className="rounded-[22.5px] border border-[var(--color-warm-cream)] px-4 py-[7.5px] text-[12px] font-medium uppercase text-[var(--color-warm-cream)]"
      >
        Itinéraire
      </button>
      {/* Dans le flux plutôt qu'en superposition : la fiche de la carte défile et couperait le menu. */}
      {ouvert && (
        <div
          role="menu"
          className="mt-2 flex min-w-[180px] flex-col gap-3 rounded-[12px] border border-[var(--color-cork-border)] p-4"
        >
          {applications.map((app) => (
            <a
              key={app.nom}
              role="menuitem"
              href={app.url}
              target="_blank"
              rel="noopener"
              onClick={() => setOuvert(false)}
              className="text-[12px] font-medium uppercase text-[var(--color-warm-cream)] underline"
            >
              {app.nom}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

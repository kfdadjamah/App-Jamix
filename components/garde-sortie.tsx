"use client";

import Link from "next/link";
import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

type Garde = (destination: string) => void;

type ContexteGardeSortie = {
  gardeRef: React.RefObject<Garde | null>;
  enregistrerGarde: (garde: Garde | null) => void;
  occupe: boolean;
  setOccupe: (occupe: boolean) => void;
};

const Contexte = createContext<ContexteGardeSortie | null>(null);

// Entoure l'en-tête et le formulaire d'annonce : les sorties via l'application
// (Retour, « Jamix », « À confirmer », icône de profil) passent par la garde.
export function FournisseurGardeSortie({ children }: { children: React.ReactNode }) {
  const gardeRef = useRef<Garde | null>(null);
  const [occupe, setOccupe] = useState(false);
  const enregistrerGarde = useCallback((garde: Garde | null) => {
    gardeRef.current = garde;
  }, []);
  const valeur = useMemo(
    () => ({ gardeRef, enregistrerGarde, occupe, setOccupe }),
    [enregistrerGarde, occupe]
  );
  return <Contexte.Provider value={valeur}>{children}</Contexte.Provider>;
}

export function useGardeSortie() {
  return useContext(Contexte);
}

// Sans garde active (hors formulaire d'annonce), se comporte comme un Link ordinaire.
export function LienGarde({
  href,
  libelleOccupe,
  className,
  children,
  ...props
}: Omit<React.ComponentProps<typeof Link>, "href"> & {
  href: string;
  libelleOccupe?: string;
}) {
  const contexte = useContext(Contexte);
  const occupe = contexte?.occupe ?? false;

  function surClic(e: React.MouseEvent<HTMLAnchorElement>) {
    // Ouverture dans un nouvel onglet : on ne quitte pas la saisie.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    const garde = contexte?.gardeRef.current;
    if (!garde && !occupe) return;
    e.preventDefault();
    if (occupe) return;
    garde?.(href);
  }

  return (
    <Link
      {...props}
      href={href}
      onClick={surClic}
      aria-disabled={occupe || undefined}
      className={`${className ?? ""}${occupe ? " pointer-events-none opacity-60" : ""}`}
    >
      {occupe && libelleOccupe ? libelleOccupe : children}
    </Link>
  );
}

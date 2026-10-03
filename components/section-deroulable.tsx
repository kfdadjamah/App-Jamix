"use client";

import { useId, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

// Section du profil dépliée ou repliée d'un clic sur sa ligne de titre.
// Le contenu replié reste monté (masqué par `hidden`) : la saisie est conservée.
export default function SectionDeroulable({
  titre,
  sousTitre,
  ouverteParDefaut = false,
  children,
}: {
  titre: string;
  // Toujours visible, section repliée ou non (ex. email actuel).
  sousTitre?: ReactNode;
  ouverteParDefaut?: boolean;
  children: ReactNode;
}) {
  const [ouverte, setOuverte] = useState(ouverteParDefaut);
  const idContenu = useId();

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-[24px] font-medium uppercase leading-[1.09] text-[var(--color-warm-cream)]">
          <button
            type="button"
            onClick={() => setOuverte(!ouverte)}
            aria-expanded={ouverte}
            aria-controls={idContenu}
            className="flex w-full items-center justify-between gap-3 text-left uppercase hover:underline focus-visible:underline focus-visible:outline-none"
          >
            {titre}
            <ChevronDown
              aria-hidden="true"
              size={20}
              strokeWidth={1.5}
              className={`shrink-0 ${ouverte ? "rotate-180" : ""}`}
            />
          </button>
        </h2>
        {sousTitre}
      </div>

      <div id={idContenu} hidden={!ouverte} className="flex flex-col gap-6">
        {children}
      </div>
    </section>
  );
}

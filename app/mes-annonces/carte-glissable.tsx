"use client";

import { useRef, useState, type PointerEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { FenetreSuppression, type DateSupprimable } from "./menu-annonce";

const LARGEUR_ACTION = 96;
const SEUIL_OUVERTURE = 72;
const SEUIL_GESTE = 8;

type Cote = "gauche" | "droite" | null;

// Enveloppe la carte d'une annonce : glissé à gauche → « Supprimer », à droite → « Modifier ».
// Le geste seul ne déclenche rien ; il révèle un bouton qu'il faut toucher.
export default function CarteGlissable({
  annonceId,
  datesSupprimables,
  estRecurrente,
  children,
}: {
  annonceId: string;
  datesSupprimables: DateSupprimable[];
  estRecurrente: boolean;
  children: ReactNode;
}) {
  const routeur = useRouter();
  const [ouvert, setOuvert] = useState<Cote>(null);
  const [decalageEnCours, setDecalageEnCours] = useState<number | null>(null);
  const [suppressionOuverte, setSuppressionOuverte] = useState(false);
  const geste = useRef<{
    x: number;
    y: number;
    base: number;
    actif: boolean;
  } | null>(null);
  const aGlisse = useRef(false);

  const decalageRepos =
    ouvert === "gauche"
      ? -LARGEUR_ACTION
      : ouvert === "droite"
        ? LARGEUR_ACTION
        : 0;
  const decalage = decalageEnCours ?? decalageRepos;

  function surDebut(evenement: PointerEvent<HTMLDivElement>) {
    if (evenement.pointerType === "mouse" && evenement.button !== 0) return;
    // Les fenêtres (dialog) sont dans la carte côté DOM : leurs gestes ne déplacent pas la carte.
    if ((evenement.target as HTMLElement).closest("dialog")) return;
    aGlisse.current = false;
    geste.current = {
      x: evenement.clientX,
      y: evenement.clientY,
      base: decalageRepos,
      actif: false,
    };
  }

  function surMouvement(evenement: PointerEvent<HTMLDivElement>) {
    const courant = geste.current;
    if (!courant) return;
    const dx = evenement.clientX - courant.x;
    const dy = evenement.clientY - courant.y;
    if (!courant.actif) {
      if (Math.abs(dx) < SEUIL_GESTE || Math.abs(dx) < Math.abs(dy)) return;
      courant.actif = true;
      evenement.currentTarget.setPointerCapture(evenement.pointerId);
    }
    const brut = courant.base + dx;
    setDecalageEnCours(
      Math.max(-LARGEUR_ACTION, Math.min(LARGEUR_ACTION, brut)),
    );
  }

  function surFin(evenement: PointerEvent<HTMLDivElement>) {
    const courant = geste.current;
    geste.current = null;
    if (!courant?.actif) return;
    aGlisse.current = true;
    const final = Math.max(
      -LARGEUR_ACTION,
      Math.min(LARGEUR_ACTION, courant.base + evenement.clientX - courant.x),
    );
    setOuvert(
      final <= -SEUIL_OUVERTURE
        ? "gauche"
        : final >= SEUIL_OUVERTURE
          ? "droite"
          : null,
    );
    setDecalageEnCours(null);
  }

  function surAnnulation() {
    geste.current = null;
    setDecalageEnCours(null);
  }

  // Supprime le clic fantôme qui suit un glissé ; ferme la carte ouverte au lieu de naviguer.
  function surClicCapture(evenement: React.MouseEvent<HTMLDivElement>) {
    if (aGlisse.current) {
      aGlisse.current = false;
      evenement.preventDefault();
      evenement.stopPropagation();
      return;
    }
    if (ouvert) {
      evenement.preventDefault();
      evenement.stopPropagation();
      setOuvert(null);
    }
  }

  return (
    <div className="relative overflow-x-clip rounded-[16px]">
      <button
        type="button"
        onClick={() => routeur.push(`/mes-annonces/${annonceId}`)}
        aria-hidden={ouvert !== "droite"}
        tabIndex={-1}
        className="absolute inset-y-0 left-0 flex items-center justify-center rounded-[16px] bg-[var(--harbor-bleu)] text-[13px] font-bold text-white"
        style={{ width: LARGEUR_ACTION }}
      >
        Modifier
      </button>
      <button
        type="button"
        aria-hidden={ouvert !== "gauche"}
        tabIndex={-1}
        onClick={() => {
          setOuvert(null);
          setSuppressionOuverte(true);
        }}
        className="absolute inset-y-0 right-0 flex items-center justify-center rounded-[16px] bg-[var(--harbor-erreur)] text-[13px] font-bold text-white"
        style={{ width: LARGEUR_ACTION }}
      >
        Supprimer
      </button>

      <div
        onPointerDown={surDebut}
        onPointerMove={surMouvement}
        onPointerUp={surFin}
        onPointerCancel={surAnnulation}
        onClickCapture={surClicCapture}
        onDragStart={(evenement) => evenement.preventDefault()}
        className="relative select-none"
        style={{
          touchAction: "pan-y",
          transform: `translateX(${decalage}px)`,
          transition:
            decalageEnCours === null ? "transform 120ms ease-out" : "none",
        }}
      >
        {children}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[16px] border-l-4 border-l-[var(--harbor-bleu)]"
          data-lisere="gauche"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[16px] border-r-4 border-r-[var(--harbor-erreur)]"
          data-lisere="droite"
        />
      </div>

      {suppressionOuverte && (
        <FenetreSuppression
          annonceId={annonceId}
          dates={datesSupprimables}
          estRecurrente={estRecurrente}
          surFermeture={() => setSuppressionOuverte(false)}
        />
      )}
    </div>
  );
}

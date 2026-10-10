"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { annulerAnnonce, annulerOccurrence } from "./actions";

type Resultat = { erreur: string } | { succes: true };
type Portee = "date" | "toutes";

export type DateAnnulable = { id: string; libelle: string };

// Menu « ⋯ » d'une carte de « Mes annonces ». Frère du lien de la carte (jamais dedans),
// donc cliquer dessus n'ouvre pas l'annonce.
export default function MenuAnnonce({
  annonceId,
  datesAnnulables,
  estRecurrente,
}: {
  annonceId: string;
  // Vide pour un brouillon ou quand toutes les dates sont déjà annulées : « Annuler » est alors absent.
  datesAnnulables: DateAnnulable[];
  estRecurrente: boolean;
}) {
  const [menuOuvert, setMenuOuvert] = useState(false);
  const [fenetreOuverte, setFenetreOuverte] = useState(false);
  const conteneur = useRef<HTMLDivElement>(null);
  const bouton = useRef<HTMLButtonElement>(null);
  const premiereEntree = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (!menuOuvert) return;
    premiereEntree.current?.focus();

    function surClicExterieur(evenement: MouseEvent) {
      if (!conteneur.current?.contains(evenement.target as Node)) {
        setMenuOuvert(false);
      }
    }
    function surTouche(evenement: KeyboardEvent) {
      if (evenement.key === "Escape") {
        setMenuOuvert(false);
        bouton.current?.focus();
      }
    }
    document.addEventListener("mousedown", surClicExterieur);
    document.addEventListener("keydown", surTouche);
    return () => {
      document.removeEventListener("mousedown", surClicExterieur);
      document.removeEventListener("keydown", surTouche);
    };
  }, [menuOuvert]);

  const peutAnnuler = datesAnnulables.length > 0;

  return (
    <div ref={conteneur} className="absolute right-2 top-2">
      <button
        ref={bouton}
        type="button"
        aria-label="Actions de l'annonce"
        aria-haspopup="menu"
        aria-expanded={menuOuvert}
        onClick={() => setMenuOuvert((ouvert) => !ouvert)}
        className="flex h-11 w-11 items-center justify-center rounded-[9999px] text-[18px] font-medium text-[var(--color-warm-cream)]"
      >
        ⋯
      </button>

      {menuOuvert && (
        <div
          role="menu"
          className="absolute right-0 top-full z-10 flex min-w-[160px] flex-col rounded-[12px] border border-[var(--color-cork-border)] bg-[var(--color-walnut-shadow)] py-1"
        >
          <Link
            ref={premiereEntree}
            href={`/mes-annonces/${annonceId}`}
            role="menuitem"
            className="px-4 py-3 text-[12px] font-medium uppercase text-[var(--color-warm-cream)] hover:underline focus:underline"
          >
            Modifier
          </Link>
          {peutAnnuler && (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setMenuOuvert(false);
                setFenetreOuverte(true);
              }}
              className="px-4 py-3 text-left text-[12px] font-medium uppercase text-[var(--color-warm-cream)] hover:underline focus:underline"
            >
              Annuler
            </button>
          )}
        </div>
      )}

      {fenetreOuverte && peutAnnuler && (
        <FenetreAnnulation
          annonceId={annonceId}
          datesAnnulables={datesAnnulables}
          estRecurrente={estRecurrente}
          surFermeture={() => {
            setFenetreOuverte(false);
            bouton.current?.focus();
          }}
        />
      )}
    </div>
  );
}

function FenetreAnnulation({
  annonceId,
  datesAnnulables,
  estRecurrente,
  surFermeture,
}: {
  annonceId: string;
  datesAnnulables: DateAnnulable[];
  estRecurrente: boolean;
  surFermeture: () => void;
}) {
  const fenetre = useRef<HTMLDialogElement>(null);
  const [portee, setPortee] = useState<Portee>("date");
  const [occurrenceId, setOccurrenceId] = useState(datesAnnulables[0]?.id ?? "");
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  // Avec une seule date annulable, les deux portées sont équivalentes : simple confirmation.
  const choixDePortee = estRecurrente && datesAnnulables.length > 1;

  useEffect(() => {
    fenetre.current?.showModal();
  }, []);

  async function confirmer() {
    setErreur(null);
    setEnCours(true);
    try {
      const resultat: Resultat =
        choixDePortee && portee === "date"
          ? await annulerOccurrence(occurrenceId)
          : await annulerAnnonce(annonceId);
      if ("erreur" in resultat) {
        setErreur(resultat.erreur);
        return;
      }
    } catch {
      // Réseau coupé, erreur serveur ou annonce supprimée entre-temps.
      setErreur("L'annulation a échoué. Réessayez.");
      return;
    } finally {
      setEnCours(false);
    }
    surFermeture();
  }

  return (
    <dialog
      ref={fenetre}
      aria-labelledby={`titre-annulation-${annonceId}`}
      onClose={surFermeture}
      className="m-auto w-[calc(100%-48px)] max-w-sm rounded-[12px] border border-[var(--color-cork-border)] bg-[var(--color-walnut-shadow)] p-6 text-[var(--color-warm-cream)] backdrop:bg-black/60"
    >
      <div className="flex flex-col gap-4">
        <h2
          id={`titre-annulation-${annonceId}`}
          className="text-[18px] font-medium uppercase leading-none"
        >
          Annuler l&apos;annonce ?
        </h2>

        {choixDePortee ? (
          <fieldset className="flex flex-col gap-3">
            <legend className="sr-only">Portée de l&apos;annulation</legend>
            <label className="flex items-center gap-2 text-[12px] font-medium uppercase">
              <input
                type="radio"
                name={`portee-${annonceId}`}
                checked={portee === "date"}
                onChange={() => setPortee("date")}
              />
              Cette date seulement
            </label>
            {portee === "date" && (
              <ul className="ml-6 flex flex-col gap-2">
                {datesAnnulables.map((date) => (
                  <li key={date.id}>
                    <label className="flex items-center gap-2 text-[12px] font-medium uppercase text-[color:var(--color-texte-secondaire)]">
                      <input
                        type="radio"
                        name={`date-${annonceId}`}
                        checked={occurrenceId === date.id}
                        onChange={() => setOccurrenceId(date.id)}
                      />
                      {date.libelle}
                    </label>
                  </li>
                ))}
              </ul>
            )}
            <label className="flex items-center gap-2 text-[12px] font-medium uppercase">
              <input
                type="radio"
                name={`portee-${annonceId}`}
                checked={portee === "toutes"}
                onChange={() => setPortee("toutes")}
              />
              Toutes les dates
            </label>
          </fieldset>
        ) : (
          <p className="text-[12px] font-medium uppercase text-[color:var(--color-texte-secondaire)]">
            {datesAnnulables.length > 1
              ? "Toutes les dates seront annulées."
              : `Date annulée : ${datesAnnulables[0]?.libelle ?? ""}.`}
          </p>
        )}

        {erreur && (
          <p
            role="alert"
            className="text-[10px] font-medium uppercase text-[var(--color-gold-elegance)]"
          >
            {erreur}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={confirmer}
            disabled={enCours}
            className="rounded-[22.5px] border border-[var(--color-warm-cream)] px-4 py-[7.5px] text-[12px] font-medium uppercase text-[var(--color-warm-cream)] disabled:opacity-60"
          >
            Annuler l&apos;annonce
          </button>
          <button
            type="button"
            onClick={() => fenetre.current?.close()}
            disabled={enCours}
            className="rounded-[22.5px] border-2 border-[var(--color-warm-cream)] px-4 py-[7.5px] text-[12px] font-medium uppercase text-[var(--color-warm-cream)] disabled:opacity-60"
          >
            ← Retour
          </button>
        </div>
      </div>
    </dialog>
  );
}

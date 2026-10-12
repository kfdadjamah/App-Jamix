"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { annulerAnnonce, annulerOccurrence, supprimerAnnonce, supprimerOccurrence } from "./actions";

type Resultat = { erreur: string } | { succes: true };
type Portee = "date" | "toutes";

export type DateAnnulable = { id: string; libelle: string };
export type DateSupprimable = DateAnnulable;

// Menu « ⋯ » d'une carte de « Mes annonces ». Frère du lien de la carte (jamais dedans),
// donc cliquer dessus n'ouvre pas l'annonce.
export default function MenuAnnonce({
  annonceId,
  datesAnnulables,
  datesSupprimables,
  estRecurrente,
}: {
  annonceId: string;
  // Vide pour un brouillon ou quand toutes les dates sont déjà annulées : « Annuler » est alors absent.
  datesAnnulables: DateAnnulable[];
  // Toutes les dates, annulées comprises.
  datesSupprimables: DateSupprimable[];
  estRecurrente: boolean;
}) {
  const [menuOuvert, setMenuOuvert] = useState(false);
  const [fenetreOuverte, setFenetreOuverte] = useState(false);
  const [suppressionOuverte, setSuppressionOuverte] = useState(false);
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
        className="flex h-11 w-11 items-center justify-center rounded-[9999px] text-[18px] font-semibold text-[var(--harbor-marine)] transition-colors duration-[120ms] active:bg-[var(--harbor-trait)]"
      >
        ⋯
      </button>

      {menuOuvert && (
        <div
          role="menu"
          className="absolute right-0 top-full z-10 flex min-w-[160px] flex-col rounded-[12px] border border-[var(--harbor-trait)] bg-white py-1"
        >
          <Link
            ref={premiereEntree}
            href={`/mes-annonces/${annonceId}`}
            role="menuitem"
            className="px-4 py-3 text-[13px] font-bold text-[var(--harbor-marine)] hover:underline focus:underline transition-colors duration-[120ms] active:bg-[var(--harbor-trait)]"
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
              className="px-4 py-3 text-left text-[13px] font-bold text-[var(--harbor-erreur)] hover:underline focus:underline transition-colors duration-[120ms] active:bg-[var(--harbor-erreur-voile)]"
            >
              Annuler
            </button>
          )}
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setMenuOuvert(false);
              setSuppressionOuverte(true);
            }}
            className="px-4 py-3 text-left text-[13px] font-bold text-[var(--harbor-erreur)] hover:underline focus:underline transition-colors duration-[120ms] active:bg-[var(--harbor-erreur-voile)]"
          >
            Supprimer
          </button>
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

      {suppressionOuverte && (
        <FenetreSuppression
          annonceId={annonceId}
          dates={datesSupprimables}
          estRecurrente={estRecurrente}
          surFermeture={() => {
            setSuppressionOuverte(false);
            bouton.current?.focus();
          }}
        />
      )}
    </div>
  );
}

export function FenetreSuppression({
  annonceId,
  dates,
  estRecurrente,
  surFermeture,
}: {
  annonceId: string;
  dates: DateSupprimable[];
  estRecurrente: boolean;
  surFermeture: () => void;
}) {
  const fenetre = useRef<HTMLDialogElement>(null);
  const [portee, setPortee] = useState<Portee>("date");
  const [occurrenceId, setOccurrenceId] = useState(dates[0]?.id ?? "");
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  // Une seule date : les deux portées sont équivalentes, simple confirmation.
  const choixDePortee = estRecurrente && dates.length > 1;

  useEffect(() => {
    fenetre.current?.showModal();
  }, []);

  async function confirmer() {
    setErreur(null);
    setEnCours(true);
    try {
      const resultat: Resultat =
        choixDePortee && portee === "date"
          ? await supprimerOccurrence(occurrenceId)
          : await supprimerAnnonce(annonceId);
      if ("erreur" in resultat) {
        setErreur(resultat.erreur);
        return;
      }
    } catch {
      setErreur("La suppression a échoué. Réessayez.");
      return;
    } finally {
      setEnCours(false);
    }
    surFermeture();
  }

  return (
    <dialog
      ref={fenetre}
      aria-labelledby={`titre-suppression-${annonceId}`}
      onClose={surFermeture}
      className="m-auto w-[calc(100%-48px)] max-w-sm rounded-[12px] border border-[var(--harbor-trait)] bg-white p-6 text-[var(--harbor-marine)] backdrop:bg-black/60"
    >
      <div className="flex flex-col gap-4">
        <h2
          id={`titre-suppression-${annonceId}`}
          className="text-[18px] font-semibold leading-none"
        >
          Supprimer l&apos;annonce ?
        </h2>
        <p className="text-[12px] font-semibold text-[var(--harbor-marine-2)]">
          Cette suppression est définitive.
        </p>

        {choixDePortee && (
          <fieldset className="flex flex-col gap-3">
            <legend className="sr-only">Portée de la suppression</legend>
            <label className="flex items-center gap-2 text-[12px] font-medium">
              <input
                type="radio"
                name={`portee-suppression-${annonceId}`}
                checked={portee === "date"}
                onChange={() => setPortee("date")}
              />
              Cette date seulement
            </label>
            {portee === "date" && (
              <ul className="ml-6 flex flex-col gap-2">
                {dates.map((date) => (
                  <li key={date.id}>
                    <label className="flex items-center gap-2 text-[12px] font-semibold text-[var(--harbor-marine-2)]">
                      <input
                        type="radio"
                        name={`date-suppression-${annonceId}`}
                        checked={occurrenceId === date.id}
                        onChange={() => setOccurrenceId(date.id)}
                      />
                      {date.libelle}
                    </label>
                  </li>
                ))}
              </ul>
            )}
            <label className="flex items-center gap-2 text-[12px] font-medium">
              <input
                type="radio"
                name={`portee-suppression-${annonceId}`}
                checked={portee === "toutes"}
                onChange={() => setPortee("toutes")}
              />
              Toutes les dates
            </label>
          </fieldset>
        )}

        {erreur && (
          <p role="alert" className="text-[13px] font-semibold text-[var(--harbor-erreur)]">
            {erreur}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={confirmer}
            disabled={enCours}
            className="rounded-[12px] px-4 py-2 text-[13px] font-bold bg-[var(--harbor-erreur)] text-white transition-colors duration-[120ms] hover:bg-[color-mix(in_srgb,var(--harbor-erreur),black_10%)] active:bg-[color-mix(in_srgb,var(--harbor-erreur),black_20%)] disabled:opacity-60"
          >
            Supprimer définitivement
          </button>
          <button
            type="button"
            onClick={() => fenetre.current?.close()}
            disabled={enCours}
            className="rounded-[12px] border border-[var(--harbor-trait)] bg-white px-4 py-2 text-[13px] font-bold text-[var(--harbor-marine)] transition-colors duration-[120ms] hover:bg-[var(--harbor-voile)] active:border-[var(--harbor-bleu-clair)] active:bg-[var(--harbor-voile)] disabled:opacity-60"
          >
            ← Retour
          </button>
        </div>
      </div>
    </dialog>
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
      className="m-auto w-[calc(100%-48px)] max-w-sm rounded-[12px] border border-[var(--harbor-trait)] bg-white p-6 text-[var(--harbor-marine)] backdrop:bg-black/60"
    >
      <div className="flex flex-col gap-4">
        <h2
          id={`titre-annulation-${annonceId}`}
          className="text-[18px] font-semibold leading-none"
        >
          Annuler l&apos;annonce ?
        </h2>

        {choixDePortee ? (
          <fieldset className="flex flex-col gap-3">
            <legend className="sr-only">Portée de l&apos;annulation</legend>
            <label className="flex items-center gap-2 text-[12px] font-medium">
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
                    <label className="flex items-center gap-2 text-[12px] font-semibold text-[var(--harbor-marine-2)]">
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
            <label className="flex items-center gap-2 text-[12px] font-medium">
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
          <p className="text-[12px] font-semibold text-[var(--harbor-marine-2)]">
            {datesAnnulables.length > 1
              ? "Toutes les dates seront annulées."
              : `Date annulée : ${datesAnnulables[0]?.libelle ?? ""}.`}
          </p>
        )}

        {erreur && (
          <p
            role="alert"
            className="text-[13px] font-semibold text-[var(--harbor-erreur)]"
          >
            {erreur}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={confirmer}
            disabled={enCours}
            className="rounded-[12px] px-4 py-2 text-[13px] font-bold bg-[var(--harbor-erreur)] text-white transition-colors duration-[120ms] hover:bg-[color-mix(in_srgb,var(--harbor-erreur),black_10%)] active:bg-[color-mix(in_srgb,var(--harbor-erreur),black_20%)] disabled:opacity-60"
          >
            Annuler l&apos;annonce
          </button>
          <button
            type="button"
            onClick={() => fenetre.current?.close()}
            disabled={enCours}
            className="rounded-[12px] border border-[var(--harbor-trait)] bg-white px-4 py-2 text-[13px] font-bold text-[var(--harbor-marine)] transition-colors duration-[120ms] hover:bg-[var(--harbor-voile)] active:border-[var(--harbor-bleu-clair)] active:bg-[var(--harbor-voile)] disabled:opacity-60"
          >
            ← Retour
          </button>
        </div>
      </div>
    </dialog>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { messageSuppressionBar, nomBarCorrespond } from "@/lib/bars";
import ChampFormulaire from "@/components/champ-formulaire";
import { supprimerBar } from "./actions";

// Fenêtre de suppression d'un bar (DESIGN.md) : même aspect que FenetreSortie, mais l'action
// par défaut est « Annuler » : Échap et clic hors fenêtre ne suppriment jamais.
export default function FenetreSuppressionBar({
  barId,
  nomBar,
  nombreAnnonces,
  datesAVenirPubliees,
  surAnnuler,
  surSuppression,
}: {
  barId: string;
  nomBar: string;
  nombreAnnonces: number;
  datesAVenirPubliees: number;
  surAnnuler: () => void;
  surSuppression: () => void;
}) {
  const refDialog = useRef<HTMLDialogElement>(null);
  const refChamp = useRef<HTMLInputElement>(null);
  const [nomSaisi, setNomSaisi] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    const dialog = refDialog.current;
    if (!dialog) return;
    dialog.showModal();
    refChamp.current?.focus();
    return () => dialog.close();
  }, []);

  function annuler() {
    if (!enCours) surAnnuler();
  }

  async function supprimer() {
    setErreur(null);
    setEnCours(true);
    try {
      const resultat = await supprimerBar(barId, nomSaisi);
      if ("erreur" in resultat) {
        setErreur(resultat.erreur);
        setEnCours(false);
        return;
      }
    } catch {
      setErreur("La suppression a échoué. Réessayez.");
      setEnCours(false);
      return;
    }
    surSuppression();
  }

  const nomValide = nomBarCorrespond(nomSaisi, nomBar);

  return (
    <dialog
      ref={refDialog}
      aria-labelledby="fenetre-suppression-bar-titre"
      onCancel={(e) => {
        e.preventDefault();
        annuler();
      }}
      onClick={(e) => {
        if (e.target === refDialog.current) annuler();
      }}
      className="fenetre-sortie m-auto w-[calc(100%-32px)] max-w-md rounded-[12px] border border-[var(--color-cork-border)] bg-[var(--color-walnut-shadow)] p-0 text-[var(--color-warm-cream)]"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (nomValide && !enCours) supprimer();
        }}
        className="flex flex-col gap-6 p-6"
      >
        <h2
          id="fenetre-suppression-bar-titre"
          className="text-[18px] font-medium uppercase leading-none text-[var(--color-warm-cream)]"
        >
          Supprimer {nomBar}
        </h2>
        <p className="text-[15px] text-[var(--color-warm-cream)]">
          {messageSuppressionBar(nombreAnnonces, datesAVenirPubliees)}
        </p>

        <ChampFormulaire label="Saisissez le nom du bar pour confirmer">
          <input
            ref={refChamp}
            type="text"
            autoComplete="off"
            value={nomSaisi}
            onChange={(e) => setNomSaisi(e.target.value)}
            disabled={enCours}
            className="champ-input"
          />
        </ChampFormulaire>

        {erreur && (
          <p className="text-[12px] font-medium uppercase text-[var(--color-gold-elegance)]">
            {erreur}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-4">
          <button
            type="submit"
            disabled={!nomValide || enCours}
            className="rounded-[36px] bg-[var(--color-brass-copper)] px-6 py-[14px] text-[12px] font-medium uppercase text-[var(--color-warm-cream)] disabled:opacity-60"
          >
            {enCours ? "Suppression…" : "Supprimer définitivement"}
          </button>
          <button
            type="button"
            onClick={annuler}
            disabled={enCours}
            className="rounded-[22.5px] border border-[var(--color-warm-cream)] px-4 py-[7.5px] text-[12px] font-medium uppercase text-[var(--color-warm-cream)] disabled:opacity-60"
          >
            Annuler
          </button>
        </div>
      </form>
    </dialog>
  );
}

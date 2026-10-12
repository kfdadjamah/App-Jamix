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
      className="fenetre-sortie m-auto w-[calc(100%-32px)] max-w-md rounded-[12px] border border-[var(--harbor-trait)] bg-white p-0 text-[var(--harbor-marine)]"
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
          className="text-[18px] font-semibold leading-none text-[var(--harbor-marine)]"
        >
          Supprimer {nomBar}
        </h2>
        <p className="text-[15px] text-[var(--harbor-marine)]">
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
          <p className="text-[13px] font-semibold text-[var(--harbor-erreur)]">
            {erreur}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-4">
          <button
            type="submit"
            disabled={!nomValide || enCours}
            className="rounded-[12px] px-6 py-3 text-[14px] font-bold bg-[var(--harbor-erreur)] text-white transition-colors duration-[120ms] hover:bg-[color-mix(in_srgb,var(--harbor-erreur),black_10%)] active:bg-[color-mix(in_srgb,var(--harbor-erreur),black_20%)] disabled:opacity-60"
          >
            {enCours ? "Suppression…" : "Supprimer définitivement"}
          </button>
          <button
            type="button"
            onClick={annuler}
            disabled={enCours}
            className="rounded-[12px] border border-[var(--harbor-trait)] bg-white px-4 py-2 text-[13px] font-bold text-[var(--harbor-marine)] transition-colors duration-[120ms] hover:bg-[var(--harbor-voile)] active:border-[var(--harbor-bleu-clair)] active:bg-[var(--harbor-voile)] disabled:opacity-60"
          >
            Annuler
          </button>
        </div>
      </form>
    </dialog>
  );
}

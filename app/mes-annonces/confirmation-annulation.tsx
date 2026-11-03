"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type Resultat = { erreur: string } | { succes: true };

type PropsContenu = {
  id: string;
  titre: string;
  // Rappel de ce qui sera annulé (date précise ou toutes les dates).
  recapitulatif: ReactNode;
  action: () => Promise<Resultat>;
  surRetour: () => void;
  // Appelé une fois l'annulation appliquée.
  surTermine: () => void;
};

// Corps de la validation finale, sans fenêtre : réutilisé tel quel comme seconde étape
// de la fenêtre d'annulation du menu « ⋯ ».
export function ContenuConfirmationAnnulation({
  id,
  titre,
  recapitulatif,
  action,
  surRetour,
  surTermine,
}: PropsContenu) {
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function confirmer() {
    setErreur(null);
    setEnCours(true);
    try {
      const resultat = await action();
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
    surTermine();
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 id={id} className="text-[18px] font-semibold leading-none">
        {titre}
      </h2>
      <div className="flex flex-col gap-1 text-[12px] font-semibold text-[var(--harbor-marine-2)]">
        <p>{recapitulatif}</p>
        <p>Cette action est définitive.</p>
      </div>

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
          Oui, annuler
        </button>
        <button
          type="button"
          onClick={surRetour}
          disabled={enCours}
          className="rounded-[12px] border border-[var(--harbor-trait)] bg-white px-4 py-2 text-[13px] font-bold text-[var(--harbor-marine)] transition-colors duration-[120ms] hover:bg-[var(--harbor-voile)] active:border-[var(--harbor-bleu-clair)] active:bg-[var(--harbor-voile)] disabled:opacity-60"
        >
          ← Retour
        </button>
      </div>
    </div>
  );
}

// Fenêtre autonome : « Annuler cette date » et « Annuler toutes les dates » de la page de modification.
export default function ConfirmationAnnulation({
  id,
  titre,
  recapitulatif,
  action,
  surFermeture,
}: Omit<PropsContenu, "surRetour" | "surTermine"> & { surFermeture: () => void }) {
  const fenetre = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    fenetre.current?.showModal();
  }, []);

  return (
    <dialog
      ref={fenetre}
      aria-labelledby={id}
      onClose={surFermeture}
      className="m-auto w-[calc(100%-48px)] max-w-sm rounded-[12px] border border-[var(--harbor-trait)] bg-white p-6 text-[var(--harbor-marine)] backdrop:bg-black/60"
    >
      <ContenuConfirmationAnnulation
        id={id}
        titre={titre}
        recapitulatif={recapitulatif}
        action={action}
        surRetour={() => fenetre.current?.close()}
        surTermine={() => fenetre.current?.close()}
      />
    </dialog>
  );
}

"use client";

import { useEffect, useRef } from "react";

// Fenêtre modale (DESIGN.md) : Walnut Shadow, bordure Cork Border, rayon 12px, sans ombre,
// un seul bouton plein (l'action par défaut, qui reçoit le focus), l'autre en fantôme.
// Échap et clic hors fenêtre déclenchent l'action par défaut.
export default function FenetreSortie({
  titre,
  message,
  libelleDefaut,
  surDefaut,
  libelleSecondaire,
  surSecondaire,
}: {
  titre: string;
  message: React.ReactNode;
  libelleDefaut: string;
  surDefaut: () => void;
  libelleSecondaire?: string;
  surSecondaire?: () => void;
}) {
  const refDialog = useRef<HTMLDialogElement>(null);
  const refBoutonDefaut = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const dialog = refDialog.current;
    if (!dialog) return;
    dialog.showModal();
    refBoutonDefaut.current?.focus();
    return () => dialog.close();
  }, []);

  return (
    <dialog
      ref={refDialog}
      aria-labelledby="fenetre-sortie-titre"
      onCancel={(e) => {
        e.preventDefault();
        surDefaut();
      }}
      onClick={(e) => {
        if (e.target === refDialog.current) surDefaut();
      }}
      className="fenetre-sortie m-auto w-[calc(100%-32px)] max-w-md rounded-[12px] border border-[var(--harbor-trait)] bg-white p-0 text-[var(--harbor-marine)]"
    >
      <div className="flex flex-col gap-6 p-6">
        <h2
          id="fenetre-sortie-titre"
          className="text-[18px] font-semibold leading-none text-[var(--harbor-marine)]"
        >
          {titre}
        </h2>
        <div className="text-[15px] text-[var(--harbor-marine)]">{message}</div>
        <div className="flex flex-wrap items-center gap-4">
          <button
            ref={refBoutonDefaut}
            type="button"
            onClick={surDefaut}
            className="rounded-[12px] bg-[var(--harbor-bleu)] px-6 py-3 text-[14px] font-bold text-white transition-colors duration-[120ms] hover:bg-[var(--harbor-marine)]"
          >
            {libelleDefaut}
          </button>
          {libelleSecondaire && surSecondaire && (
            <button
              type="button"
              onClick={surSecondaire}
              className="rounded-[12px] border border-[var(--harbor-trait)] bg-white px-4 py-2 text-[13px] font-bold text-[var(--harbor-marine)] transition-colors duration-[120ms] hover:bg-[var(--harbor-voile)]"
            >
              {libelleSecondaire}
            </button>
          )}
        </div>
      </div>
    </dialog>
  );
}

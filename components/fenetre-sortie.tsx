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
      className="fenetre-sortie m-auto w-[calc(100%-32px)] max-w-md rounded-[12px] border border-[var(--color-cork-border)] bg-[var(--color-walnut-shadow)] p-0 text-[var(--color-warm-cream)]"
    >
      <div className="flex flex-col gap-6 p-6">
        <h2
          id="fenetre-sortie-titre"
          className="text-[18px] font-medium uppercase leading-none text-[var(--color-warm-cream)]"
        >
          {titre}
        </h2>
        <div className="text-[15px] text-[var(--color-warm-cream)]">{message}</div>
        <div className="flex flex-wrap items-center gap-4">
          <button
            ref={refBoutonDefaut}
            type="button"
            onClick={surDefaut}
            className="rounded-[36px] bg-[var(--color-brass-copper)] px-6 py-[14px] text-[12px] font-medium uppercase text-[var(--color-warm-cream)]"
          >
            {libelleDefaut}
          </button>
          {libelleSecondaire && surSecondaire && (
            <button
              type="button"
              onClick={surSecondaire}
              className="rounded-[22.5px] border border-[var(--color-warm-cream)] px-4 py-[7.5px] text-[12px] font-medium uppercase text-[var(--color-warm-cream)]"
            >
              {libelleSecondaire}
            </button>
          )}
        </div>
      </div>
    </dialog>
  );
}

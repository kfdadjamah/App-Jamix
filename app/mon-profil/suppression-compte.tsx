"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  MOT_CONFIRMATION_SUPPRESSION,
  schemaSuppressionCompte,
  type ChampsSuppressionCompte,
} from "@/lib/validation/inscription";
import ChampFormulaire from "@/components/champ-formulaire";
import { supprimerCompte } from "./actions";

const CLASSES_BOUTON_FANTOME =
  "self-start rounded-[22.5px] border border-[var(--color-warm-cream)] px-4 py-[7.5px] text-[12px] font-medium uppercase text-[var(--color-warm-cream)] disabled:opacity-60";

export default function SuppressionCompte() {
  const [ouvert, setOuvert] = useState(false);
  const [erreurServeur, setErreurServeur] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChampsSuppressionCompte>({
    resolver: zodResolver(schemaSuppressionCompte),
  });

  async function surSoumission(donnees: ChampsSuppressionCompte) {
    setErreurServeur(null);

    const formData = new FormData();
    formData.set("motDePasseActuel", donnees.motDePasseActuel);
    formData.set("confirmation", donnees.confirmation);

    // En cas de succès, l'action déconnecte et redirige vers « / ».
    const resultat = await supprimerCompte(formData);
    if (resultat && "erreur" in resultat) {
      setErreurServeur(resultat.erreur);
    }
  }

  function annuler() {
    setOuvert(false);
    setErreurServeur(null);
    reset();
  }

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-[24px] font-medium uppercase leading-[1.09] text-[var(--color-warm-cream)]">
          Supprimer mon compte
        </h2>
        <p className="text-[15px] leading-[1.26] text-[var(--color-driftwood)]">
          Votre bar, vos annonces, leurs dates et leurs photos seront supprimés
          définitivement. Cette action est irréversible.
        </p>
      </div>

      {!ouvert ? (
        <button type="button" onClick={() => setOuvert(true)} className={CLASSES_BOUTON_FANTOME}>
          Supprimer mon compte
        </button>
      ) : (
        <form onSubmit={handleSubmit(surSoumission)} className="flex flex-col gap-6" noValidate>
          <ChampFormulaire label="Mot de passe actuel" erreur={errors.motDePasseActuel?.message}>
            <input
              type="password"
              autoComplete="current-password"
              {...register("motDePasseActuel")}
              className="champ-input"
            />
          </ChampFormulaire>

          <ChampFormulaire
            label={`Saisissez ${MOT_CONFIRMATION_SUPPRESSION} pour confirmer`}
            erreur={errors.confirmation?.message}
          >
            <input
              type="text"
              autoComplete="off"
              {...register("confirmation")}
              className="champ-input"
            />
          </ChampFormulaire>

          {erreurServeur && (
            <p className="text-[12px] font-medium uppercase text-[var(--color-gold-elegance)]">
              {erreurServeur}
            </p>
          )}

          <div className="flex gap-3">
            <button type="submit" disabled={isSubmitting} className={CLASSES_BOUTON_FANTOME}>
              {isSubmitting ? "Suppression…" : "Supprimer définitivement"}
            </button>
            <button
              type="button"
              onClick={annuler}
              disabled={isSubmitting}
              className="text-[12px] font-medium uppercase text-[var(--color-warm-cream)] underline disabled:opacity-60"
            >
              Annuler
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

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

export default function SuppressionCompte() {
  const [erreurServeur, setErreurServeur] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
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

  return (
    <>
      <p className="text-[15px] leading-[1.26] text-[var(--color-driftwood)]">
        Vos bars, vos annonces, leurs dates et leurs photos seront supprimés
        définitivement. Cette action est irréversible.
      </p>

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

        <button
          type="submit"
          disabled={isSubmitting}
          className="self-start rounded-[22.5px] border border-[var(--color-warm-cream)] px-4 py-[7.5px] text-[12px] font-medium uppercase text-[var(--color-warm-cream)] disabled:opacity-60"
        >
          {isSubmitting ? "Suppression…" : "Supprimer définitivement"}
        </button>
      </form>
    </>
  );
}

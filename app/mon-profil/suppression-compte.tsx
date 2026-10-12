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
      <p className="text-[15px] leading-[1.26] text-[var(--harbor-marine-2)]">
        Vos bars, vos annonces, leurs dates et leurs photos seront supprimés
        définitivement. Cette action est irréversible.
      </p>

      <form onSubmit={handleSubmit(surSoumission)} className="flex flex-col gap-4" noValidate>
        <ChampFormulaire label="Mot de passe actuel" erreur={errors.motDePasseActuel?.message}>
          <input
            type="password"
            autoComplete="current-password"
            placeholder="Mot de passe actuel"
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
            placeholder={`Saisissez ${MOT_CONFIRMATION_SUPPRESSION} pour confirmer`}
            {...register("confirmation")}
            className="champ-input"
          />
        </ChampFormulaire>

        {erreurServeur && (
          <p className="text-[13px] font-semibold text-[var(--harbor-erreur)]">
            {erreurServeur}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="self-start rounded-[12px] border border-[var(--harbor-trait)] bg-white px-4 py-2 text-[13px] font-bold text-[var(--harbor-marine)] transition-colors duration-[120ms] hover:bg-[var(--harbor-voile)] active:border-[var(--harbor-bleu-clair)] active:bg-[var(--harbor-voile)] disabled:opacity-60"
        >
          {isSubmitting ? "Suppression…" : "Supprimer définitivement"}
        </button>
      </form>
    </>
  );
}

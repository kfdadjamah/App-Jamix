"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  schemaChangementMotDePasse,
  type ChampsChangementMotDePasse,
} from "@/lib/validation/inscription";
import ChampFormulaire from "@/components/champ-formulaire";
import { changerMotDePasse } from "./actions";

export default function FormulaireMotDePasse() {
  const [erreurServeur, setErreurServeur] = useState<string | null>(null);
  const [succes, setSucces] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChampsChangementMotDePasse>({
    resolver: zodResolver(schemaChangementMotDePasse),
  });

  async function surSoumission(donnees: ChampsChangementMotDePasse) {
    setErreurServeur(null);
    setSucces(false);

    const formData = new FormData();
    formData.set("motDePasseActuel", donnees.motDePasseActuel);
    formData.set("nouveauMotDePasse", donnees.nouveauMotDePasse);
    formData.set("confirmation", donnees.confirmation);

    const resultat = await changerMotDePasse(formData);
    if ("erreur" in resultat) {
      setErreurServeur(resultat.erreur);
    } else {
      setSucces(true);
      reset();
    }
  }

  return (
    <form onSubmit={handleSubmit(surSoumission)} className="flex flex-col gap-4" noValidate>
      <ChampFormulaire label="Mot de passe actuel" erreur={errors.motDePasseActuel?.message}>
        <input
          type="password"
          autoComplete="current-password"
          {...register("motDePasseActuel")}
          className="champ-input"
        />
      </ChampFormulaire>

      <ChampFormulaire label="Nouveau mot de passe" erreur={errors.nouveauMotDePasse?.message}>
        <input
          type="password"
          autoComplete="new-password"
          {...register("nouveauMotDePasse")}
          className="champ-input"
        />
      </ChampFormulaire>

      <ChampFormulaire label="Confirmation" erreur={errors.confirmation?.message}>
        <input
          type="password"
          autoComplete="new-password"
          {...register("confirmation")}
          className="champ-input"
        />
      </ChampFormulaire>

      {erreurServeur && (
        <p className="text-[13px] font-semibold text-[var(--harbor-erreur)]">
          {erreurServeur}
        </p>
      )}
      {succes && (
        <p className="text-[13px] font-bold text-[var(--harbor-marine)]">
          Mot de passe modifié.
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="self-start rounded-[12px] border border-[var(--harbor-trait)] bg-white px-4 py-2 text-[13px] font-bold text-[var(--harbor-marine)] transition-colors duration-[120ms] hover:bg-[var(--harbor-voile)] disabled:opacity-60"
      >
        {isSubmitting ? "Enregistrement…" : "Changer de mot de passe"}
      </button>
    </form>
  );
}

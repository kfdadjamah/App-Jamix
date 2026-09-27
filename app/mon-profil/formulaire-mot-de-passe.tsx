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
    <section className="flex flex-col gap-6">
      <h2 className="text-[24px] font-medium uppercase leading-[1.09] text-[var(--color-warm-cream)]">
        Mot de passe
      </h2>

      <form onSubmit={handleSubmit(surSoumission)} className="flex flex-col gap-6" noValidate>
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
          <p className="text-[12px] font-medium uppercase text-[var(--color-gold-elegance)]">
            {erreurServeur}
          </p>
        )}
        {succes && (
          <p className="text-[12px] font-medium uppercase text-[var(--color-warm-cream)]">
            Mot de passe modifié.
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="self-start rounded-[22.5px] border border-[var(--color-warm-cream)] px-4 py-[7.5px] text-[12px] font-medium uppercase text-[var(--color-warm-cream)] disabled:opacity-60"
        >
          {isSubmitting ? "Enregistrement…" : "Changer de mot de passe"}
        </button>
      </form>
    </section>
  );
}

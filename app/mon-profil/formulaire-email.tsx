"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  schemaChangementEmail,
  type ChampsChangementEmail,
} from "@/lib/validation/inscription";
import ChampFormulaire from "@/components/champ-formulaire";
import { changerEmail } from "./actions";

export default function FormulaireEmail() {
  const [erreurServeur, setErreurServeur] = useState<string | null>(null);
  const [succes, setSucces] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChampsChangementEmail>({
    resolver: zodResolver(schemaChangementEmail),
  });

  async function surSoumission(donnees: ChampsChangementEmail) {
    setErreurServeur(null);
    setSucces(false);

    const formData = new FormData();
    formData.set("nouvelEmail", donnees.nouvelEmail);
    formData.set("motDePasseActuel", donnees.motDePasseActuel);

    const resultat = await changerEmail(formData);
    if ("erreur" in resultat) {
      setErreurServeur(resultat.erreur);
    } else {
      setSucces(true);
      reset();
    }
  }

  return (
    <form onSubmit={handleSubmit(surSoumission)} className="flex flex-col gap-6" noValidate>
      <ChampFormulaire label="Nouvel email" erreur={errors.nouvelEmail?.message}>
        <input
          type="email"
          autoComplete="email"
          {...register("nouvelEmail")}
          className="champ-input"
        />
      </ChampFormulaire>

      <ChampFormulaire label="Mot de passe actuel" erreur={errors.motDePasseActuel?.message}>
        <input
          type="password"
          autoComplete="current-password"
          {...register("motDePasseActuel")}
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
          Email modifié.
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="self-start rounded-[22.5px] border border-[var(--color-warm-cream)] px-4 py-[7.5px] text-[12px] font-medium uppercase text-[var(--color-warm-cream)] disabled:opacity-60"
      >
        {isSubmitting ? "Enregistrement…" : "Changer d'email"}
      </button>
    </form>
  );
}

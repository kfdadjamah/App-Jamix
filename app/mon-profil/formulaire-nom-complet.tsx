"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  schemaNomComplet,
  schemaNomCompletVideAutorise,
  type ChampsNomComplet,
} from "@/lib/validation/inscription";
import ChampFormulaire from "@/components/champ-formulaire";
import { changerNomComplet } from "./actions";

export default function FormulaireNomComplet({ nomActuel }: { nomActuel: string | null }) {
  const [erreurServeur, setErreurServeur] = useState<string | null>(null);
  const [succes, setSucces] = useState(false);
  // Le vide n'est accepté que pour un compte sans nom (le serveur applique la même règle).
  const [aUnNom, setAUnNom] = useState(Boolean(nomActuel));

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ChampsNomComplet>({
    defaultValues: { nomComplet: nomActuel ?? "" },
    resolver: zodResolver(aUnNom ? schemaNomComplet : schemaNomCompletVideAutorise),
  });

  async function surSoumission(donnees: ChampsNomComplet) {
    setErreurServeur(null);
    setSucces(false);

    const formData = new FormData();
    formData.set("nomComplet", donnees.nomComplet);

    const resultat = await changerNomComplet(formData);
    if ("erreur" in resultat) {
      setErreurServeur(resultat.erreur);
    } else {
      setSucces(true);
      if (donnees.nomComplet.trim() !== "") setAUnNom(true);
    }
  }

  return (
    <form onSubmit={handleSubmit(surSoumission)} className="flex flex-col gap-6" noValidate>
      <ChampFormulaire label="Nom et prénom" erreur={errors.nomComplet?.message}>
        <input
          type="text"
          autoComplete="name"
          {...register("nomComplet")}
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
          Nom et prénom enregistrés.
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="self-start rounded-[22.5px] border border-[var(--color-warm-cream)] px-4 py-[7.5px] text-[12px] font-medium uppercase text-[var(--color-warm-cream)] disabled:opacity-60"
      >
        {isSubmitting ? "Enregistrement…" : "Enregistrer"}
      </button>
    </form>
  );
}

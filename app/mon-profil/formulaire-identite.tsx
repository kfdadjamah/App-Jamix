"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  schemaIdentite,
  schemaIdentiteSansPrenom,
  type ChampsIdentite,
} from "@/lib/validation/inscription";
import ChampFormulaire from "@/components/champ-formulaire";
import { changerIdentite } from "./actions";

export default function FormulaireIdentite({
  prenomActuel,
  nomActuel,
}: {
  prenomActuel: string | null;
  nomActuel: string | null;
}) {
  const [erreurServeur, setErreurServeur] = useState<string | null>(null);
  const [succes, setSucces] = useState(false);
  // Sans prénom, seul le prénom est exigé (le serveur applique la même règle).
  const [aUnPrenom, setAUnPrenom] = useState(Boolean(prenomActuel));

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ChampsIdentite>({
    defaultValues: { prenom: prenomActuel ?? "", nom: nomActuel ?? "" },
    resolver: zodResolver(aUnPrenom ? schemaIdentite : schemaIdentiteSansPrenom),
  });

  async function surSoumission(donnees: ChampsIdentite) {
    setErreurServeur(null);
    setSucces(false);

    const formData = new FormData();
    formData.set("prenom", donnees.prenom);
    formData.set("nom", donnees.nom);

    const resultat = await changerIdentite(formData);
    if ("erreur" in resultat) {
      setErreurServeur(resultat.erreur);
    } else {
      setSucces(true);
      if (donnees.prenom.trim() !== "") setAUnPrenom(true);
    }
  }

  return (
    <form onSubmit={handleSubmit(surSoumission)} className="flex flex-col gap-4" noValidate>
      <ChampFormulaire label="Prénom" erreur={errors.prenom?.message}>
        <input
          type="text"
          autoComplete="given-name"
          placeholder="Prénom"
          {...register("prenom")}
          className="champ-input"
        />
      </ChampFormulaire>

      <ChampFormulaire label="Nom" erreur={errors.nom?.message}>
        <input
          type="text"
          autoComplete="family-name"
          placeholder="Nom"
          {...register("nom")}
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
          Nom et prénom enregistrés.
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="self-start rounded-[12px] border border-[var(--harbor-trait)] bg-white px-4 py-2 text-[13px] font-bold text-[var(--harbor-marine)] transition-colors duration-[120ms] hover:bg-[var(--harbor-voile)] active:border-[var(--harbor-bleu-clair)] active:bg-[var(--harbor-voile)] disabled:opacity-60"
      >
        {isSubmitting ? "Enregistrement…" : "Enregistrer"}
      </button>
    </form>
  );
}

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { schemaFicheBar, type ChampsFicheBar } from "@/lib/validation/inscription";
import ChampFormulaire from "@/components/champ-formulaire";
import { AVERTISSEMENT_ADRESSE_INTROUVABLE } from "@/lib/bars";
import { mettreAJourFicheBar } from "./actions";

export default function FormulaireFicheBar({
  barId,
  nom,
  adresse,
  actionDroite,
}: {
  barId: string;
  nom: string;
  adresse: string;
  // Affichée à droite d'« Enregistrer », sur la même ligne (ex. « Supprimer ce bar »).
  actionDroite?: React.ReactNode;
}) {
  const [erreurServeur, setErreurServeur] = useState<string | null>(null);
  const [succes, setSucces] = useState(false);
  const [adresseIntrouvable, setAdresseIntrouvable] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ChampsFicheBar>({
    resolver: zodResolver(schemaFicheBar),
    defaultValues: { nomBar: nom, adresseBar: adresse },
  });

  async function surSoumission(donnees: ChampsFicheBar) {
    setErreurServeur(null);
    setSucces(false);
    setAdresseIntrouvable(false);

    const formData = new FormData();
    formData.set("nomBar", donnees.nomBar);
    formData.set("adresseBar", donnees.adresseBar);

    const resultat = await mettreAJourFicheBar(barId, formData);
    if ("erreur" in resultat) {
      setErreurServeur(resultat.erreur);
    } else {
      setSucces(true);
      setAdresseIntrouvable(resultat.adresseIntrouvable);
    }
  }

  return (
    <form onSubmit={handleSubmit(surSoumission)} className="flex flex-col gap-6" noValidate>
      <ChampFormulaire label="Nom du bar" erreur={errors.nomBar?.message}>
        <input type="text" {...register("nomBar")} className="champ-input" />
      </ChampFormulaire>

      <ChampFormulaire label="Adresse du bar" erreur={errors.adresseBar?.message}>
        <input
          type="text"
          placeholder="12 rue de la République, Lyon"
          {...register("adresseBar")}
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
          Fiche bar enregistrée.
        </p>
      )}
      {adresseIntrouvable && (
        <p className="text-[12px] font-medium uppercase text-[var(--color-gold-elegance)]">
          {AVERTISSEMENT_ADRESSE_INTROUVABLE}
        </p>
      )}

      <div className="flex items-center justify-between gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-[22.5px] border border-[var(--color-warm-cream)] px-4 py-[7.5px] text-[12px] font-medium uppercase text-[var(--color-warm-cream)] disabled:opacity-60"
        >
          {isSubmitting ? "Enregistrement…" : "Enregistrer"}
        </button>
        {actionDroite}
      </div>
    </form>
  );
}

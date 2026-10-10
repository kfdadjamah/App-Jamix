"use client";

import { useState, type BaseSyntheticEvent } from "react";
import { useForm } from "react-hook-form";
import ChampAdresse from "@/components/champ-adresse";
import { zodResolver } from "@hookform/resolvers/zod";
import { schemaFicheBar, type ChampsFicheBar } from "@/lib/validation/inscription";
import ChampFormulaire from "@/components/champ-formulaire";
import { ajouterBar } from "./actions";

// Nom, adresse et photo optionnelle envoyés en une fois : une photo refusée ne crée aucun bar.
export default function FormulaireAjoutBar({
  surAjout,
}: {
  surAjout: (adresseIntrouvable: boolean) => void;
}) {
  const [erreurServeur, setErreurServeur] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ChampsFicheBar>({
    resolver: zodResolver(schemaFicheBar),
    defaultValues: { nomBar: "", adresseBar: "" },
  });

  async function surSoumission(donnees: ChampsFicheBar, evenement?: BaseSyntheticEvent) {
    setErreurServeur(null);

    const formData = new FormData();
    formData.set("nomBar", donnees.nomBar);
    formData.set("adresseBar", donnees.adresseBar);
    const photo = new FormData(evenement?.target as HTMLFormElement).get("photo");
    if (photo instanceof File && photo.size > 0) {
      formData.set("photo", photo);
    }

    const resultat = await ajouterBar(formData);
    if ("erreur" in resultat) {
      setErreurServeur(resultat.erreur);
    } else {
      surAjout(resultat.adresseIntrouvable);
    }
  }

  return (
    <form onSubmit={handleSubmit(surSoumission)} className="flex flex-col gap-6" noValidate>
      <ChampFormulaire label="Nom du bar" erreur={errors.nomBar?.message}>
        <input type="text" {...register("nomBar")} className="champ-input" />
      </ChampFormulaire>

      <ChampFormulaire label="Adresse du bar" erreur={errors.adresseBar?.message}>
        <ChampAdresse
            placeholder="12 rue de la République, Lyon"
            register={register("adresseBar")}
            setValue={(v) => setValue("adresseBar", v, { shouldValidate: true, shouldDirty: true })}
          />
      </ChampFormulaire>

      <ChampFormulaire label="Photo ou logo (optionnel)">
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          name="photo"
          className="champ-input champ-input--fichier"
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
        {isSubmitting ? "Ajout…" : "Ajouter"}
      </button>
    </form>
  );
}

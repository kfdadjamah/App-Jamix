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
    defaultValues: { nomBar: "", adresseBar: "", codePostalBar: "" },
  });

  async function surSoumission(donnees: ChampsFicheBar, evenement?: BaseSyntheticEvent) {
    setErreurServeur(null);

    const formData = new FormData();
    formData.set("nomBar", donnees.nomBar);
    formData.set("adresseBar", donnees.adresseBar);
    formData.set("codePostalBar", donnees.codePostalBar);
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
    <form onSubmit={handleSubmit(surSoumission)} className="flex flex-col gap-4" noValidate>
      <ChampFormulaire label="Nom du bar" erreur={errors.nomBar?.message}>
        <input
          type="text"
          placeholder="Nom du bar"
          {...register("nomBar")}
          className="champ-input"
        />
      </ChampFormulaire>

      <ChampFormulaire label="Adresse du bar" erreur={errors.adresseBar?.message}>
        <ChampAdresse
            placeholder="Adresse du bar"
            register={register("adresseBar")}
            setValue={(v) => setValue("adresseBar", v, { shouldValidate: true, shouldDirty: true })}
            setCodePostal={(v) =>
              setValue("codePostalBar", v, { shouldValidate: true, shouldDirty: true })
            }
          />
      </ChampFormulaire>

      <ChampFormulaire label="Code postal" erreur={errors.codePostalBar?.message}>
        <input
          type="text"
          inputMode="numeric"
          autoComplete="postal-code"
          maxLength={5}
          placeholder="Code postal"
          {...register("codePostalBar")}
          className="champ-input"
        />
      </ChampFormulaire>

      <ChampFormulaire label="Photo ou logo (option)">
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          name="photo"
          className="champ-input champ-input--fichier"
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
        {isSubmitting ? "Ajout…" : "Ajouter"}
      </button>
    </form>
  );
}

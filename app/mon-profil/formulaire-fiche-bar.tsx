"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import ChampAdresse from "@/components/champ-adresse";
import { zodResolver } from "@hookform/resolvers/zod";
import { schemaFicheBar, type ChampsFicheBar } from "@/lib/validation/inscription";
import ChampFormulaire from "@/components/champ-formulaire";
import { AVERTISSEMENT_ADRESSE_INTROUVABLE } from "@/lib/bars";
import { mettreAJourFicheBar } from "./actions";

export default function FormulaireFicheBar({
  barId,
  nom,
  adresse,
  codePostal,
  actionDroite,
}: {
  barId: string;
  nom: string;
  adresse: string;
  codePostal: string;
  // Affichée à droite d'« Enregistrer », sur la même ligne (ex. « Supprimer ce bar »).
  actionDroite?: React.ReactNode;
}) {
  const [erreurServeur, setErreurServeur] = useState<string | null>(null);
  const [succes, setSucces] = useState(false);
  const [adresseIntrouvable, setAdresseIntrouvable] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ChampsFicheBar>({
    resolver: zodResolver(schemaFicheBar),
    defaultValues: { nomBar: nom, adresseBar: adresse, codePostalBar: codePostal },
  });

  async function surSoumission(donnees: ChampsFicheBar) {
    setErreurServeur(null);
    setSucces(false);
    setAdresseIntrouvable(false);

    const formData = new FormData();
    formData.set("nomBar", donnees.nomBar);
    formData.set("adresseBar", donnees.adresseBar);
    formData.set("codePostalBar", donnees.codePostalBar);

    const resultat = await mettreAJourFicheBar(barId, formData);
    if ("erreur" in resultat) {
      setErreurServeur(resultat.erreur);
    } else {
      setSucces(true);
      setAdresseIntrouvable(resultat.adresseIntrouvable);
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

      {erreurServeur && (
        <p className="text-[13px] font-semibold text-[var(--harbor-erreur)]">
          {erreurServeur}
        </p>
      )}
      {succes && (
        <p className="text-[13px] font-bold text-[var(--harbor-marine)]">
          Fiche bar enregistrée.
        </p>
      )}
      {adresseIntrouvable && (
        <p className="text-[13px] font-semibold text-[var(--harbor-erreur)]">
          {AVERTISSEMENT_ADRESSE_INTROUVABLE}
        </p>
      )}

      <div className="flex items-center justify-between gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-[12px] border border-[var(--harbor-trait)] bg-white px-4 py-2 text-[13px] font-bold text-[var(--harbor-marine)] transition-colors duration-[120ms] hover:bg-[var(--harbor-voile)] disabled:opacity-60"
        >
          {isSubmitting ? "Enregistrement…" : "Enregistrer"}
        </button>
        {actionDroite}
      </div>
    </form>
  );
}

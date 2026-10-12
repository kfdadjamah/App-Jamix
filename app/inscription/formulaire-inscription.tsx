"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import ChampAdresse from "@/components/champ-adresse";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  schemaInscriptionClient,
  type ChampsInscriptionClient,
} from "@/lib/validation/inscription";
import ChampFormulaire from "@/components/champ-formulaire";
import BoutonRetour from "@/components/bouton-retour";
import { inscrireOrganisateur } from "./actions";

export default function FormulaireInscription() {
  const [erreurServeur, setErreurServeur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const refPhoto = useRef<HTMLInputElement>(null);

  const {
    register,
    trigger,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<ChampsInscriptionClient>({
    resolver: zodResolver(schemaInscriptionClient),
  });

  async function surSoumission(evenement: React.FormEvent<HTMLFormElement>) {
    evenement.preventDefault();
    const valide = await trigger();
    if (!valide) return;

    setErreurServeur(null);
    setEnCours(true);

    const donnees = getValues();
    const formData = new FormData();
    formData.set("prenom", donnees.prenom);
    formData.set("nom", donnees.nom);
    formData.set("email", donnees.email);
    formData.set("motDePasse", donnees.motDePasse);
    formData.set("nomBar", donnees.nomBar);
    formData.set("adresseBar", donnees.adresseBar);
    formData.set("codePostalBar", donnees.codePostalBar);
    const fichierPhoto = refPhoto.current?.files?.[0];
    if (fichierPhoto) {
      formData.set("photo", fichierPhoto);
    }

    const resultat = await inscrireOrganisateur(formData);
    setEnCours(false);
    if (resultat?.erreur) {
      setErreurServeur(resultat.erreur);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-8 px-6 py-8">
      <BoutonRetour href="/connexion" />
      <div>
        <h1 className="titre-page">
          Inscription
        </h1>
        <p className="mt-3 text-[18px] leading-tight text-[var(--harbor-marine-2)]">
          Créez votre compte et la fiche de votre bar.
        </p>
      </div>

      <form onSubmit={surSoumission} className="flex flex-col gap-6" noValidate>
        <ChampFormulaire label="Prénom" erreur={errors.prenom?.message}>
          <input
            type="text"
            autoComplete="given-name"
            {...register("prenom")}
            className="champ-input"
          />
        </ChampFormulaire>

        <ChampFormulaire label="Nom" erreur={errors.nom?.message}>
          <input
            type="text"
            autoComplete="family-name"
            {...register("nom")}
            className="champ-input"
          />
        </ChampFormulaire>

        <ChampFormulaire label="Email" erreur={errors.email?.message}>
          <input
            type="email"
            autoComplete="email"
            {...register("email")}
            className="champ-input"
          />
        </ChampFormulaire>

        <ChampFormulaire label="Mot de passe" erreur={errors.motDePasse?.message}>
          <input
            type="password"
            autoComplete="new-password"
            {...register("motDePasse")}
            className="champ-input"
          />
        </ChampFormulaire>

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

        <ChampFormulaire label="Photo ou logo (optionnel)">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            ref={refPhoto}
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
          disabled={enCours}
          className="mt-2 rounded-[12px] bg-[var(--harbor-bleu)] px-6 py-3 text-[14px] font-bold text-white transition-colors duration-[120ms] hover:bg-[var(--harbor-marine)] disabled:opacity-60"
        >
          {enCours ? "Création en cours…" : "Créer mon compte"}
        </button>
      </form>

      <p className="text-[12px] text-[var(--harbor-marine-2)]">
        Déjà un compte ?{" "}
        <a href="/connexion" className="text-[var(--harbor-marine)] underline">
          Se connecter
        </a>
      </p>
    </main>
  );
}

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { schemaConnexion, type ChampsConnexion } from "@/lib/validation/inscription";
import BoutonRetour from "@/components/bouton-retour";
import { connecterOrganisateur } from "./actions";

export default function FormulaireConnexion({ reinitialise }: { reinitialise?: string }) {
  const [erreurServeur, setErreurServeur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ChampsConnexion>({
    resolver: zodResolver(schemaConnexion),
  });

  async function onSubmit(donnees: ChampsConnexion) {
    setErreurServeur(null);
    setEnCours(true);

    const formData = new FormData();
    formData.set("email", donnees.email);
    formData.set("motDePasse", donnees.motDePasse);

    const resultat = await connecterOrganisateur(formData);
    setEnCours(false);
    if (resultat?.erreur) {
      setErreurServeur(resultat.erreur);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-8 px-6 py-8">
      <BoutonRetour href="/" />
      <div>
        <h1 className="titre-page">
          Connexion
        </h1>
        <p className="mt-3 text-[18px] leading-tight text-[var(--harbor-marine-2)]">
          Accédez à l&apos;espace de gestion de votre bar.
        </p>
      </div>

      {reinitialise === "1" && (
        <p className="text-[13px] font-bold text-[var(--harbor-marine)]">
          Mot de passe modifié. Vous pouvez vous connecter.
        </p>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6" noValidate>
        <label className="flex flex-col gap-2">
          <span className="text-[13px] font-bold text-[var(--harbor-marine)]">
            Email
          </span>
          <input
            type="email"
            autoComplete="email"
            {...register("email")}
            className="champ-input"
          />
          {errors.email && (
            <span className="text-[13px] font-semibold text-[var(--harbor-erreur)]">
              {errors.email.message}
            </span>
          )}
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-[13px] font-bold text-[var(--harbor-marine)]">
            Mot de passe
          </span>
          <input
            type="password"
            autoComplete="current-password"
            {...register("motDePasse")}
            className="champ-input"
          />
          {errors.motDePasse && (
            <span className="text-[13px] font-semibold text-[var(--harbor-erreur)]">
              {errors.motDePasse.message}
            </span>
          )}
        </label>

        <a
          href="/mot-de-passe-oublie"
          className="-mt-3 self-start text-[13px] font-bold text-[var(--harbor-marine)] underline"
        >
          Mot de passe oublié ?
        </a>

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
          {enCours ? "Connexion…" : "Se connecter"}
        </button>
      </form>

      <p className="text-[12px] text-[var(--harbor-marine-2)]">
        Pas encore de compte ?{" "}
        <a href="/inscription" className="text-[var(--harbor-marine)] underline">
          S&apos;inscrire
        </a>
      </p>
    </main>
  );
}

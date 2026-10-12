"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  schemaMotDePasseOublie,
  type ChampsMotDePasseOublie,
} from "@/lib/validation/inscription";
import ChampFormulaire from "@/components/champ-formulaire";
import BoutonRetour from "@/components/bouton-retour";
import { demanderReinitialisation } from "./actions";

export default function FormulaireMotDePasseOublie() {
  const [erreurServeur, setErreurServeur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const [envoye, setEnvoye] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ChampsMotDePasseOublie>({
    resolver: zodResolver(schemaMotDePasseOublie),
  });

  async function onSubmit(donnees: ChampsMotDePasseOublie) {
    setErreurServeur(null);
    setEnCours(true);

    const formData = new FormData();
    formData.set("email", donnees.email);

    const resultat = await demanderReinitialisation(formData);
    setEnCours(false);
    if ("erreur" in resultat) {
      setErreurServeur(resultat.erreur);
    } else {
      setEnvoye(true);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-8 px-6 py-8">
      <BoutonRetour href="/connexion" />
      <div>
        <h1 className="titre-page">
          Mot de passe oublié
        </h1>
        {!envoye && (
          <p className="mt-3 text-[18px] leading-tight text-[var(--harbor-marine-2)]">
            Saisissez l&apos;email de votre compte, nous vous enverrons un lien pour choisir un
            nouveau mot de passe.
          </p>
        )}
      </div>

      {envoye ? (
        <p className="text-[18px] leading-tight text-[var(--harbor-marine)]">
          Si un compte existe pour cette adresse, un email contenant un lien de réinitialisation
          vient d&apos;être envoyé. Pensez à vérifier vos spams.
        </p>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6" noValidate>
          <ChampFormulaire label="Email" erreur={errors.email?.message}>
            <input
              type="email"
              autoComplete="email"
              {...register("email")}
              className="champ-input"
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
            {enCours ? "Envoi…" : "Envoyer le lien"}
          </button>
        </form>
      )}
    </main>
  );
}

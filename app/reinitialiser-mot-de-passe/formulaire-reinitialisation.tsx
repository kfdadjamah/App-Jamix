"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  schemaReinitialisationMotDePasse,
  type ChampsReinitialisationMotDePasse,
} from "@/lib/validation/inscription";
import ChampFormulaire from "@/components/champ-formulaire";
import { reinitialiserMotDePasse } from "./actions";
import LienInvalide from "./lien-invalide";

export default function FormulaireReinitialisation({ jeton }: { jeton: string }) {
  const [erreurServeur, setErreurServeur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const [lienInvalide, setLienInvalide] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ChampsReinitialisationMotDePasse>({
    resolver: zodResolver(schemaReinitialisationMotDePasse),
  });

  async function onSubmit(donnees: ChampsReinitialisationMotDePasse) {
    setErreurServeur(null);
    setEnCours(true);

    const formData = new FormData();
    formData.set("jeton", jeton);
    formData.set("nouveauMotDePasse", donnees.nouveauMotDePasse);
    formData.set("confirmation", donnees.confirmation);

    // En cas de succès, l'action redirige vers /connexion.
    const resultat = await reinitialiserMotDePasse(formData);
    setEnCours(false);
    if ("lienInvalide" in resultat) {
      setLienInvalide(true);
    } else if ("erreur" in resultat) {
      setErreurServeur(resultat.erreur);
    }
  }

  if (lienInvalide) return <LienInvalide />;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6" noValidate>
      <ChampFormulaire label="Nouveau mot de passe" erreur={errors.nouveauMotDePasse?.message}>
        <input
          type="password"
          autoComplete="new-password"
          {...register("nouveauMotDePasse")}
          className="champ-input"
        />
      </ChampFormulaire>

      <ChampFormulaire label="Confirmation" erreur={errors.confirmation?.message}>
        <input
          type="password"
          autoComplete="new-password"
          {...register("confirmation")}
          className="champ-input"
        />
      </ChampFormulaire>

      {erreurServeur && (
        <p className="text-[12px] font-medium uppercase text-[var(--color-gold-elegance)]">
          {erreurServeur}
        </p>
      )}

      <button
        type="submit"
        disabled={enCours}
        className="mt-2 rounded-[36px] bg-[var(--color-brass-copper)] px-6 py-[14px] text-[12px] font-medium uppercase text-[var(--color-warm-cream)] disabled:opacity-60"
      >
        {enCours ? "Enregistrement…" : "Enregistrer le mot de passe"}
      </button>
    </form>
  );
}

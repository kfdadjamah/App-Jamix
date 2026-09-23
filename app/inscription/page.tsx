"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  schemaInscriptionClient,
  type ChampsInscriptionClient,
} from "@/lib/validation/inscription";
import ChampFormulaire from "@/components/champ-formulaire";
import { inscrireOrganisateur } from "./actions";

export default function PageInscription() {
  const [erreurServeur, setErreurServeur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const refPhoto = useRef<HTMLInputElement>(null);

  const {
    register,
    trigger,
    getValues,
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
    formData.set("email", donnees.email);
    formData.set("motDePasse", donnees.motDePasse);
    formData.set("nomBar", donnees.nomBar);
    formData.set("adresseBar", donnees.adresseBar);
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
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-8 px-6 py-16">
      <div>
        <h1 className="text-[41px] font-medium uppercase leading-[0.9] text-[var(--color-warm-cream)]">
          Inscription
        </h1>
        <p className="mt-3 text-[18px] leading-tight text-[var(--color-driftwood)]">
          Créez votre compte et la fiche de votre bar.
        </p>
      </div>

      <form onSubmit={surSoumission} className="flex flex-col gap-6" noValidate>
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

        <ChampFormulaire label="Photo ou logo (optionnel)">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            ref={refPhoto}
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
          disabled={enCours}
          className="mt-2 rounded-[36px] bg-[var(--color-brass-copper)] px-6 py-[14px] text-[12px] font-medium uppercase text-[var(--color-warm-cream)] disabled:opacity-60"
        >
          {enCours ? "Création en cours…" : "Créer mon compte"}
        </button>
      </form>

      <p className="text-[12px] uppercase text-[var(--color-driftwood)]">
        Déjà un compte ?{" "}
        <a href="/connexion" className="text-[var(--color-warm-cream)] underline">
          Se connecter
        </a>
      </p>
    </main>
  );
}

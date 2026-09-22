"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  schemaInscriptionClient,
  type ChampsInscriptionClient,
} from "@/lib/validation/inscription";
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
        <Champ label="Email" erreur={errors.email?.message}>
          <input
            type="email"
            autoComplete="email"
            {...register("email")}
            className="champ-input"
          />
        </Champ>

        <Champ label="Mot de passe" erreur={errors.motDePasse?.message}>
          <input
            type="password"
            autoComplete="new-password"
            {...register("motDePasse")}
            className="champ-input"
          />
        </Champ>

        <Champ label="Nom du bar" erreur={errors.nomBar?.message}>
          <input type="text" {...register("nomBar")} className="champ-input" />
        </Champ>

        <Champ label="Adresse du bar" erreur={errors.adresseBar?.message}>
          <input
            type="text"
            placeholder="12 rue de la République, Lyon"
            {...register("adresseBar")}
            className="champ-input"
          />
        </Champ>

        <Champ label="Photo ou logo (optionnel)">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            ref={refPhoto}
            className="champ-input champ-input--fichier"
          />
        </Champ>

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

      <style jsx global>{`
        .champ-input {
          width: 100%;
          background: transparent;
          border: none;
          border-bottom: 1px solid var(--color-warm-cream);
          border-radius: 0;
          padding: 1px 2px;
          color: var(--color-warm-cream);
          font-size: 15px;
        }
        .champ-input:focus {
          outline: none;
          border-bottom-color: var(--color-gold-elegance);
        }
        .champ-input--fichier {
          border-bottom: 1px solid var(--color-cork-border);
          font-size: 12px;
        }
      `}</style>
    </main>
  );
}

function Champ({
  label,
  erreur,
  children,
}: {
  label: string;
  erreur?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-[12px] font-medium uppercase text-[var(--color-warm-cream)]">
        {label}
      </span>
      {children}
      {erreur && (
        <span className="text-[10px] font-medium uppercase text-[var(--color-gold-elegance)]">
          {erreur}
        </span>
      )}
    </label>
  );
}

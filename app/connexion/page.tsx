"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { schemaConnexion, type ChampsConnexion } from "@/lib/validation/inscription";
import { connecterOrganisateur } from "./actions";

export default function PageConnexion() {
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
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-8 px-6 py-16">
      <div>
        <h1 className="text-[41px] font-medium uppercase leading-[0.9] text-[var(--color-warm-cream)]">
          Connexion
        </h1>
        <p className="mt-3 text-[18px] leading-tight text-[var(--color-driftwood)]">
          Accédez à l&apos;espace de gestion de votre bar.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6" noValidate>
        <label className="flex flex-col gap-2">
          <span className="text-[12px] font-medium uppercase text-[var(--color-warm-cream)]">
            Email
          </span>
          <input
            type="email"
            autoComplete="email"
            {...register("email")}
            className="champ-input"
          />
          {errors.email && (
            <span className="text-[10px] font-medium uppercase text-[var(--color-gold-elegance)]">
              {errors.email.message}
            </span>
          )}
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-[12px] font-medium uppercase text-[var(--color-warm-cream)]">
            Mot de passe
          </span>
          <input
            type="password"
            autoComplete="current-password"
            {...register("motDePasse")}
            className="champ-input"
          />
          {errors.motDePasse && (
            <span className="text-[10px] font-medium uppercase text-[var(--color-gold-elegance)]">
              {errors.motDePasse.message}
            </span>
          )}
        </label>

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
          {enCours ? "Connexion…" : "Se connecter"}
        </button>
      </form>

      <p className="text-[12px] uppercase text-[var(--color-driftwood)]">
        Pas encore de compte ?{" "}
        <a href="/inscription" className="text-[var(--color-warm-cream)] underline">
          S&apos;inscrire
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
      `}</style>
    </main>
  );
}

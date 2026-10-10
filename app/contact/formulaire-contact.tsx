"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CHAMP_PIEGE_CONTACT,
  LONGUEUR_MAX_MESSAGE_CONTACT,
  LONGUEUR_MAX_NOM_CONTACT,
  schemaContact,
  type ChampsContact,
} from "@/lib/validation/contact";
import ChampFormulaire from "@/components/champ-formulaire";
import BoutonRetour from "@/components/bouton-retour";
import { envoyerMessageContact } from "./actions";

export default function FormulaireContact({ emailInitial }: { emailInitial: string }) {
  const [erreurServeur, setErreurServeur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const [envoye, setEnvoye] = useState(false);
  const [piege, setPiege] = useState("");

  const valeursInitiales = { nom: "", email: emailInitial, message: "" };
  const {
    register,
    handleSubmit,
    reset,
    control,
    getValues,
    formState: { errors },
  } = useForm<ChampsContact>({
    resolver: zodResolver(schemaContact),
    defaultValues: valeursInitiales,
  });
  const longueurMessage = useWatch({ control, name: "message" })?.length ?? 0;

  // La saisie brute est envoyée : le serveur normalise et revalide.
  async function onSubmit() {
    setErreurServeur(null);
    setEnvoye(false);
    setEnCours(true);

    const champs = getValues();
    const formData = new FormData();
    formData.set("nom", champs.nom);
    formData.set("email", champs.email);
    formData.set("message", champs.message);
    formData.set(CHAMP_PIEGE_CONTACT, piege);

    const resultat = await envoyerMessageContact(formData).catch(() => ({
      erreur: "L'envoi a échoué, réessayez plus tard.",
    }));
    setEnCours(false);
    if ("erreur" in resultat) {
      setErreurServeur(resultat.erreur);
    } else {
      setEnvoye(true);
      setPiege("");
      reset(valeursInitiales);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-8 px-6 py-8">
      <BoutonRetour href="/" />
      <div>
        <h1 className="text-[41px] font-medium uppercase leading-[0.9] text-[var(--color-warm-cream)]">
          Contact
        </h1>
        <p className="mt-3 text-[18px] leading-tight text-[var(--color-driftwood)]">
          Une question, une remarque ? Écrivez-nous, nous vous répondrons par email.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6" noValidate>
        <ChampFormulaire label="Nom" erreur={errors.nom?.message}>
          <input
            type="text"
            autoComplete="name"
            maxLength={LONGUEUR_MAX_NOM_CONTACT}
            {...register("nom")}
            className="champ-input"
          />
        </ChampFormulaire>

        <ChampFormulaire label="Email" erreur={errors.email?.message}>
          <input type="email" autoComplete="email" {...register("email")} className="champ-input" />
        </ChampFormulaire>

        <ChampFormulaire label="Message" erreur={errors.message?.message}>
          <textarea
            rows={6}
            maxLength={LONGUEUR_MAX_MESSAGE_CONTACT}
            {...register("message")}
            className="champ-input resize-none"
          />
          <span className="self-end text-[12px] text-[var(--color-driftwood)]">
            {longueurMessage}/{LONGUEUR_MAX_MESSAGE_CONTACT}
          </span>
        </ChampFormulaire>

        {/* Champ piège, hors écran et hors navigation : seul un robot le remplit. */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
          <label>
            Site web
            <input
              type="text"
              name={CHAMP_PIEGE_CONTACT}
              tabIndex={-1}
              autoComplete="off"
              value={piege}
              onChange={(e) => setPiege(e.target.value)}
            />
          </label>
        </div>

        {erreurServeur && (
          <p role="alert" className="text-[12px] font-medium uppercase text-[var(--color-gold-elegance)]">
            {erreurServeur}
          </p>
        )}
        {envoye && (
          <p role="status" className="text-[18px] leading-tight text-[var(--color-warm-cream)]">
            Message envoyé, nous vous répondrons par email.
          </p>
        )}

        <button
          type="submit"
          disabled={enCours}
          className="mt-2 rounded-[36px] bg-[var(--color-brass-copper)] px-6 py-[14px] text-[12px] font-medium uppercase text-[var(--color-warm-cream)] disabled:opacity-60"
        >
          {enCours ? "Envoi…" : "Envoyer"}
        </button>

        <p className="text-[12px] leading-[1.4] text-[color-mix(in_srgb,var(--color-warm-cream)_60%,transparent)]">
          Votre nom, votre email et votre message servent uniquement à vous répondre ; ils ne sont
          pas enregistrés dans l&apos;application. En savoir plus dans les{" "}
          <Link
            href="/cgu"
            className="text-[var(--color-warm-cream)] underline hover:no-underline focus-visible:no-underline"
          >
            CGU
          </Link>
          .
        </p>
      </form>
    </main>
  );
}

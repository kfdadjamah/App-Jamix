"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { ajouterJours, fenetreSept } from "@/lib/semaine";
import type { Vue } from "./toggle-vue";

function hrefDate(date: string, vue: Vue) {
  return `/?date=${date}${vue === "carte" ? "&vue=carte" : ""}`;
}

const ABREVIATIONS = new Intl.DateTimeFormat("fr-FR", { weekday: "short", timeZone: "UTC" });

export default function SelecteurDate({
  dateSelectionnee,
  aujourdhui,
  vue = "liste",
  joursAvecJams = [],
}: {
  dateSelectionnee: string;
  aujourdhui: string;
  vue?: Vue;
  joursAvecJams?: string[];
}) {
  const { debut, jours } = fenetreSept(dateSelectionnee, aujourdhui);
  const precedentPossible = debut > aujourdhui;
  const boutonFleche =
    "flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] border border-[var(--harbor-trait)] bg-white text-[var(--harbor-marine)] hover:bg-[var(--harbor-voile)] active:border-[var(--harbor-bleu-clair)] active:bg-[var(--harbor-voile)] transition-colors duration-[120ms]";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        {precedentPossible ? (
          <Link
            href={hrefDate(ajouterJours(dateSelectionnee, -7), vue)}
            aria-label="Semaine précédente"
            className={boutonFleche}
          >
            <ChevronLeft size={20} aria-hidden="true" />
          </Link>
        ) : (
          <span className={`${boutonFleche} opacity-30`} aria-hidden="true">
            <ChevronLeft size={20} />
          </span>
        )}
        <div className="flex items-center gap-2">
          <Link
            href={hrefDate(aujourdhui, vue)}
            className="rounded-[14px] bg-[var(--harbor-voile)] px-3 py-2.5 text-[14px] font-semibold text-[var(--harbor-marine)] hover:bg-[var(--harbor-trait)] active:bg-[var(--harbor-trait)] transition-colors duration-[120ms]"
          >
            Aujourd&apos;hui
          </Link>
          <BoutonCalendrier dateSelectionnee={dateSelectionnee} aujourdhui={aujourdhui} vue={vue} />
        </div>
        <Link
          href={hrefDate(ajouterJours(dateSelectionnee, 7), vue)}
          aria-label="Semaine suivante"
          className={boutonFleche}
        >
          <ChevronRight size={20} aria-hidden="true" />
        </Link>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {jours.map((jour) => {
          const selectionne = jour === dateSelectionnee;
          const passe = jour < aujourdhui;
          const avecJam = joursAvecJams.includes(jour);
          const contenu = (
            <>
              <span className="donnees text-[12px] font-medium opacity-70">
                {ABREVIATIONS.format(new Date(jour)).replace(".", "")}
              </span>
              <span className="donnees text-[18px] font-bold leading-none">{Number(jour.slice(8))}</span>
              <span
                aria-hidden="true"
                data-point={avecJam ? "oui" : undefined}
                className={`h-1 w-1 rounded-full ${
                  avecJam
                    ? selectionne
                      ? "bg-white"
                      : "bg-[var(--harbor-bleu)]"
                    : "bg-transparent"
                }`}
              />
            </>
          );
          const classes = `flex flex-col items-center gap-1 rounded-[14px] py-2 transition-colors duration-[120ms] ${
            selectionne
              ? "bg-[var(--harbor-bleu)] text-white active:bg-[var(--harbor-marine)]"
              : "text-[var(--harbor-marine)] hover:bg-[var(--harbor-voile)] active:bg-[var(--harbor-trait)]"
          }`;
          const libelle = new Intl.DateTimeFormat("fr-FR", {
            weekday: "long",
            day: "numeric",
            month: "long",
            timeZone: "UTC",
          }).format(new Date(jour));

          return passe ? (
            <span key={jour} className={`${classes} opacity-30`} aria-hidden="true">
              {contenu}
            </span>
          ) : (
            <Link
              key={jour}
              href={hrefDate(jour, vue)}
              aria-label={avecJam ? `${libelle}, jams publiées` : libelle}
              aria-current={selectionne ? "date" : undefined}
              className={classes}
            >
              {contenu}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// Bouton calendrier : un vrai champ date transparent posé sur le bouton, pour que le toucher
// ouvre le sélecteur natif (showPicker() sur un champ de 0×0 est ignoré par iOS).
function BoutonCalendrier({
  dateSelectionnee,
  aujourdhui,
  vue,
}: {
  dateSelectionnee: string;
  aujourdhui: string;
  vue: Vue;
}) {
  const router = useRouter();

  return (
    <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] border border-[var(--harbor-trait)] bg-white text-[var(--harbor-marine)] transition-colors duration-[120ms] hover:bg-[var(--harbor-voile)] active:border-[var(--harbor-bleu-clair)] active:bg-[var(--harbor-voile)]">
      <CalendarDays size={18} aria-hidden="true" />
      <input
        type="date"
        aria-label="Choisir une date"
        value={dateSelectionnee}
        min={aujourdhui}
        onClick={(evenement) => {
          try {
            evenement.currentTarget.showPicker();
          } catch {
            // Le toucher natif sur le champ suffit.
          }
        }}
        onChange={(evenement) => {
          if (evenement.target.value) router.push(hrefDate(evenement.target.value, vue));
        }}
        className="absolute -inset-px h-[calc(100%+2px)] w-[calc(100%+2px)] cursor-pointer rounded-[14px] opacity-0"
      />
    </div>
  );
}

"use client";

import { useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { ajouterJours, fenetreSept } from "@/lib/semaine";
import type { Theme } from "@/lib/theme";
import type { Vue } from "./toggle-vue";

function hrefDate(date: string, vue: Vue) {
  return `/?date=${date}${vue === "carte" ? "&vue=carte" : ""}`;
}

const ABREVIATIONS = new Intl.DateTimeFormat("fr-FR", { weekday: "short", timeZone: "UTC" });

export default function SelecteurDate({
  dateSelectionnee,
  theme = "oryzo",
  aujourdhui,
  vue = "liste",
  joursAvecJams = [],
}: {
  dateSelectionnee: string;
  theme?: Theme;
  aujourdhui?: string;
  vue?: Vue;
  joursAvecJams?: string[];
}) {
  const router = useRouter();
  const champRef = useRef<HTMLInputElement | null>(null);

  if (theme === "oryzo" || !aujourdhui) {
    return (
      <input
        type="date"
        value={dateSelectionnee}
        min={new Date().toISOString().slice(0, 10)}
        onChange={(evenement) => router.push(`/?date=${evenement.target.value}`)}
        className="w-full bg-transparent border-0 border-b border-[var(--color-warm-cream)] px-[2px] py-[1px] text-[18px] text-[var(--color-warm-cream)] focus:outline-none focus:border-b-2 focus:pb-0"
        style={{ colorScheme: "dark" }}
      />
    );
  }

  const { debut, jours } = fenetreSept(dateSelectionnee, aujourdhui);
  const precedentPossible = debut > aujourdhui;
  const boutonFleche =
    "flex h-9 w-9 items-center justify-center rounded-full text-[var(--harbor-marine)] hover:bg-[var(--harbor-voile)] transition-colors duration-[120ms]";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
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
          <Link
            href={hrefDate(aujourdhui, vue)}
            className="rounded-full px-3 py-1.5 text-[13px] font-semibold hover:bg-[var(--harbor-voile)] transition-colors duration-[120ms]"
          >
            Aujourd&apos;hui
          </Link>
          <Link
            href={hrefDate(ajouterJours(dateSelectionnee, 7), vue)}
            aria-label="Semaine suivante"
            className={boutonFleche}
          >
            <ChevronRight size={20} aria-hidden="true" />
          </Link>
        </div>
        <div className="relative">
          <button
            type="button"
            aria-label="Choisir une date"
            onClick={() => champRef.current?.showPicker()}
            className={boutonFleche}
          >
            <CalendarDays size={20} aria-hidden="true" />
          </button>
          <input
            ref={champRef}
            type="date"
            aria-label="Date"
            tabIndex={-1}
            value={dateSelectionnee}
            min={aujourdhui}
            onChange={(evenement) => {
              if (evenement.target.value) router.push(hrefDate(evenement.target.value, vue));
            }}
            className="pointer-events-none absolute right-0 top-full h-0 w-0 opacity-0"
          />
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {jours.map((jour) => {
          const selectionne = jour === dateSelectionnee;
          const passe = jour < aujourdhui;
          const avecJam = joursAvecJams.includes(jour);
          const contenu = (
            <>
              <span className="donnees text-[11px] uppercase">
                {ABREVIATIONS.format(new Date(jour)).replace(".", "")}
              </span>
              <span className="donnees text-[17px] font-bold">{Number(jour.slice(8))}</span>
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
          const classes = `flex flex-col items-center gap-0.5 rounded-[12px] py-2 transition-colors duration-[120ms] ${
            selectionne
              ? "bg-[var(--harbor-bleu)] text-white"
              : "text-[var(--harbor-marine)] hover:bg-[var(--harbor-voile)]"
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

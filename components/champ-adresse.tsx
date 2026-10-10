"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";
import { LONGUEUR_MIN_ADRESSE } from "@/lib/suggestions-adresse";

// Champ libre + suggestions d'adresses complètes ; la valeur postée reste le texte du champ.
export default function ChampAdresse({
  register,
  setValue,
  placeholder,
}: {
  register: UseFormRegisterReturn;
  setValue: (valeur: string) => void;
  placeholder?: string;
}) {
  const idListe = useId();
  const refInput = useRef<HTMLInputElement | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [ouvert, setOuvert] = useState(false);
  const [actif, setActif] = useState(-1);
  const [saisie, setSaisie] = useState("");
  const choix = useRef(false);

  useEffect(() => {
    const q = saisie.trim();
    if (choix.current || q.length < LONGUEUR_MIN_ADRESSE) {
      choix.current = false;
      setSuggestions([]);
      return;
    }
    const controleur = new AbortController();
    const minuteur = setTimeout(async () => {
      try {
        const r = await fetch(`/api/adresses?q=${encodeURIComponent(q)}`, {
          signal: controleur.signal,
        });
        const d = (await r.json()) as { suggestions?: string[] };
        setSuggestions(d.suggestions ?? []);
        setOuvert(true);
        setActif(-1);
      } catch {
        setSuggestions([]);
      }
    }, 250);
    return () => {
      clearTimeout(minuteur);
      controleur.abort();
    };
  }, [saisie]);

  function choisir(adresse: string) {
    choix.current = true;
    setValue(adresse);
    setSaisie(adresse);
    setSuggestions([]);
    setOuvert(false);
  }

  const affiche = ouvert && suggestions.length > 0;

  return (
    <div className="relative">
      <input
        type="text"
        autoComplete="off"
        placeholder={placeholder}
        role="combobox"
        aria-expanded={affiche}
        aria-controls={idListe}
        aria-autocomplete="list"
        aria-activedescendant={actif >= 0 ? `${idListe}-${actif}` : undefined}
        className="champ-input"
        {...register}
        ref={(el) => {
          register.ref(el);
          refInput.current = el;
        }}
        onChange={(e) => {
          register.onChange(e);
          setSaisie(e.target.value);
          setOuvert(true);
        }}
        onBlur={(e) => {
          register.onBlur(e);
          setTimeout(() => setOuvert(false), 150);
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOuvert(false);
          else if (!affiche) return;
          else if (e.key === "ArrowDown") {
            e.preventDefault();
            setActif((a) => (a + 1) % suggestions.length);
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActif((a) => (a <= 0 ? suggestions.length - 1 : a - 1));
          } else if (e.key === "Enter" && actif >= 0) {
            e.preventDefault();
            choisir(suggestions[actif]);
          }
        }}
      />
      {affiche && (
        <ul
          id={idListe}
          role="listbox"
          className="absolute left-0 right-0 z-10 mt-1 border border-[var(--color-cork-border)] bg-[var(--color-walnut-shadow)]"
        >
          {suggestions.map((s, i) => (
            <li
              key={s}
              id={`${idListe}-${i}`}
              role="option"
              aria-selected={i === actif}
              onMouseDown={(e) => {
                e.preventDefault();
                choisir(s);
              }}
              className={`cursor-pointer px-2 py-2 text-[12px] text-[var(--color-warm-cream)] ${
                i === actif ? "bg-[color-mix(in_srgb,var(--color-warm-cream)_15%,transparent)]" : ""
              }`}
            >
              {s}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

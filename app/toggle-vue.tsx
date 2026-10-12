"use client";

import { useRouter } from "next/navigation";
import type { Theme } from "@/lib/theme";

export type Vue = "liste" | "carte";

export default function ToggleVue({
  vue,
  dateSelectionnee,
  theme = "oryzo",
}: {
  vue: Vue;
  dateSelectionnee: string;
  theme?: Theme;
}) {
  const router = useRouter();

  function selectionnerVue(nouvelleVue: Vue) {
    router.push(`/?date=${dateSelectionnee}&vue=${nouvelleVue}`);
  }

  if (theme === "harbor") {
    return (
      <div className="flex gap-1 rounded-[12px] bg-[var(--harbor-voile)] p-1">
        {(["liste", "carte"] as const).map((option) => {
          const actif = vue === option;
          return (
            <button
              key={option}
              type="button"
              aria-pressed={actif}
              onClick={() => selectionnerVue(option)}
              className={`flex-1 rounded-[8px] py-2 text-[13px] font-bold transition-colors duration-[120ms] ${
                actif
                  ? "bg-white text-[var(--harbor-marine)] shadow-[0_1px_3px_rgba(11,54,88,.12)]"
                  : "text-[var(--harbor-marine-2)]"
              }`}
            >
              {option === "liste" ? "Liste" : "Carte"}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      {(["liste", "carte"] as const).map((option) => {
        const actif = vue === option;
        return (
          <button
            key={option}
            type="button"
            onClick={() => selectionnerVue(option)}
            className={
              actif
                ? "rounded-[36px] bg-[color:var(--color-brass-copper)] px-6 py-3.5 text-xs font-medium uppercase text-[color:var(--color-warm-cream)]"
                : "rounded-[22.5px] border border-[color:var(--color-warm-cream)] bg-transparent px-6 py-3 text-xs font-medium uppercase text-[color:var(--color-warm-cream)]"
            }
          >
            {option === "liste" ? "Liste" : "Carte"}
          </button>
        );
      })}
    </div>
  );
}

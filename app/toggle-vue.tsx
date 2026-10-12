"use client";

import { useRouter } from "next/navigation";

export type Vue = "liste" | "carte";

export default function ToggleVue({
  vue,
  dateSelectionnee,
}: {
  vue: Vue;
  dateSelectionnee: string;
}) {
  const router = useRouter();

  function selectionnerVue(nouvelleVue: Vue) {
    router.push(`/?date=${dateSelectionnee}&vue=${nouvelleVue}`);
  }

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
            className={`flex-1 rounded-[8px] py-1.5 text-[13px] font-bold transition-colors duration-[120ms] active:bg-[var(--harbor-voile)] ${
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

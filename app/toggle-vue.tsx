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

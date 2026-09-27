import Link from "next/link";
import { UserRound } from "lucide-react";

// Cercle ghost button ; rempli en Warm Cream quand /mon-profil est la page active.
export default function IconeProfil({ actif = false }: { actif?: boolean }) {
  return (
    <Link
      href="/mon-profil"
      aria-label="Mon profil"
      aria-current={actif ? "page" : undefined}
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[9999px] border border-[var(--color-warm-cream)] ${
        actif
          ? "bg-[var(--color-warm-cream)] text-[var(--color-walnut-shadow)]"
          : "text-[var(--color-warm-cream)]"
      }`}
    >
      <UserRound size={18} strokeWidth={1.5} aria-hidden="true" />
    </Link>
  );
}

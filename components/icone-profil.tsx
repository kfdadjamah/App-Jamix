import { LienGarde } from "./garde-sortie";
import { UserRound } from "lucide-react";

// Pastille ronde sur l'entête marine ; blanche sur toutes les pages (l'état actif passe par aria-current).
export default function IconeProfil({ actif = false }: { actif?: boolean }) {
  return (
    <LienGarde
      href="/mon-profil"
      aria-label="Mon profil"
      aria-current={actif ? "page" : undefined}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9999px] bg-white text-[var(--harbor-marine)]"
    >
      <UserRound size={18} strokeWidth={1.75} aria-hidden="true" />
    </LienGarde>
  );
}

import Link from "next/link";
import { House } from "lucide-react";
import { sessionCourante } from "@/auth";
import IconeProfil from "./icone-profil";
import { LienGarde } from "./garde-sortie";

// Bandeau commun, rendu par chaque page (pas dans le layout) pour rester dans
// FournisseurGardeSortie sur les formulaires d'annonce : « Jamix » y est une sortie gardée.
// sessionCourante() plutôt qu'auth() : à jour sur /mon-profil après un changement de mot de passe.
export default async function Bandeau({
  page,
}: {
  page: "accueil" | "cgu" | "connexion" | "jam" | "mes-annonces" | "mon-profil";
}) {
  const session = await sessionCourante();
  const accueil = page === "accueil";

  return (
    <header className="sticky top-0 z-20 w-full border-b border-[var(--color-gold-elegance)] bg-[var(--color-brass-copper)]">
      <div className="mx-auto flex h-14 w-full max-w-md items-center justify-between gap-3 px-6">
        {/* Lien vers / sans paramètre : date du jour et vue liste, en navigation client. */}
        <LienGarde
          href="/"
          aria-current={accueil ? "page" : undefined}
          className="flex items-center gap-[6px] text-[14px] font-medium uppercase text-[var(--color-warm-cream)]"
        >
          <House size={18} strokeWidth={1.5} aria-hidden="true" />
          <span className={accueil ? "underline" : undefined}>Jamix</span>
        </LienGarde>
        {session?.user?.id ? (
          <IconeProfil actif={page === "mon-profil"} />
        ) : (
          accueil && (
            <Link
              href="/connexion"
              className="whitespace-nowrap rounded-[22.5px] border border-[var(--color-warm-cream)] px-4 py-[7.5px] text-[12px] font-medium uppercase text-[var(--color-warm-cream)]"
            >
              Connexion organisateur
            </Link>
          )
        )}
      </div>
    </header>
  );
}

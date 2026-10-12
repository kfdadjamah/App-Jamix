import Link from "next/link";
import { House } from "lucide-react";
import { sessionCourante } from "@/auth";
import IconeProfil from "./icone-profil";
import { LienGarde } from "./garde-sortie";

// Bandeau commun, rendu par chaque page (pas dans le layout) pour rester dans
// FournisseurGardeSortie sur les formulaires d'annonce : « Jammix » y est une sortie gardée.
// sessionCourante() plutôt qu'auth() : à jour sur /mon-profil après un changement de mot de passe.
export default async function Bandeau({
  page,
}: {
  page:
    | "accueil"
    | "cgu"
    | "connexion"
    | "contact"
    | "jam"
    | "mentions-legales"
    | "mes-annonces"
    | "mon-profil";
}) {
  const session = await sessionCourante();
  const accueil = page === "accueil";
  // Accueil : le mot-symbole est le h1 de la page ; ailleurs, simple décor (le h1 est le titre de la page).
  const Mot = accueil ? "h1" : "p";

  return (
    <>
      <header className="sticky top-0 z-20 w-full border-b-[3px] border-[var(--harbor-bleu-clair)] bg-[var(--harbor-marine)]">
        <div
          className={`mx-auto flex h-12 w-full max-w-md items-center gap-3 px-6 ${accueil ? "justify-end" : "justify-between"}`}
        >
          {/* Icône maison seule, lien vers / sans paramètre (date du jour, vue liste), en navigation client ; absente de l'accueil.
            Le mot-symbole « Jammix » et l'accroche sont sous le bandeau, sur toutes les pages. */}
          {!accueil && (
            <LienGarde
              href="/"
              aria-label="Accueil"
              className="flex items-center text-white"
            >
              <House size={22} strokeWidth={1.75} aria-hidden="true" />
            </LienGarde>
          )}
          {session?.user?.id ? (
            <IconeProfil actif={page === "mon-profil"} />
          ) : (
            accueil && (
              <Link
                href="/connexion"
                className="whitespace-nowrap rounded-full bg-white/[.12] px-3 py-1.5 text-[12px] font-semibold text-white"
              >
                Connexion organisateur
              </Link>
            )
          )}
        </div>
      </header>
      <div className="mx-auto flex w-full max-w-md flex-col gap-2 px-6 pt-6">
        <Mot
          className="font-[family-name:var(--font-jakarta)] text-[clamp(44px,13vw,56px)] font-extrabold leading-[0.95] tracking-[-0.045em] text-[var(--harbor-marine)]"
          {...(accueil ? {} : { "aria-hidden": true })}
        >
          Jam<span className="text-[var(--harbor-bleu)]">mix</span>
        </Mot>
        <p className="text-[18px] font-semibold leading-tight tracking-[-0.02em] text-[var(--harbor-marine-2)]">
          Les Jams à Lyon, ce soir
        </p>
      </div>
    </>
  );
}

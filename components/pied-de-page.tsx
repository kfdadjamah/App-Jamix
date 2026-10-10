import paquet from "@/package.json";
import { LienGarde } from "./garde-sortie";

// Pied de page commun, rendu par chaque page après <main> (comme le Bandeau) pour rester
// dans FournisseurGardeSortie sur les formulaires d'annonce : « CGU » y est une sortie gardée.
// Placé après le contenu, jamais fixé à l'écran. « Contact » arrive en phase 32.
export default function PiedDePage({ page }: { page?: "cgu" }) {
  const annee = new Date().getFullYear();

  return (
    <footer className="w-full bg-[var(--color-walnut-shadow)]">
      <div className="mx-auto w-full max-w-md px-6 pb-6">
        <div className="flex flex-col items-center gap-2 border-t border-dashed border-[var(--color-cork-border)] pt-6 text-center text-[11px] font-medium uppercase leading-[1.2] text-[color-mix(in_srgb,var(--color-warm-cream)_60%,transparent)]">
          <nav aria-label="Informations légales">
            <LienGarde
              href="/cgu"
              aria-current={page === "cgu" ? "page" : undefined}
              className={`text-[var(--color-warm-cream)] hover:underline focus-visible:underline${page === "cgu" ? " underline" : ""}`}
            >
              CGU
            </LienGarde>
          </nav>
          <p>
            © {annee} Jamix · Tous droits réservés · v{paquet.version}
          </p>
        </div>
      </div>
    </footer>
  );
}

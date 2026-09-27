import { LienGarde } from "./garde-sortie";

// Destination fixe par page, jamais l'historique du navigateur.
// Sur les formulaires d'annonce, la sortie passe par la garde (phase 16).
export default function BoutonRetour({ href }: { href: string }) {
  return (
    <LienGarde
      href={href}
      libelleOccupe="Enregistrement…"
      className="self-start text-[12px] font-medium uppercase text-[var(--color-driftwood)] hover:text-[var(--color-warm-cream)] hover:underline focus-visible:text-[var(--color-warm-cream)] focus-visible:underline"
    >
      ← Retour
    </LienGarde>
  );
}

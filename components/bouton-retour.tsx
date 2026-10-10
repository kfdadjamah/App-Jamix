import { LienGarde } from "./garde-sortie";

// Destination fixe par page, jamais l'historique du navigateur.
// Sur les formulaires d'annonce, la sortie passe par la garde (phase 16).
export default function BoutonRetour({ href }: { href: string }) {
  return (
    <LienGarde
      href={href}
      libelleOccupe="Enregistrement…"
      className="self-start rounded-[22.5px] border-2 border-[var(--color-warm-cream)] px-4 py-[7.5px] text-[12px] font-medium uppercase text-[var(--color-warm-cream)] hover:underline focus-visible:underline"
    >
      ← Retour
    </LienGarde>
  );
}

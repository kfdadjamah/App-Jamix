import { LienGarde } from "./garde-sortie";

// Destination fixe par page, jamais l'historique du navigateur.
// Sur les formulaires d'annonce, la sortie passe par la garde (phase 16).
export default function BoutonRetour({ href }: { href: string }) {
  return (
    <LienGarde
      href={href}
      libelleOccupe="Enregistrement…"
      className="self-start rounded-[12px] border border-[var(--harbor-trait)] bg-white px-4 py-2 text-[13px] font-bold text-[var(--harbor-marine)] transition-colors duration-[120ms] hover:bg-[var(--harbor-voile)] active:border-[var(--harbor-bleu-clair)] active:bg-[var(--harbor-voile)] hover:underline focus-visible:underline"
    >
      ← Retour
    </LienGarde>
  );
}

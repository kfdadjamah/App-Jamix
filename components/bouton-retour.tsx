import Link from "next/link";

// Destination fixe par page, jamais l'historique du navigateur.
export default function BoutonRetour({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="self-start text-[12px] font-medium uppercase text-[var(--color-driftwood)] hover:text-[var(--color-warm-cream)] hover:underline focus-visible:text-[var(--color-warm-cream)] focus-visible:underline"
    >
      ← Retour
    </Link>
  );
}

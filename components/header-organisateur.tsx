import Link from "next/link";
import { deconnecterOrganisateur } from "@/app/mon-bar/actions";
import { recupererBarDeLOrganisateurConnecte } from "@/lib/organisateur";
import { compterRelancesActives } from "@/lib/relances";
import { prisma } from "@/lib/prisma";

export default async function HeaderOrganisateur({
  page,
}: {
  page: "mon-bar" | "mes-annonces" | "mon-compte";
}) {
  const bar = await recupererBarDeLOrganisateurConnecte();
  const occurrences = await prisma.occurrenceJam.findMany({
    where: { annonce: { barId: bar.id } },
    select: { statut: true, confirmationJ7: true },
  });
  const nbRelancesActives = compterRelancesActives(occurrences);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav className="flex gap-3 whitespace-nowrap">
          <Link
            href="/mon-bar"
            className={`text-[12px] font-medium uppercase ${
              page === "mon-bar"
                ? "text-[var(--color-warm-cream)] underline"
                : "text-[var(--color-driftwood)]"
            }`}
          >
            Mon bar
          </Link>
          <Link
            href="/mes-annonces"
            className={`text-[12px] font-medium uppercase ${
              page === "mes-annonces"
                ? "text-[var(--color-warm-cream)] underline"
                : "text-[var(--color-driftwood)]"
            }`}
          >
            Mes annonces
          </Link>
          <Link
            href="/mon-compte"
            className={`text-[12px] font-medium uppercase ${
              page === "mon-compte"
                ? "text-[var(--color-warm-cream)] underline"
                : "text-[var(--color-driftwood)]"
            }`}
          >
            Mon compte
          </Link>
        </nav>
        <form action={deconnecterOrganisateur}>
          <button
            type="submit"
            className="whitespace-nowrap rounded-[22.5px] border border-[var(--color-warm-cream)] px-4 py-[7.5px] text-[12px] font-medium uppercase text-[var(--color-warm-cream)]"
          >
            Déconnexion
          </button>
        </form>
      </div>
      {nbRelancesActives > 0 && (
        <Link
          href="/mes-annonces"
          className="text-[12px] font-medium uppercase text-[var(--color-gold-elegance)] underline"
        >
          ⚠ {nbRelancesActives} jam{nbRelancesActives > 1 ? "s" : ""} en attente de confirmation
        </Link>
      )}
    </div>
  );
}

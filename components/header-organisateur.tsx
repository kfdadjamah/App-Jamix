import Link from "next/link";
import { recupererBarDeLOrganisateurConnecte } from "@/lib/organisateur";
import { compterRelancesActives } from "@/lib/relances";
import { prisma } from "@/lib/prisma";
import IconeProfil from "./icone-profil";

export default async function HeaderOrganisateur({
  page,
}: {
  page: "mes-annonces" | "mon-profil";
}) {
  const bar = await recupererBarDeLOrganisateurConnecte();
  const occurrences = await prisma.occurrenceJam.findMany({
    where: { annonce: { barId: bar.id } },
    select: { statut: true, confirmationJ7: true },
  });
  const nbRelancesActives = compterRelancesActives(occurrences);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/mes-annonces"
          className={`whitespace-nowrap text-[12px] font-medium uppercase ${
            page === "mes-annonces"
              ? "text-[var(--color-warm-cream)] underline"
              : "text-[var(--color-driftwood)]"
          }`}
        >
          Mes annonces
        </Link>
        <IconeProfil actif={page === "mon-profil"} />
      </div>
      {nbRelancesActives > 0 && (
        <Link
          href="/mes-annonces"
          className="text-[12px] font-medium uppercase text-[var(--color-warm-cream)] underline"
        >
          ⚠ {nbRelancesActives} jam{nbRelancesActives > 1 ? "s" : ""} en attente de confirmation
        </Link>
      )}
    </div>
  );
}

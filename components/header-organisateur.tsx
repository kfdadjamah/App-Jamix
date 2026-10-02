import { recupererIdOrganisateurConnecte } from "@/lib/organisateur";
import { compterRelancesActives } from "@/lib/relances";
import { prisma } from "@/lib/prisma";
import { LienGarde } from "./garde-sortie";

export default async function HeaderOrganisateur({
  page,
}: {
  page: "mes-annonces" | "mon-profil";
}) {
  // Relances de tous les bars du compte.
  const organisateurId = await recupererIdOrganisateurConnecte();
  const occurrences = await prisma.occurrenceJam.findMany({
    where: { annonce: { bar: { organisateurId } } },
    select: { statut: true, confirmationJ7: true },
  });
  const nbRelancesActives = compterRelancesActives(occurrences);

  return (
    <div className="flex flex-col gap-3">
      <LienGarde
        href="/mes-annonces"
        className={`self-start whitespace-nowrap text-[12px] font-medium uppercase ${
          page === "mes-annonces"
            ? "text-[var(--color-warm-cream)] underline"
            : "text-[var(--color-driftwood)]"
        }`}
      >
        Mes annonces
      </LienGarde>
      {nbRelancesActives > 0 && (
        <LienGarde
          href="/mes-annonces"
          className="text-[12px] font-medium uppercase text-[var(--color-warm-cream)] underline"
        >
          ⚠ {nbRelancesActives} jam{nbRelancesActives > 1 ? "s" : ""} en attente de confirmation
        </LienGarde>
      )}
    </div>
  );
}

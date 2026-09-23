import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { recupererBarDeLOrganisateurConnecte } from "@/lib/organisateur";
import HeaderOrganisateur from "@/components/header-organisateur";
import { LIBELLES_STATUT_OCCURRENCE } from "@/lib/annonce-constantes";

export default async function PageMesAnnonces() {
  const bar = await recupererBarDeLOrganisateurConnecte();
  const annonces = await prisma.annonce.findMany({
    where: { barId: bar.id },
    include: { occurrences: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-8 px-6 py-16">
      <HeaderOrganisateur page="mes-annonces" />

      <div className="flex items-center justify-between">
        <h1 className="text-[41px] font-medium uppercase leading-[0.9] text-[var(--color-warm-cream)]">
          Mes annonces
        </h1>
        <Link
          href="/mes-annonces/nouvelle"
          className="rounded-[36px] bg-[var(--color-brass-copper)] px-4 py-[10px] text-[12px] font-medium uppercase text-[var(--color-warm-cream)]"
        >
          Nouvelle
        </Link>
      </div>

      {annonces.length === 0 && (
        <p className="text-[15px] text-[var(--color-driftwood)]">
          Aucune annonce pour le moment.
        </p>
      )}

      <div className="flex flex-col gap-4">
        {annonces.map((annonce) => {
          const occurrencesTriees = [...annonce.occurrences].sort(
            (a, b) => a.date.getTime() - b.date.getTime()
          );
          const premiereOccurrence = occurrencesTriees[0];
          return (
            <Link
              key={annonce.id}
              href={`/mes-annonces/${annonce.id}`}
              className="flex flex-col gap-2 rounded-[12px] border border-[var(--color-cork-border)] p-4"
            >
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-medium uppercase text-[var(--color-warm-cream)]">
                  {annonce.statut === "BROUILLON" ? "Brouillon" : "Publiée"}
                </span>
                {annonce.estRecurrente && (
                  <span className="rounded-[9999px] border border-[var(--color-driftwood)] px-2 py-[2px] text-[10px] font-medium uppercase text-[var(--color-driftwood)]">
                    Récurrente
                  </span>
                )}
              </div>

              {premiereOccurrence ? (
                <span className="text-[18px] text-[var(--color-warm-cream)]">
                  {premiereOccurrence.heureDebut}
                  {premiereOccurrence.heureFin ? ` – ${premiereOccurrence.heureFin}` : ""}
                </span>
              ) : (
                <span className="text-[15px] text-[var(--color-driftwood)]">
                  Aucune date renseignée
                </span>
              )}

              {occurrencesTriees.length > 0 && (
                <ul className="flex flex-wrap gap-2">
                  {occurrencesTriees.map((occurrence) => (
                    <li
                      key={occurrence.id}
                      className="rounded-[9999px] border border-[var(--color-cork-border)] px-3 py-1 text-[10px] font-medium uppercase text-[var(--color-warm-cream)]"
                    >
                      {new Date(occurrence.date).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                      })}{" "}
                      · {LIBELLES_STATUT_OCCURRENCE[occurrence.statut]}
                    </li>
                  ))}
                </ul>
              )}

              {annonce.styles.length > 0 && (
                <span className="text-[12px] uppercase text-[var(--color-driftwood)]">
                  {annonce.styles.join(", ")}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </main>
  );
}

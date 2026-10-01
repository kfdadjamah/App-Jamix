import { Fragment } from "react";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { recupererIdOrganisateurConnecte } from "@/lib/organisateur";
import HeaderOrganisateur from "@/components/header-organisateur";
import { LIBELLES_STATUT_OCCURRENCE } from "@/lib/annonce-constantes";
import { statutAffiche } from "@/lib/annonces";
import { messageRelance } from "@/lib/relances";
import FiltreAnnonces from "./filtre-annonces";

export default async function PageMesAnnonces() {
  const organisateurId = await recupererIdOrganisateurConnecte();
  const [annonces, bars] = await Promise.all([
    prisma.annonce.findMany({
      where: { bar: { organisateurId } },
      include: { occurrences: true, bar: { select: { nom: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.bar.findMany({
      where: { organisateurId },
      select: { id: true, nom: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);
  const cartes = annonces.map((annonce) => ({
    id: annonce.id,
    barId: annonce.barId,
    carte: <CarteAnnonce annonce={annonce} />,
  }));

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

      {annonces.length > 0 &&
        (bars.length >= 2 ? (
          <FiltreAnnonces bars={bars} annonces={cartes} />
        ) : (
          <div className="flex flex-col gap-4">
            {cartes.map(({ id, carte }) => (
              <Fragment key={id}>{carte}</Fragment>
            ))}
          </div>
        ))}
    </main>
  );
}

type AnnonceAvecDetails = Prisma.AnnonceGetPayload<{
  include: { occurrences: true; bar: { select: { nom: true } } };
}>;

function CarteAnnonce({ annonce }: { annonce: AnnonceAvecDetails }) {
  const occurrencesTriees = [...annonce.occurrences].sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  );
  const premiereOccurrence = occurrencesTriees[0];
  return (
    <Link
      href={`/mes-annonces/${annonce.id}`}
      className="flex flex-col gap-2 rounded-[12px] border border-[var(--color-cork-border)] p-4"
    >
      <span className="text-[12px] font-medium uppercase text-[var(--color-warm-cream)]">
        {annonce.bar.nom}
      </span>
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
          {occurrencesTriees.map((occurrence) => {
            const relance = messageRelance(occurrence);
            return (
              <li
                key={occurrence.id}
                className="flex flex-col rounded-[9999px] border border-[var(--color-cork-border)] px-3 py-1 text-[10px] font-medium uppercase text-[var(--color-warm-cream)]"
              >
                <span>
                  {new Date(occurrence.date).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "short",
                  })}{" "}
                  · {LIBELLES_STATUT_OCCURRENCE[statutAffiche(occurrence)]}
                </span>
                {relance && (
                  <span className="text-[var(--color-gold-elegance)]">{relance}</span>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {annonce.styles.length > 0 && (
        <span className="text-[12px] uppercase text-[var(--color-driftwood)]">
          {annonce.styles.join(", ")}
        </span>
      )}
    </Link>
  );
}

import { recupererIdOrganisateurConnecte } from "@/lib/organisateur";
import { compterRelancesActives } from "@/lib/relances";
import { aujourdHuiUTC } from "@/lib/annonces";
import { prisma } from "@/lib/prisma";
import { LienGarde } from "./garde-sortie";

// Ligne « À confirmer » sous le bandeau de l'espace organisateur.
// Lien vers « Mes annonces » sur le profil et les formulaires (garde de sortie), simple texte sur « Mes annonces ».
export default async function HeaderOrganisateur({
  page,
}: {
  page: "mes-annonces" | "formulaire" | "mon-profil";
}) {
  // Jams en attente de confirmation de tous les bars du compte, dates passées exclues.
  const organisateurId = await recupererIdOrganisateurConnecte();
  const occurrences = await prisma.occurrenceJam.findMany({
    where: {
      date: { gte: aujourdHuiUTC() },
      annonce: { statut: "PUBLIEE", bar: { organisateurId } },
    },
    select: { statut: true, confirmationJ7: true, date: true },
  });
  const nbAConfirmer = compterRelancesActives(occurrences);
  const libelleAccessible =
    nbAConfirmer === 0
      ? "Aucune jam à confirmer"
      : `${nbAConfirmer} jam${nbAConfirmer > 1 ? "s" : ""} à confirmer`;

  const contenu = (
    <>
      <span aria-hidden="true">🔔</span>
      <span aria-hidden="true">
        <span className="font-bold">À confirmer</span> · {nbAConfirmer}
      </span>
      <span className="sr-only">{libelleAccessible}</span>
    </>
  );
  const classes =
    "inline-flex items-center gap-[6px] whitespace-nowrap text-[12px] font-medium uppercase text-[var(--color-warm-cream)]";

  return (
    <div className="border-b border-dashed border-[var(--color-cork-border)] pb-3">
      {page === "mes-annonces" ? (
        <p className={classes}>{contenu}</p>
      ) : (
        <LienGarde
          href="/mes-annonces"
          className={`${classes} hover:underline focus-visible:underline`}
        >
          {contenu}
        </LienGarde>
      )}
    </div>
  );
}

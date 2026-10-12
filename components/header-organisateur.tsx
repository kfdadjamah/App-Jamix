import { recupererIdOrganisateurConnecte } from "@/lib/organisateur";
import { compterRelancesActives } from "@/lib/relances";
import { aujourdHuiUTC } from "@/lib/annonces";
import { prisma } from "@/lib/prisma";
import { LienGarde } from "./garde-sortie";

// Ligne sous le bandeau de l'espace organisateur.
// Profil et formulaires : lien « Accéder à mes annonces » sans chiffre (garde de sortie), le nombre reste dans le libellé accessible.
// « Mes annonces » : simple texte « À confirmer · N ».
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
  const compte =
    nbAConfirmer === 0
      ? "Aucune jam à confirmer"
      : `${nbAConfirmer} jam${nbAConfirmer > 1 ? "s" : ""} à confirmer`;
  const libelleAccessible =
    page === "mes-annonces" ? compte : `Accéder à mes annonces, ${compte}`;

  const contenu = (
    <>
      <span aria-hidden="true">🔔</span>
      <span aria-hidden="true">
        {page === "mes-annonces" ? (
          <>
            <span className="font-bold">À confirmer</span> · {nbAConfirmer}
          </>
        ) : (
          <span className="font-bold">Accéder à mes annonces</span>
        )}
      </span>
      <span className="sr-only">{libelleAccessible}</span>
    </>
  );
  const classes =
    "inline-flex flex-wrap items-center gap-x-[6px] text-[13px] font-bold text-[var(--harbor-marine)]";

  return (
    <div className="border-b border-[var(--harbor-trait)] pb-3">
      {page === "mes-annonces" ? (
        <p className={classes}>{contenu}</p>
      ) : (
        <LienGarde
          href="/mes-annonces"
          className={`${classes} hover:underline focus-visible:underline active:text-[var(--harbor-bleu)]`}
        >
          {contenu}
        </LienGarde>
      )}
    </div>
  );
}

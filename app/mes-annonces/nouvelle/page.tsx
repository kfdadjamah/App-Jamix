import Bandeau from "@/components/bandeau";
import HeaderOrganisateur from "@/components/header-organisateur";
import BoutonRetour from "@/components/bouton-retour";
import { FournisseurGardeSortie } from "@/components/garde-sortie";
import FormulaireAnnonce from "../formulaire-annonce";
import { creerAnnonce } from "../actions";
import { recupererBarsDeLOrganisateurConnecte } from "@/lib/organisateur";
import { prisma } from "@/lib/prisma";
import { valeursReprisesParBar } from "@/lib/annonces";

export default async function PageNouvelleAnnonce() {
  const bars = await recupererBarsDeLOrganisateurConnecte();
  // Reprise de la dernière annonce publiée de chaque bar, préchargée en une requête.
  const annoncesPubliees = await prisma.annonce.findMany({
    where: { barId: { in: bars.map((bar) => bar.id) }, statut: "PUBLIEE" },
    include: { occurrences: { select: { date: true, heureDebut: true, heureFin: true } } },
  });
  const reprises = valeursReprisesParBar(annoncesPubliees);
  const creerBrouillon = creerAnnonce.bind(null, "brouillon");
  const publier = creerAnnonce.bind(null, "publier");

  return (
    <FournisseurGardeSortie>
      <Bandeau page="mes-annonces" />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-8 px-6 py-8">
        <HeaderOrganisateur page="formulaire" />

        <BoutonRetour href="/mes-annonces" />

        <h1 className="text-[24px] font-medium uppercase leading-[1.09] text-[var(--color-warm-cream)]">
          Nouvelle annonce
        </h1>

        <FormulaireAnnonce
          nouvelleAnnonce
          choixBar={{
            mode: "choix",
            bars: bars.map(({ id, nom }) => ({ id, nom })),
            // Un seul bar : présélectionné ; sinon, aucun choix par défaut.
            barIdInitial: bars.length === 1 ? bars[0].id : "",
          }}
          reprises={reprises}
          afficherPhotos
          actionBrouillon={creerBrouillon}
          actionPublier={publier}
          destinationApresEnregistrement="/mes-annonces"
        />
      </main>
    </FournisseurGardeSortie>
  );
}

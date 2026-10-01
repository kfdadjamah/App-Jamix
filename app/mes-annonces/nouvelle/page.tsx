import HeaderOrganisateur from "@/components/header-organisateur";
import BoutonRetour from "@/components/bouton-retour";
import { FournisseurGardeSortie } from "@/components/garde-sortie";
import FormulaireAnnonce from "../formulaire-annonce";
import { creerAnnonce } from "../actions";
import { recupererBarsDeLOrganisateurConnecte } from "@/lib/organisateur";

export default async function PageNouvelleAnnonce() {
  const bars = await recupererBarsDeLOrganisateurConnecte();
  const creerBrouillon = creerAnnonce.bind(null, "brouillon");
  const publier = creerAnnonce.bind(null, "publier");

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-8 px-6 py-16">
      <FournisseurGardeSortie>
        <HeaderOrganisateur page="mes-annonces" />

        <BoutonRetour href="/mes-annonces" />

        <h1 className="text-[41px] font-medium uppercase leading-[0.9] text-[var(--color-warm-cream)]">
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
          afficherPhotos
          actionBrouillon={creerBrouillon}
          actionPublier={publier}
          destinationApresEnregistrement="/mes-annonces"
        />
      </FournisseurGardeSortie>
    </main>
  );
}

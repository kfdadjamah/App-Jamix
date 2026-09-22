import HeaderOrganisateur from "@/components/header-organisateur";
import FormulaireAnnonce from "../formulaire-annonce";
import { creerAnnonce } from "../actions";

export default function PageNouvelleAnnonce() {
  const creerBrouillon = creerAnnonce.bind(null, "brouillon");
  const publier = creerAnnonce.bind(null, "publier");

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-8 px-6 py-16">
      <HeaderOrganisateur page="mes-annonces" />

      <h1 className="text-[41px] font-medium uppercase leading-[0.9] text-[var(--color-warm-cream)]">
        Nouvelle annonce
      </h1>

      <FormulaireAnnonce
        afficherPhotos
        actionBrouillon={creerBrouillon}
        actionPublier={publier}
      />
    </main>
  );
}

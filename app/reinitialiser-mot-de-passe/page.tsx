import { trouverJetonValide } from "@/lib/jeton-reinitialisation";
import FormulaireReinitialisation from "./formulaire-reinitialisation";
import Bandeau from "@/components/bandeau";
import BoutonRetour from "@/components/bouton-retour";
import LienInvalide from "./lien-invalide";
import PiedDePage from "@/components/pied-de-page";

export default async function PageReinitialiserMotDePasse({
  searchParams,
}: {
  searchParams: Promise<{ jeton?: string | string[] }>;
}) {
  const { jeton } = await searchParams;
  const jetonBrut = typeof jeton === "string" ? jeton : undefined;

  // Vérifié dès l'ouverture : un lien invalide n'affiche pas le formulaire.
  const jetonValide = await trouverJetonValide(jetonBrut);

  return (
    <>
      <Bandeau page="connexion" />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-8 px-6 py-8">
        <BoutonRetour href="/connexion" />
        <h1 className="text-[41px] font-medium uppercase leading-[0.9] text-[var(--color-warm-cream)]">
          Nouveau mot de passe
        </h1>
        {jetonValide && jetonBrut ? (
          <FormulaireReinitialisation jeton={jetonBrut} />
        ) : (
          <LienInvalide />
        )}
      </main>
      <PiedDePage />
    </>
  );
}

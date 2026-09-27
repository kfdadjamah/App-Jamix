import { trouverJetonValide } from "@/lib/jeton-reinitialisation";
import FormulaireReinitialisation from "./formulaire-reinitialisation";
import LienInvalide from "./lien-invalide";

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
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-8 px-6 py-16">
      <h1 className="text-[41px] font-medium uppercase leading-[0.9] text-[var(--color-warm-cream)]">
        Nouveau mot de passe
      </h1>
      {jetonValide && jetonBrut ? (
        <FormulaireReinitialisation jeton={jetonBrut} />
      ) : (
        <LienInvalide />
      )}
    </main>
  );
}

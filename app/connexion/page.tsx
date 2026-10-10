import Bandeau from "@/components/bandeau";
import FormulaireConnexion from "./formulaire-connexion";
import PiedDePage from "@/components/pied-de-page";

export default async function PageConnexion({
  searchParams,
}: {
  searchParams: Promise<{ reinitialise?: string }>;
}) {
  const { reinitialise } = await searchParams;

  return (
    <>
      <Bandeau page="connexion" />
      <FormulaireConnexion reinitialise={reinitialise} />
      <PiedDePage />
    </>
  );
}

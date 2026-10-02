import Bandeau from "@/components/bandeau";
import FormulaireConnexion from "./formulaire-connexion";

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
    </>
  );
}

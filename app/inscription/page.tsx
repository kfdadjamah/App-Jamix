import Bandeau from "@/components/bandeau";
import FormulaireInscription from "./formulaire-inscription";
import PiedDePage from "@/components/pied-de-page";

export default function PageInscription() {
  return (
    <>
      <Bandeau page="connexion" />
      <FormulaireInscription />
      <PiedDePage />
    </>
  );
}

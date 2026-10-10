import Bandeau from "@/components/bandeau";
import FormulaireMotDePasseOublie from "./formulaire-mot-de-passe-oublie";
import PiedDePage from "@/components/pied-de-page";

export default function PageMotDePasseOublie() {
  return (
    <>
      <Bandeau page="connexion" />
      <FormulaireMotDePasseOublie />
      <PiedDePage />
    </>
  );
}

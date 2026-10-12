import Link from "next/link";
import Bandeau from "@/components/bandeau";
import BoutonRetour from "@/components/bouton-retour";
import PiedDePage from "@/components/pied-de-page";

// Jam inexistante, en brouillon ou passée : même message, sans détailler la raison.
export default function JamIndisponible() {
  return (
    <>
      <Bandeau page="jam" />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-8 px-6 py-8">
        <BoutonRetour href="/" />
        <p className="text-[15px] text-[var(--harbor-marine)]">
          Cette jam n&apos;est plus disponible.
        </p>
        <Link
          href="/"
          className="self-start text-[13px] font-bold text-[var(--harbor-marine)] underline"
        >
          Voir les jams du jour
        </Link>
      </main>
      <PiedDePage />
    </>
  );
}

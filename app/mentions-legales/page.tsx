import Link from "next/link";
import Bandeau from "@/components/bandeau";
import BoutonRetour from "@/components/bouton-retour";
import PiedDePage from "@/components/pied-de-page";

// Éditeur anonyme : aucun nom de personne sur cette page.
const DATE_MISE_A_JOUR = "10 octobre 2026";

function Separateur() {
  return <hr className="border-0 border-t border-dashed border-[var(--color-cork-border)]" />;
}

function Section({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-[12px] font-medium uppercase leading-[1.2] text-[var(--color-warm-cream)]">
        {titre}
      </h2>
      <div className="flex flex-col gap-3 text-[15px] leading-[1.4] text-[var(--color-warm-cream)]">
        {children}
      </div>
    </section>
  );
}

export default function PageMentionsLegales() {
  return (
    <>
      <Bandeau page="mentions-legales" />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-8 px-6 py-8">
        <BoutonRetour href="/" />

        <h1 className="titre-page">
          Mentions légales
        </h1>

        <Section titre="Éditeur">
          <p>
            Jammix est édité par un particulier, à titre non professionnel. Comme la loi le permet,
            son identité n&apos;est pas publiée : elle est connue des hébergeurs.
          </p>
          <p>
            L&apos;éditeur est joignable via le{" "}
            <Link href="/contact" className="underline">
              formulaire Contact
            </Link>
            .
          </p>
        </Section>

        <Separateur />

        <Section titre="Directeur de la publication">
          <p>Le directeur de la publication est l&apos;éditeur, particulier non professionnel.</p>
        </Section>

        <Separateur />

        <Section titre="Hébergeurs">
          <p>
            Site et photos : Vercel Inc.
            <br />
            440 N Barranca Ave #4133
            <br />
            Covina, CA 91723, États-Unis
          </p>
          <p>
            Base de données : Neon, LLC (filiale de Databricks, Inc.)
            <br />
            160 Spear Street, Suite 1300
            <br />
            San Francisco, CA 94105, États-Unis
          </p>
        </Section>

        <Separateur />

        <Section titre="Contact et signalement">
          <p>
            Pour poser une question ou joindre l&apos;équipe, utilisez le{" "}
            <Link href="/contact" className="underline">
              formulaire Contact
            </Link>
            .
          </p>
          <p>
            Pour signaler un contenu illicite, écrivez-nous via ce même formulaire en indiquant
            l&apos;annonce concernée et le motif du signalement. Un contenu manifestement illicite
            est retiré.
          </p>
        </Section>

        <Separateur />

        <Section titre="Propriété intellectuelle">
          <p>
            La marque, le logo et le code de Jammix sont réservés. Les photos et textes publiés par
            les organisateurs restent la propriété de leurs auteurs.
          </p>
        </Section>

        <Separateur />

        <p className="text-[12px] font-medium uppercase leading-[1.2] text-[color-mix(in_srgb,var(--color-warm-cream)_70%,transparent)]">
          Mise à jour : {DATE_MISE_A_JOUR}
        </p>
      </main>
      <PiedDePage page="mentions-legales" />
    </>
  );
}

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import HeaderOrganisateur from "@/components/header-organisateur";
import GestionPhotoBar from "./gestion-photo-bar";
import FormulaireFicheBar from "./formulaire-fiche-bar";
import FormulaireEmail from "./formulaire-email";
import FormulaireMotDePasse from "./formulaire-mot-de-passe";
import SuppressionCompte from "./suppression-compte";
import { deconnecterOrganisateur } from "./actions";

function Separateur() {
  return <hr className="border-0 border-t border-dashed border-[var(--color-cork-border)]" />;
}

export default async function PageMonProfil() {
  const session = await auth();
  // Email lu en base, jamais depuis le JWT : celui-ci garde l'ancien email après un changement.
  const organisateur = await prisma.organisateur.findUnique({
    where: { id: session!.user.id },
    select: { email: true, createdAt: true, bar: true },
  });

  if (!organisateur?.bar) {
    return (
      <main className="mx-auto max-w-md px-6 py-16 text-[var(--color-warm-cream)]">
        Compte introuvable.
      </main>
    );
  }

  const { bar } = organisateur;
  const dateCreation = organisateur.createdAt.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-8 px-6 py-16">
      <HeaderOrganisateur page="mon-profil" />

      <div className="flex flex-col gap-3">
        <h1 className="text-[41px] font-medium uppercase leading-[0.9] text-[var(--color-warm-cream)]">
          Mon profil
        </h1>
        <span className="text-[12px] font-medium uppercase text-[var(--color-driftwood)]">
          Compte créé le {dateCreation}
        </span>
      </div>

      <Separateur />
      <section className="flex flex-col gap-6">
        <h2 className="text-[24px] font-medium uppercase leading-[1.09] text-[var(--color-warm-cream)]">
          Mon bar
        </h2>
        <GestionPhotoBar photoUrl={bar.photoUrl} />
        <FormulaireFicheBar nom={bar.nom} adresse={bar.adresse} />
      </section>
      <Separateur />
      <FormulaireEmail emailActuel={organisateur.email} />
      <Separateur />
      <FormulaireMotDePasse />
      <Separateur />
      <form action={deconnecterOrganisateur}>
        <button
          type="submit"
          className="rounded-[22.5px] border border-[var(--color-warm-cream)] px-4 py-[7.5px] text-[12px] font-medium uppercase text-[var(--color-warm-cream)]"
        >
          Déconnexion
        </button>
      </form>
      <Separateur />
      <SuppressionCompte />
    </main>
  );
}

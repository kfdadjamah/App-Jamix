import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import HeaderOrganisateur from "@/components/header-organisateur";
import FormulaireEmail from "./formulaire-email";
import FormulaireMotDePasse from "./formulaire-mot-de-passe";
import SuppressionCompte from "./suppression-compte";

export default async function PageMonCompte() {
  const session = await auth();
  // Lu en base, jamais depuis le JWT : celui-ci garde l'ancien email après un changement.
  const organisateur = await prisma.organisateur.findUnique({
    where: { id: session!.user.id },
    select: { email: true, createdAt: true },
  });

  if (!organisateur) {
    return (
      <main className="mx-auto max-w-md px-6 py-16 text-[var(--color-warm-cream)]">
        Compte introuvable.
      </main>
    );
  }

  const dateCreation = organisateur.createdAt.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-8 px-6 py-16">
      <HeaderOrganisateur page="mon-compte" />

      <div className="flex flex-col gap-3">
        <h1 className="text-[41px] font-medium uppercase leading-[0.9] text-[var(--color-warm-cream)]">
          Mon compte
        </h1>
        <span className="text-[12px] font-medium uppercase text-[var(--color-driftwood)]">
          Compte créé le {dateCreation}
        </span>
      </div>

      <FormulaireEmail emailActuel={organisateur.email} />
      <hr className="border-0 border-t border-dashed border-[var(--color-cork-border)]" />
      <FormulaireMotDePasse />
      <hr className="border-0 border-t border-dashed border-[var(--color-cork-border)]" />
      <SuppressionCompte />
    </main>
  );
}

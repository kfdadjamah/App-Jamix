import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import HeaderOrganisateur from "@/components/header-organisateur";
import GestionPhotoBar from "./gestion-photo-bar";
import FormulaireFicheBar from "./formulaire-fiche-bar";

export default async function PageMonBar() {
  const session = await auth();
  const bar = await prisma.bar.findUnique({
    where: { organisateurId: session!.user.id },
  });

  if (!bar) {
    return (
      <main className="mx-auto max-w-md px-6 py-16 text-[var(--color-warm-cream)]">
        Aucun bar associé à ce compte.
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-8 px-6 py-16">
      <HeaderOrganisateur page="mon-bar" />

      <h1 className="text-[41px] font-medium uppercase leading-[0.9] text-[var(--color-warm-cream)]">
        Mon bar
      </h1>

      <FormulaireFicheBar nom={bar.nom} adresse={bar.adresse} />

      <GestionPhotoBar photoUrl={bar.photoUrl} />
    </main>
  );
}

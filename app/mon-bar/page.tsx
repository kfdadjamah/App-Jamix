import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { deconnecterOrganisateur } from "./actions";
import GestionPhotoBar from "./gestion-photo-bar";

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
      <div className="flex items-center justify-between">
        <h1 className="text-[41px] font-medium uppercase leading-[0.9] text-[var(--color-warm-cream)]">
          Mon bar
        </h1>
        <form action={deconnecterOrganisateur}>
          <button
            type="submit"
            className="rounded-[22.5px] border border-[var(--color-warm-cream)] px-4 py-[7.5px] text-[12px] font-medium uppercase text-[var(--color-warm-cream)]"
          >
            Se déconnecter
          </button>
        </form>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-[12px] font-medium uppercase text-[var(--color-driftwood)]">
          Nom
        </span>
        <span className="text-[18px] text-[var(--color-warm-cream)]">{bar.nom}</span>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-[12px] font-medium uppercase text-[var(--color-driftwood)]">
          Adresse
        </span>
        <span className="text-[18px] text-[var(--color-warm-cream)]">{bar.adresse}</span>
      </div>

      <GestionPhotoBar photoUrl={bar.photoUrl} />
    </main>
  );
}

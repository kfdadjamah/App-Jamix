import { sessionCourante } from "@/auth";
import { prisma } from "@/lib/prisma";
import Bandeau from "@/components/bandeau";
import PiedDePage from "@/components/pied-de-page";
import FormulaireContact from "./formulaire-contact";

export default async function PageContact() {
  // Email lu en base plutôt que dans la session, à jour après un changement d'email.
  const session = await sessionCourante();
  const organisateur = session?.user?.id
    ? await prisma.organisateur.findUnique({
        where: { id: session.user.id },
        select: { email: true },
      })
    : null;

  return (
    <>
      <Bandeau page="contact" />
      <FormulaireContact emailInitial={organisateur?.email ?? ""} />
      <PiedDePage page="contact" />
    </>
  );
}

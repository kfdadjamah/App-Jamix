import { redirect } from "next/navigation";
import { sessionCourante } from "@/auth";
import { prisma } from "@/lib/prisma";
import { aujourdHuiUTC } from "@/lib/annonces";
import Bandeau from "@/components/bandeau";
import HeaderOrganisateur from "@/components/header-organisateur";
import BoutonRetour from "@/components/bouton-retour";
import SectionDeroulable from "@/components/section-deroulable";
import MesBars from "./mes-bars";
import FormulaireIdentite from "./formulaire-identite";
import FormulaireEmail from "./formulaire-email";
import FormulaireMotDePasse from "./formulaire-mot-de-passe";
import SuppressionCompte from "./suppression-compte";
import { deconnecterOrganisateur } from "./actions";
import PiedDePage from "@/components/pied-de-page";

function Separateur() {
  return <hr className="border-0 border-t border-[var(--harbor-trait)]" />;
}

export default async function PageMonProfil() {
  const session = await sessionCourante();
  if (!session?.user?.id) redirect("/connexion");
  // Email lu en base, jamais depuis le JWT : celui-ci garde l'ancien email après un changement.
  const organisateur = await prisma.organisateur.findUnique({
    where: { id: session.user.id },
    select: {
      prenom: true,
      nom: true,
      email: true,
      createdAt: true,
      bars: {
        orderBy: { createdAt: "asc" },
        // Pour la fenêtre de suppression : N annonces (brouillons compris) et
        // M dates à venir des annonces publiées (annulées comprises).
        include: {
          _count: { select: { annonces: true } },
          annonces: {
            where: { statut: "PUBLIEE" },
            select: {
              _count: { select: { occurrences: { where: { date: { gte: aujourdHuiUTC() } } } } },
            },
          },
        },
      },
    },
  });

  if (!organisateur || organisateur.bars.length === 0) {
    return (
      <>
        <Bandeau page="mon-profil" />
        <main className="mx-auto w-full max-w-md px-6 py-8 text-[var(--harbor-marine)]">
          Compte introuvable.
        </main>
        <PiedDePage />
      </>
    );
  }

  const dateCreation = organisateur.createdAt.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <>
      <Bandeau page="mon-profil" />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-6 py-8">
        <HeaderOrganisateur page="mon-profil" />
        <BoutonRetour href="/mes-annonces" />

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <h1 className="titre-page">
              Mon profil
            </h1>
            <form action={deconnecterOrganisateur}>
              <button
                type="submit"
                className="rounded-[12px] border border-[var(--harbor-trait)] bg-white px-4 py-2 text-[13px] font-bold text-[var(--harbor-marine)] transition-colors duration-[120ms] hover:bg-[var(--harbor-voile)]"
              >
                Déconnexion
              </button>
            </form>
          </div>
          <span className="text-[12px] font-semibold text-[var(--harbor-marine-2)]">
            Compte créé le {dateCreation}
          </span>
        </div>

        <Separateur />
        <SectionDeroulable titre="Mes bars">
          <MesBars
            bars={organisateur.bars.map((bar) => ({
              id: bar.id,
              nom: bar.nom,
              adresse: bar.adresse,
              codePostal: bar.codePostal,
              photoUrl: bar.photoUrl,
              surLaCarte: bar.latitude !== null && bar.longitude !== null,
              nombreAnnonces: bar._count.annonces,
              datesAVenirPubliees: bar.annonces.reduce(
                (total, annonce) => total + annonce._count.occurrences,
                0
              ),
            }))}
          />
        </SectionDeroulable>
        <Separateur />
        <SectionDeroulable titre="Nom et prénom">
          <FormulaireIdentite prenomActuel={organisateur.prenom} nomActuel={organisateur.nom} />
        </SectionDeroulable>
        <Separateur />
        <SectionDeroulable titre="Email">
          <FormulaireEmail />
        </SectionDeroulable>
        <Separateur />
        <SectionDeroulable titre="Mot de passe">
          <FormulaireMotDePasse />
        </SectionDeroulable>
        <Separateur />
        <SectionDeroulable titre="Supprimer mon compte">
          <SuppressionCompte />
        </SectionDeroulable>
      </main>
      <PiedDePage />
    </>
  );
}

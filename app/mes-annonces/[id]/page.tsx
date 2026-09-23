import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { recupererBarDeLOrganisateurConnecte } from "@/lib/organisateur";
import HeaderOrganisateur from "@/components/header-organisateur";
import FormulaireAnnonce from "../formulaire-annonce";
import { modifierAnnonce } from "../actions";
import PhotoAnnonce from "./photo-annonce";

export default async function PageEditionAnnonce({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const bar = await recupererBarDeLOrganisateurConnecte();
  const annonce = await prisma.annonce.findUnique({
    where: { id },
    include: { occurrences: true },
  });

  if (!annonce || annonce.barId !== bar.id) {
    notFound();
  }

  const occurrencesTriees = [...annonce.occurrences].sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  );
  const premiereOccurrence = occurrencesTriees[0];
  const estPubliee = annonce.statut === "PUBLIEE";

  const enregistrerBrouillon = modifierAnnonce.bind(null, annonce.id, "brouillon");
  const publier = modifierAnnonce.bind(null, annonce.id, "publier");
  const enregistrerModifications = modifierAnnonce.bind(null, annonce.id, "modifier");

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-8 px-6 py-16">
      <HeaderOrganisateur page="mes-annonces" />

      <h1 className="text-[41px] font-medium uppercase leading-[0.9] text-[var(--color-warm-cream)]">
        {estPubliee ? "Modifier l'annonce" : "Compléter le brouillon"}
      </h1>

      <FormulaireAnnonce
        afficherPhotos={false}
        datesModifiables={!estPubliee}
        valeursInitiales={{
          dates: occurrencesTriees.map((o) => new Date(o.date).toISOString().slice(0, 10)),
          heureDebut: premiereOccurrence?.heureDebut ?? "",
          heureFin: premiereOccurrence?.heureFin ?? "",
          styles: annonce.styles,
          styleAutre: annonce.styleAutre ?? "",
          instruments: annonce.instruments,
          instrumentAutre: annonce.instrumentAutre ?? "",
        }}
        actionBrouillon={estPubliee ? undefined : enregistrerBrouillon}
        actionPublier={estPubliee ? undefined : publier}
        actionModifier={estPubliee ? enregistrerModifications : undefined}
      />

      <div className="flex gap-6">
        <PhotoAnnonce
          annonceId={annonce.id}
          emplacement={1}
          photoUrl={annonce.photoUrl1}
          label="Photo 1"
        />
        <PhotoAnnonce
          annonceId={annonce.id}
          emplacement={2}
          photoUrl={annonce.photoUrl2}
          label="Photo 2"
        />
      </div>
    </main>
  );
}

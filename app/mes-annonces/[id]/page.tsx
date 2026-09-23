import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { recupererBarDeLOrganisateurConnecte } from "@/lib/organisateur";
import HeaderOrganisateur from "@/components/header-organisateur";
import FormulaireAnnonce from "../formulaire-annonce";
import { modifierAnnonce } from "../actions";
import PhotoAnnonce from "./photo-annonce";
import ConfirmerOccurrence from "./confirmer-occurrence";
import AnnulerOccurrence from "./annuler-occurrence";
import AnnulerAnnonce from "./annuler-annonce";
import { statutAffiche } from "@/lib/annonces";
import { messageRelance } from "@/lib/relances";
import { LIBELLES_STATUT_OCCURRENCE, formaterDateCourte } from "@/lib/annonce-constantes";

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
  const occurrencesNonAnnulees = occurrencesTriees.filter(
    (occurrence) => statutAffiche(occurrence) !== "ANNULEE"
  );

  const enregistrerBrouillon = modifierAnnonce.bind(null, annonce.id, "brouillon");
  const publier = modifierAnnonce.bind(null, annonce.id, "publier");
  const enregistrerModifications = modifierAnnonce.bind(null, annonce.id, "modifier");

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-8 px-6 py-16">
      <HeaderOrganisateur page="mes-annonces" />

      <h1 className="text-[41px] font-medium uppercase leading-[0.9] text-[var(--color-warm-cream)]">
        {estPubliee ? "Modifier l'annonce" : "Compléter le brouillon"}
      </h1>

      {estPubliee && (
        <div className="flex flex-col gap-4">
          {occurrencesTriees.map((occurrence) => {
            const statut = statutAffiche(occurrence);
            const afficherEcheance = statut === "PROGRAMMEE" || statut === "EN_ATTENTE_CONFIRMATION";
            const relance = statut === "EN_ATTENTE_CONFIRMATION" ? messageRelance(occurrence) : null;
            return (
              <div
                key={occurrence.id}
                className="flex flex-col gap-2 rounded-[12px] border border-[var(--color-cork-border)] p-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[15px] text-[var(--color-warm-cream)]">
                    {formaterDateCourte(new Date(occurrence.date))}
                  </span>
                  <span className="text-[10px] font-medium uppercase text-[var(--color-driftwood)]">
                    {LIBELLES_STATUT_OCCURRENCE[statut]}
                  </span>
                </div>
                {statut === "PROGRAMMEE" && occurrence.confirmationJ7 && (
                  <span className="text-[12px] text-[var(--color-driftwood)]">
                    Sera confirmée le {formaterDateCourte(new Date(occurrence.confirmationJ7))}
                  </span>
                )}
                {relance && (
                  <span className="text-[12px] font-medium uppercase text-[var(--color-gold-elegance)]">
                    {relance}
                  </span>
                )}
                <div className="flex gap-3">
                  {afficherEcheance && (
                    <ConfirmerOccurrence occurrenceId={occurrence.id} />
                  )}
                  {statut !== "ANNULEE" && (
                    <AnnulerOccurrence occurrenceId={occurrence.id} />
                  )}
                </div>
              </div>
            );
          })}
          {annonce.estRecurrente && occurrencesNonAnnulees.length > 0 && (
            <AnnulerAnnonce annonceId={annonce.id} />
          )}
        </div>
      )}

      <FormulaireAnnonce
        afficherPhotos={false}
        datesModifiables={!estPubliee}
        occurrencesPourPortee={
          estPubliee && annonce.estRecurrente
            ? occurrencesNonAnnulees.map((occurrence) => ({
                id: occurrence.id,
                date: new Date(occurrence.date).toISOString().slice(0, 10),
              }))
            : undefined
        }
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

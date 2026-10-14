import { adresseComplete } from "@/lib/adresse";
import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Bandeau from "@/components/bandeau";
import BoutonRetour from "@/components/bouton-retour";
import BoutonItineraire from "@/app/bouton-itineraire";
import {
  LIBELLES_STATUT_OCCURRENCE,
  formaterDateCourte,
  libelleStyles,
} from "@/lib/annonce-constantes";
import { mentionOrganisePar, recupererOccurrencePubliee, statutAffiche } from "@/lib/annonces";
import { mentionAnnonce } from "@/lib/rythme";
import DistanceJam from "./distance-jam";
import PiedDePage from "@/components/pied-de-page";

// Une seule requête pour le titre d'onglet et la page.
const occurrenceDeLaPage = cache(recupererOccurrencePubliee);

function formaterDateLongue(date: Date) {
  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const occurrence = await occurrenceDeLaPage(id);
  if (!occurrence) return { title: "Jammix" };
  return {
    title: `${occurrence.annonce.bar.nom} · ${formaterDateCourte(occurrence.date)} — Jammix`,
  };
}

// Page d'une jam (une occurrence), ouverte depuis la liste de l'accueil (phase 29).
export default async function PageJam({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const occurrence = await occurrenceDeLaPage(id);
  if (!occurrence) notFound();

  const { annonce } = occurrence;
  const statut = statutAffiche(occurrence);
  const mention = mentionOrganisePar(annonce.bar.organisateur.prenom, annonce.coOrganisateur);
  const rythme = mentionAnnonce(annonce);
  const afficherEcheance =
    (statut === "PROGRAMMEE" || statut === "EN_ATTENTE_CONFIRMATION") && occurrence.confirmationJ7;
  const photos = [annonce.photoUrl1, annonce.photoUrl2].filter((url): url is string => !!url);

  return (
    <>
      <Bandeau page="jam" />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-8 px-6 py-8">
        {/* Retour à la liste du jour de la jam, en vue liste. */}
        <BoutonRetour href={`/?date=${occurrence.date.toISOString().slice(0, 10)}`} />

        <div className="flex flex-col gap-3">
          <h1 className="titre-page">
            {annonce.bar.nom}
          </h1>
          {mention && (
            <p className="break-words text-[15px] text-[var(--harbor-marine-2)]">{mention}</p>
          )}
          <span className="text-[15px] text-[var(--harbor-marine)]">
            {formaterDateLongue(occurrence.date)}
          </span>
          <span className="text-[13px] font-bold text-[var(--harbor-marine)]">
            {LIBELLES_STATUT_OCCURRENCE[statut]}
          </span>
          {afficherEcheance && (
            <span className="text-[12px] text-[var(--harbor-marine-2)]">
              Sera confirmée le {formaterDateCourte(new Date(occurrence.confirmationJ7!))}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[12px] text-[var(--harbor-marine-2)]">{adresseComplete(annonce.bar)}</span>
            <DistanceJam bar={annonce.bar} />
          </div>
          <span className="break-words text-[15px] text-[var(--harbor-marine)]">
            {occurrence.heureDebut}
            {occurrence.heureFin ? ` – ${occurrence.heureFin}` : ""}
            {rythme && (
              <span className="donnees-carte font-semibold text-[var(--harbor-marine-2)]"> · {rythme}</span>
            )}
          </span>
          {annonce.styles.length > 0 && (
            <span className="text-[12px] text-[var(--harbor-marine-2)]">
              {libelleStyles(annonce.styles)}
              {annonce.styleAutre ? ` (${annonce.styleAutre})` : ""}
            </span>
          )}
          {annonce.instruments.length > 0 && (
            <span className="text-[12px] text-[var(--harbor-marine-2)]">
              Instruments : {annonce.instruments.join(", ")}
              {annonce.instrumentAutre ? ` (${annonce.instrumentAutre})` : ""}
            </span>
          )}
        </div>

        {annonce.description && (
          <p className="whitespace-pre-line text-[15px] text-[var(--harbor-marine)]">
            {annonce.description}
          </p>
        )}

        {photos.length > 0 && (
          <div className="flex flex-col gap-4">
            {photos.map((url) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={url}
                src={url}
                alt={annonce.bar.nom}
                className="aspect-square w-full rounded-[12px] object-cover"
              />
            ))}
          </div>
        )}

        <BoutonItineraire bar={annonce.bar} />
      </main>
      <PiedDePage />
    </>
  );
}

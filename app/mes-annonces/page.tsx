import { Fragment } from "react";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { recupererIdOrganisateurConnecte } from "@/lib/organisateur";
import Bandeau from "@/components/bandeau";
import HeaderOrganisateur from "@/components/header-organisateur";
import {
  COULEURS_STATUT_OCCURRENCE,
  LIBELLES_STATUT_OCCURRENCE,
  libelleStyles,
} from "@/lib/annonce-constantes";
import { statutAffiche } from "@/lib/annonces";
import { messageRelance } from "@/lib/relances";
import FiltreAnnonces from "./filtre-annonces";
import CarteGlissable from "./carte-glissable";
import MenuAnnonce from "./menu-annonce";
import PiedDePage from "@/components/pied-de-page";

export default async function PageMesAnnonces() {
  const organisateurId = await recupererIdOrganisateurConnecte();
  const [annonces, bars] = await Promise.all([
    prisma.annonce.findMany({
      where: { bar: { organisateurId } },
      include: { occurrences: true, bar: { select: { nom: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.bar.findMany({
      where: { organisateurId },
      select: { id: true, nom: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);
  const cartes = annonces.map((annonce) => ({
    id: annonce.id,
    barId: annonce.barId,
    carte: <CarteAnnonce annonce={annonce} />,
  }));

  return (
    <>
      <Bandeau page="mes-annonces" />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-6 py-8">
        <HeaderOrganisateur page="mes-annonces" />

        <div className="flex items-center justify-between gap-3">
          <h1 className="titre-page">Mes annonces</h1>
          <Link
            href="/mes-annonces/nouvelle"
            className="rounded-[12px] bg-[var(--harbor-bleu)] px-4 py-3 text-[14px] font-bold text-white transition-colors duration-[120ms] hover:bg-[var(--harbor-marine)] active:bg-[var(--harbor-marine)]"
          >
            Nouvelle
          </Link>
        </div>

        {annonces.length === 0 && (
          <p className="text-[15px] text-[var(--harbor-marine-2)]">
            Aucune annonce pour le moment.
          </p>
        )}

        {annonces.length > 0 &&
          (bars.length >= 2 ? (
            <FiltreAnnonces bars={bars} annonces={cartes} />
          ) : (
            <div className="flex flex-col gap-3">
              {cartes.map(({ id, carte }) => (
                <Fragment key={id}>{carte}</Fragment>
              ))}
            </div>
          ))}
      </main>
      <PiedDePage />
    </>
  );
}

type AnnonceAvecDetails = Prisma.AnnonceGetPayload<{
  include: { occurrences: true; bar: { select: { nom: true } } };
}>;

function CarteAnnonce({ annonce }: { annonce: AnnonceAvecDetails }) {
  const occurrencesTriees = [...annonce.occurrences].sort(
    (a, b) => a.date.getTime() - b.date.getTime(),
  );
  const premiereOccurrence = occurrencesTriees[0];
  const datesAnnulables =
    annonce.statut === "PUBLIEE"
      ? occurrencesTriees
          .filter((occurrence) => occurrence.statut !== "ANNULEE")
          .map((occurrence) => ({
            id: occurrence.id,
            libelle: new Date(occurrence.date).toLocaleDateString("fr-FR", {
              weekday: "short",
              day: "numeric",
              month: "long",
              timeZone: "UTC",
            }),
          }))
      : [];
  // Toutes les dates, annulées comprises ; vide pour un brouillon sans date.
  const datesSupprimables = occurrencesTriees.map((occurrence) => ({
    id: occurrence.id,
    libelle: new Date(occurrence.date).toLocaleDateString("fr-FR", {
      weekday: "short",
      day: "numeric",
      month: "long",
      timeZone: "UTC",
    }),
  }));
  return (
    <CarteGlissable
      annonceId={annonce.id}
      datesSupprimables={datesSupprimables}
      estRecurrente={annonce.estRecurrente}
    >
      <div className="relative">
        <Link
          href={`/mes-annonces/${annonce.id}`}
          className="flex flex-col gap-2 rounded-[16px] border border-[var(--harbor-trait)] bg-white p-4 shadow-[var(--harbor-ombre-carte)] transition-colors duration-[120ms] active:bg-[var(--harbor-voile)]"
        >
          <span className="truncate pr-12 text-[20px] font-extrabold tracking-[-0.025em] text-[var(--harbor-marine)]">
            {annonce.bar.nom}
          </span>
          <div className="flex items-center gap-2 pr-12">
            <span className="text-[12px] font-bold text-[var(--harbor-marine-2)]">
              {annonce.statut === "BROUILLON" ? "Brouillon" : "Publiée"}
            </span>
            {annonce.estRecurrente && (
              <span className="rounded-[9999px] border border-[var(--harbor-trait)] px-2 py-[2px] text-[12px] font-semibold text-[var(--harbor-marine-2)]">
                Récurrente
              </span>
            )}
          </div>

          {premiereOccurrence ? (
            <span className="donnees text-[15px] font-semibold text-[var(--harbor-marine)]">
              {premiereOccurrence.heureDebut}
              {premiereOccurrence.heureFin
                ? ` – ${premiereOccurrence.heureFin}`
                : ""}
            </span>
          ) : (
            <span className="text-[15px] text-[var(--harbor-marine-2)]">
              Aucune date renseignée
            </span>
          )}

          {occurrencesTriees.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {occurrencesTriees.map((occurrence) => {
                const relance = messageRelance(occurrence);
                const statut = statutAffiche(occurrence);
                return (
                  <li key={occurrence.id} className="flex flex-col items-start gap-1">
                    <span
                      className="rounded-full px-3 py-1 text-[12px] font-bold leading-[1.25] text-white"
                      style={{ backgroundColor: COULEURS_STATUT_OCCURRENCE[statut] }}
                    >
                      {new Date(occurrence.date).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                      })}{" "}
                      · {LIBELLES_STATUT_OCCURRENCE[statut]}
                    </span>
                    {relance && (
                      <span className="text-[12px] font-semibold text-[var(--harbor-alerte)]">
                        {relance}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          {annonce.styles.length > 0 && (
            <span className="text-[12px] text-[var(--harbor-marine-2)]">
              {libelleStyles(annonce.styles)}
            </span>
          )}

          {annonce.description && (
            <p className="line-clamp-2 whitespace-pre-line text-[12px] text-[var(--harbor-marine-2)]">
              {annonce.description}
            </p>
          )}
        </Link>
        <MenuAnnonce
          annonceId={annonce.id}
          datesAnnulables={datesAnnulables}
          datesSupprimables={datesSupprimables}
          estRecurrente={annonce.estRecurrente}
        />
      </div>
    </CarteGlissable>
  );
}

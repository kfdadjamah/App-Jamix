"use client";

import { useState } from "react";
import {
  AVERTISSEMENT_ADRESSE_INTROUVABLE,
  MENTION_DERNIER_BAR,
  NOMBRE_MAX_BARS,
} from "@/lib/bars";
import { adresseComplete } from "@/lib/adresse";
import GestionPhotoBar from "./gestion-photo-bar";
import FormulaireFicheBar from "./formulaire-fiche-bar";
import FormulaireAjoutBar from "./formulaire-ajout-bar";
import FenetreSuppressionBar from "./fenetre-suppression-bar";

export type BarDuProfil = {
  id: string;
  nom: string;
  adresse: string;
  codePostal: string;
  photoUrl: string | null;
  surLaCarte: boolean;
  // Toutes les annonces du bar, brouillons compris.
  nombreAnnonces: number;
  // Occurrences à venir des annonces publiées, annulées comprises.
  datesAVenirPubliees: number;
};

// Panneau ouvert : un bar (son id) ou le formulaire d'ajout ; un seul à la fois.
type Panneau = string | "ajout" | null;

const classeBoutonFantome =
  "whitespace-nowrap rounded-[12px] border border-[var(--harbor-trait)] bg-white px-4 py-2 text-[13px] font-bold text-[var(--harbor-marine)] transition-colors duration-[120ms] hover:bg-[var(--harbor-voile)] disabled:opacity-60";

export default function MesBars({ bars }: { bars: BarDuProfil[] }) {
  // Aucune fiche dépliée d'office : l'organisateur ouvre lui-même ce qu'il veut modifier.
  const [panneau, setPanneau] = useState<Panneau>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [barASupprimer, setBarASupprimer] = useState<BarDuProfil | null>(null);
  const limiteAtteinte = bars.length >= NOMBRE_MAX_BARS;

  function basculer(cible: Panneau) {
    setMessage(null);
    // Replier perd la saisie non enregistrée, sans confirmation.
    setPanneau(panneau === cible ? null : cible);
  }

  function surAjout(adresseIntrouvable: boolean) {
    setPanneau(null);
    setMessage(
      adresseIntrouvable ? `Bar ajouté. ${AVERTISSEMENT_ADRESSE_INTROUVABLE}` : "Bar ajouté."
    );
  }

  function surSuppression() {
    setBarASupprimer(null);
    setPanneau(null);
    setMessage("Bar supprimé.");
  }

  return (
    <>
      <ul className="flex flex-col">
        {bars.map((bar) => {
          const deplie = panneau === bar.id;
          return (
            <li
              key={bar.id}
              className="flex flex-col gap-4 border-t border-[var(--harbor-trait)] py-2 first:border-t-0 first:pt-0"
            >
              <div className="flex items-center gap-3">
                {bar.photoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={bar.photoUrl}
                    alt=""
                    className="h-12 w-12 shrink-0 rounded-[12px] object-cover"
                  />
                )}
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="truncate text-[14px] font-semibold text-[var(--harbor-marine)]">
                    {bar.nom}
                  </span>
                  <span className="truncate text-[12px] text-[var(--harbor-marine-2)]">
                    {adresseComplete(bar)}
                  </span>
                  {!bar.surLaCarte && (
                    <span className="text-[13px] font-semibold text-[var(--harbor-erreur)]">
                      Absent de la carte
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => basculer(bar.id)}
                  aria-expanded={deplie}
                  className={classeBoutonFantome}
                >
                  {deplie ? "Fermer" : "Modifier"}
                </button>
              </div>

              {deplie && (
                <div className="flex flex-col gap-4">
                  <GestionPhotoBar barId={bar.id} photoUrl={bar.photoUrl} />
                  <div className="flex flex-col gap-2">
                    <FormulaireFicheBar
                      barId={bar.id}
                      nom={bar.nom}
                      adresse={bar.adresse}
                      codePostal={bar.codePostal}
                      actionDroite={
                        bars.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setBarASupprimer(bar)}
                            className={classeBoutonFantome}
                          >
                            Supprimer ce bar
                          </button>
                        )
                      }
                    />
                    {bars.length === 1 && (
                      <span className="text-[12px] font-semibold text-[var(--harbor-marine-2)]">
                        {MENTION_DERNIER_BAR}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {message && (
        <p className="text-[13px] font-bold text-[var(--harbor-marine)]">
          {message}
        </p>
      )}

      {barASupprimer && (
        <FenetreSuppressionBar
          barId={barASupprimer.id}
          nomBar={barASupprimer.nom}
          nombreAnnonces={barASupprimer.nombreAnnonces}
          datesAVenirPubliees={barASupprimer.datesAVenirPubliees}
          surAnnuler={() => setBarASupprimer(null)}
          surSuppression={surSuppression}
        />
      )}

      {panneau === "ajout" ? (
        <div className="flex flex-col gap-4 rounded-[12px] border border-[var(--harbor-trait)] p-6">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-[18px] font-semibold leading-none text-[var(--harbor-marine)]">
              Nouveau bar
            </h3>
            <button type="button" onClick={() => basculer("ajout")} className={classeBoutonFantome}>
              Fermer
            </button>
          </div>
          <FormulaireAjoutBar surAjout={surAjout} />
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => basculer("ajout")}
            disabled={limiteAtteinte}
            className={`self-start ${classeBoutonFantome}`}
          >
            Ajouter un bar
          </button>
          {limiteAtteinte && (
            <span className="text-[12px] font-semibold text-[var(--harbor-marine-2)]">
              Limite de {NOMBRE_MAX_BARS} bars atteinte
            </span>
          )}
        </div>
      )}
    </>
  );
}

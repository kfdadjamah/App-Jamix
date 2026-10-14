"use client";

import {
  ERREUR_AUCUNE_DATE,
  JOURS_SEMAINE,
  RYTHMES,
  SEMAINES_DU_MOIS,
  aujourdHuiIso,
  datesAPublier,
  erreurBornes,
  finMaximale,
  retireesPertinentes,
  type Rythme,
} from "@/lib/recurrence";
import { regleDeLaSaisie, type SaisieRegle } from "@/lib/modification-regle";

/**
 * État des dates du formulaire d'annonce (phases 60 à 62). Semaine du mois : rythme mensuel seulement
 * (« 1 » à « 4 », « -1 » = dernier). Dates choisies une à une : ancienne annonce sans règle, affichées
 * tant que la règle est incomplète.
 */
export type ValeursDates = SaisieRegle;

export const valeursDatesVides: ValeursDates = {
  typeJam: "recurrente",
  dateUnique: "",
  rythme: "CHAQUE_SEMAINE",
  jourSemaine: "",
  semaineDuMois: "",
  debutRecurrence: "",
  finRecurrence: "",
  datesRetirees: [],
  datesUneAUne: [],
};

function formaterPastille(date: string) {
  return new Date(date).toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export default function ChoixDates({
  valeurs,
  onChange,
  dateMinimale,
}: {
  valeurs: ValeursDates;
  onChange: (valeurs: ValeursDates) => void;
  // Annonce publiée (phase 62) : sa date de début déjà passée reste acceptée telle quelle.
  dateMinimale?: string;
}) {
  const aujourdHui = aujourdHuiIso();
  const minimum = dateMinimale && dateMinimale < aujourdHui ? dateMinimale : aujourdHui;
  const maj = (champs: Partial<ValeursDates>) => onChange({ ...valeurs, ...champs });
  const mensuel = valeurs.rythme === "MENSUEL";
  const regle = valeurs.typeJam === "recurrente" ? regleDeLaSaisie(valeurs) : null;
  const erreurRegle = regle ? erreurBornes(regle) : null;
  const retirees = regle && !erreurRegle ? retireesPertinentes(regle, valeurs.datesRetirees) : [];
  const apercu = regle && !erreurRegle ? datesAPublier(regle, retirees, aujourdHui) : [];

  return (
    <div className="flex flex-col gap-3">
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-[13px] font-bold text-[var(--harbor-marine)]">
          Type de jam
        </legend>
        {(
          [
            { valeur: "recurrente", libelle: "Jam récurrente" },
            { valeur: "exceptionnelle", libelle: "Jam exceptionnelle" },
          ] as const
        ).map((option) => (
          <label
            key={option.valeur}
            className={`flex cursor-pointer items-center gap-3 rounded-[12px] border px-3 py-2.5 text-[15px] font-semibold text-[var(--harbor-marine)] ${
              valeurs.typeJam === option.valeur
                ? "border-[var(--harbor-bleu)] bg-[var(--harbor-voile)]"
                : "border-[var(--harbor-trait)] bg-white"
            }`}
          >
            <input
              type="radio"
              name="typeJam"
              value={option.valeur}
              checked={valeurs.typeJam === option.valeur}
              onChange={() => maj({ typeJam: option.valeur })}
            />
            {option.libelle}
          </label>
        ))}
      </fieldset>

      {valeurs.typeJam === "exceptionnelle" ? (
        <label className="flex flex-col gap-2">
          <span className="text-[13px] font-bold text-[var(--harbor-marine)]">Date</span>
          <input
            type="date"
            name="dateUnique"
            min={minimum}
            value={valeurs.dateUnique}
            onChange={(e) => maj({ dateUnique: e.target.value })}
            className="champ-input"
          />
        </label>
      ) : (
        <>
          {/* Mensuel : « Rythme » seul, puis « Semaine du mois » et « Jour » côte à côte, qui se lisent
              comme la mention (« Le dernier jeudi »). Sinon « Rythme » et « Jour » côte à côte. */}
          <div className="grid grid-cols-2 gap-3">
            <ChampListe label="Rythme" className={mensuel ? "col-span-2" : undefined}>
              <select
                name="rythme"
                value={valeurs.rythme}
                onChange={(e) => maj({ rythme: e.target.value as Rythme })}
                className="champ-input"
              >
                {RYTHMES.map((rythme) => (
                  <option key={rythme.valeur} value={rythme.valeur}>
                    {rythme.libelle}
                  </option>
                ))}
              </select>
            </ChampListe>
            {mensuel && (
              <ChampListe label="Semaine du mois">
                <select
                  name="semaineDuMois"
                  value={valeurs.semaineDuMois}
                  onChange={(e) => maj({ semaineDuMois: e.target.value })}
                  className="champ-input"
                >
                  <option value="">Choisir une semaine</option>
                  {SEMAINES_DU_MOIS.map((semaine) => (
                    <option key={semaine.valeur} value={semaine.valeur}>
                      {semaine.libelle}
                    </option>
                  ))}
                </select>
              </ChampListe>
            )}
            <ChampListe label="Jour">
              <select
                name="jourSemaine"
                value={valeurs.jourSemaine}
                onChange={(e) => maj({ jourSemaine: e.target.value })}
                className="champ-input"
              >
                <option value="">Choisir un jour</option>
                {JOURS_SEMAINE.map((jour) => (
                  <option key={jour.valeur} value={jour.valeur}>
                    {jour.libelle}
                  </option>
                ))}
              </select>
            </ChampListe>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <ChampListe label="Date de début">
              <input
                type="date"
                name="debutRecurrence"
                min={minimum}
                value={valeurs.debutRecurrence}
                onChange={(e) => maj({ debutRecurrence: e.target.value })}
                className="champ-input"
              />
            </ChampListe>
            <ChampListe label="Date de fin">
              <input
                type="date"
                name="finRecurrence"
                min={valeurs.debutRecurrence || minimum}
                max={valeurs.debutRecurrence ? finMaximale(valeurs.debutRecurrence) : undefined}
                value={valeurs.finRecurrence}
                onChange={(e) => maj({ finRecurrence: e.target.value })}
                className="champ-input"
              />
            </ChampListe>
          </div>

          {erreurRegle && (
            <p className="text-[13px] font-semibold text-[var(--harbor-erreur)]">{erreurRegle}</p>
          )}
          {regle && !erreurRegle && apercu.length === 0 && (
            <p className="text-[13px] font-semibold text-[var(--harbor-erreur)]">
              {ERREUR_AUCUNE_DATE}
            </p>
          )}
          {retirees.map((date) => (
            <input key={date} type="hidden" name="datesRetirees" value={date} />
          ))}

          {apercu.length > 0 && (
            <ListeDates
              titre={`${apercu.length} ${apercu.length > 1 ? "dates" : "date"}`}
              dates={apercu}
              surRetirer={(date) => maj({ datesRetirees: [...retirees, date] })}
            />
          )}

          {!regle && valeurs.datesUneAUne.length > 0 && (
            <ListeDates
              titre="Dates choisies une à une"
              dates={valeurs.datesUneAUne}
              nomChamp="dates"
              surRetirer={(date) =>
                maj({ datesUneAUne: valeurs.datesUneAUne.filter((d) => d !== date) })
              }
            />
          )}
        </>
      )}
    </div>
  );
}

function ListeDates({
  titre,
  dates,
  nomChamp,
  surRetirer,
}: {
  titre: string;
  dates: string[];
  nomChamp?: string;
  surRetirer: (date: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[12px] font-semibold text-[var(--harbor-marine-2)]">{titre}</span>
      <ul className="flex flex-wrap gap-2">
        {dates.map((date) => (
          <li
            key={date}
            className="flex items-center gap-2 rounded-[9999px] border border-[var(--harbor-trait)] px-3 py-1 text-[12px] text-[var(--harbor-marine)]"
          >
            {formaterPastille(date)}
            <button
              type="button"
              onClick={() => surRetirer(date)}
              aria-label={`Retirer le ${date}`}
              className="text-[var(--harbor-marine-2)] active:text-[var(--harbor-erreur)]"
            >
              ×
            </button>
            {nomChamp && <input type="hidden" name={nomChamp} value={date} />}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ChampListe({
  label,
  className = "",
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`flex min-w-0 flex-col gap-2 ${className}`}>
      <span className="text-[13px] font-bold text-[var(--harbor-marine)]">{label}</span>
      {children}
    </label>
  );
}

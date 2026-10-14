"use client";

import {
  ERREUR_AUCUNE_DATE,
  JOURS_SEMAINE,
  RYTHMES,
  aujourdHuiIso,
  datesAPublier,
  erreurBornes,
  finMaximale,
  retireesPertinentes,
  type RegleRecurrence,
  type Rythme,
} from "@/lib/recurrence";

export type TypeJam = "recurrente" | "exceptionnelle";

/** État des dates du formulaire d'annonce (phase 60), hors annonce publiée. */
export type ValeursDates = {
  typeJam: TypeJam;
  dateUnique: string;
  rythme: Rythme;
  jourSemaine: string;
  debutRecurrence: string;
  finRecurrence: string;
  datesRetirees: string[];
  // Ancien brouillon aux dates saisies une à une, sans règle : affichées tant que la règle est incomplète.
  datesUneAUne: string[];
};

export const valeursDatesVides: ValeursDates = {
  typeJam: "recurrente",
  dateUnique: "",
  rythme: "CHAQUE_SEMAINE",
  jourSemaine: "",
  debutRecurrence: "",
  finRecurrence: "",
  datesRetirees: [],
  datesUneAUne: [],
};

function regleComplete(valeurs: ValeursDates): RegleRecurrence | null {
  if (!valeurs.jourSemaine || !valeurs.debutRecurrence || !valeurs.finRecurrence) return null;
  return {
    rythme: valeurs.rythme,
    jourSemaine: Number(valeurs.jourSemaine),
    debut: valeurs.debutRecurrence,
    fin: valeurs.finRecurrence,
  };
}

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
}: {
  valeurs: ValeursDates;
  onChange: (valeurs: ValeursDates) => void;
}) {
  const aujourdHui = aujourdHuiIso();
  const maj = (champs: Partial<ValeursDates>) => onChange({ ...valeurs, ...champs });
  const regle = valeurs.typeJam === "recurrente" ? regleComplete(valeurs) : null;
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
            min={aujourdHui}
            value={valeurs.dateUnique}
            onChange={(e) => maj({ dateUnique: e.target.value })}
            className="champ-input"
          />
        </label>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <ChampListe label="Rythme">
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
                min={aujourdHui}
                value={valeurs.debutRecurrence}
                onChange={(e) => maj({ debutRecurrence: e.target.value })}
                className="champ-input"
              />
            </ChampListe>
            <ChampListe label="Date de fin">
              <input
                type="date"
                name="finRecurrence"
                min={valeurs.debutRecurrence || aujourdHui}
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

function ChampListe({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex min-w-0 flex-col gap-2">
      <span className="text-[13px] font-bold text-[var(--harbor-marine)]">{label}</span>
      {children}
    </label>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { STYLES_MUSICAUX, INSTRUMENTS_BACKLINE, TOUS_LES_STYLES } from "@/lib/annonce-constantes";
import { LONGUEUR_MAX_DESCRIPTION, NOMBRE_MAX_DATES } from "@/lib/validation/annonce";
import { decisionSortie, instantane } from "@/lib/garde-sortie";
import { useGardeSortie } from "@/components/garde-sortie";
import FenetreSortie from "@/components/fenetre-sortie";
import type { ValeursReprises } from "@/lib/annonces";

type Resultat = { erreur: string } | { succes: true };

const ERREUR_RESEAU = "Connexion impossible, l'annonce n'a pas été enregistrée.";

type Fenetre =
  | { type: "brouillon-enregistre"; destination: string }
  | { type: "echec"; destination: string; raison: string }
  | { type: "avertir-perte"; destination: string };

async function appelerAction(
  action: (formData: FormData) => Promise<Resultat>,
  formData: FormData
): Promise<Resultat> {
  try {
    return await action(formData);
  } catch {
    return { erreur: ERREUR_RESEAU };
  }
}

export type ValeursInitialesAnnonce = {
  dates: string[];
  heureDebut: string;
  heureFin: string;
  styles: string[];
  styleAutre: string;
  instruments: string[];
  instrumentAutre: string;
  description: string;
};

const valeursVides: ValeursInitialesAnnonce = {
  dates: [],
  heureDebut: "",
  heureFin: "",
  styles: [],
  styleAutre: "",
  instruments: [],
  instrumentAutre: "",
  description: "",
};

export type ChoixBar =
  // Nouvelle annonce ou brouillon : bar choisi dans la liste des bars du compte.
  | { mode: "choix"; bars: { id: string; nom: string }[]; barIdInitial: string }
  // Annonce publiée : bar figé, affiché sans pouvoir être changé.
  | { mode: "fige"; nom: string };

export default function FormulaireAnnonce({
  choixBar,
  nouvelleAnnonce = false,
  reprises,
  valeursInitiales,
  afficherPhotos,
  datesModifiables = true,
  occurrencesPourPortee,
  actionBrouillon,
  actionPublier,
  actionModifier,
  destinationApresEnregistrement,
}: {
  choixBar: ChoixBar;
  // Sur une nouvelle annonce, choisir un bar ne compte pas à lui seul comme une saisie.
  nouvelleAnnonce?: boolean;
  // Nouvelle annonce : valeurs reprises de la dernière annonce publiée, par bar (phase 21).
  reprises?: Record<string, ValeursReprises>;
  valeursInitiales?: ValeursInitialesAnnonce;
  afficherPhotos: boolean;
  datesModifiables?: boolean;
  occurrencesPourPortee?: { id: string; date: string }[];
  actionBrouillon?: (formData: FormData) => Promise<Resultat>;
  actionPublier?: (formData: FormData) => Promise<Resultat>;
  actionModifier?: (formData: FormData) => Promise<Resultat>;
  // Nouvelle annonce : après « Enregistrer le brouillon » ou « Publier », on quitte le formulaire.
  destinationApresEnregistrement?: string;
}) {
  const [valeurs, setValeurs] = useState(valeursInitiales ?? valeursVides);
  const [photosReprises, setPhotosReprises] = useState<[string | null, string | null]>([
    null,
    null,
  ]);
  // Incrémentée à chaque reprise : remonte les champs non contrôlés avec les valeurs reprises.
  const [cleReprise, setCleReprise] = useState(0);
  const [barChoisi, setBarChoisi] = useState(
    choixBar.mode === "choix" ? choixBar.barIdInitial : ""
  );
  const [repriseDu, setRepriseDu] = useState<string | null>(null);
  const reprise = barChoisi ? reprises?.[barChoisi] : undefined;
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const [dates, setDates] = useState<string[]>(valeurs.dates);
  const [nouvelleDate, setNouvelleDate] = useState("");
  const [porteeOccurrenceId, setPorteeOccurrenceId] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const gardeSortie = useGardeSortie();
  const occupe = gardeSortie?.occupe ?? false;
  const setOccupe = gardeSortie?.setOccupe;
  const [fenetre, setFenetre] = useState<Fenetre | null>(null);
  // État de référence : formulaire tel qu'ouvert, puis dernier enregistrement réussi.
  const referenceRef = useRef<string | null>(null);

  const instantaneCourant = useCallback(
    () =>
      formRef.current
        ? instantane(new FormData(formRef.current), nouvelleAnnonce ? ["barId"] : [])
        : null,
    [nouvelleAnnonce]
  );
  const estModifie = useCallback(() => {
    const courant = instantaneCourant();
    return courant !== null && courant !== referenceRef.current;
  }, [instantaneCourant]);

  useEffect(() => {
    referenceRef.current = instantaneCourant();
  }, [instantaneCourant]);

  // Sortie par le navigateur (fermeture, rechargement) : alerte standard, sans enregistrement.
  useEffect(() => {
    function surAvantDechargement(e: BeforeUnloadEvent) {
      if (!estModifie()) return;
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", surAvantDechargement);
    return () => window.removeEventListener("beforeunload", surAvantDechargement);
  }, [estModifie]);

  // Sorties via l'application (Retour, « Jammix », « À confirmer », icône de profil).
  const gererSortie = useCallback(
    async (destination: string) => {
      const decision = decisionSortie({
        modifie: estModifie(),
        enregistrableEnBrouillon: Boolean(actionBrouillon),
      });
      if (decision === "directe") {
        router.push(destination);
        return;
      }
      if (decision === "avertir" || !actionBrouillon || !formRef.current) {
        setFenetre({ type: "avertir-perte", destination });
        return;
      }
      setOccupe?.(true);
      const formData = new FormData(formRef.current);
      const resultat = await appelerAction(actionBrouillon, formData);
      setOccupe?.(false);
      if ("erreur" in resultat) {
        setFenetre({ type: "echec", destination, raison: resultat.erreur });
        return;
      }
      referenceRef.current = instantaneCourant();
      setFenetre({ type: "brouillon-enregistre", destination });
    },
    [actionBrouillon, estModifie, instantaneCourant, router, setOccupe]
  );

  const enregistrerGarde = gardeSortie?.enregistrerGarde;
  useEffect(() => {
    enregistrerGarde?.(gererSortie);
    return () => enregistrerGarde?.(null);
  }, [enregistrerGarde, gererSortie]);

  function quitterVers(destination: string) {
    setFenetre(null);
    // La saisie abandonnée ne doit plus déclencher l'alerte du navigateur.
    referenceRef.current = instantaneCourant();
    router.push(destination);
  }

  // Écrase horaire, styles, instruments, précisions « Autre », description et photos,
  // y compris par du vide ; les dates ne sont jamais touchées.
  function reprendre() {
    if (!reprise) return;
    setValeurs({
      dates: [],
      heureDebut: reprise.heureDebut,
      heureFin: reprise.heureFin,
      styles: reprise.styles,
      styleAutre: reprise.styleAutre,
      instruments: reprise.instruments,
      instrumentAutre: reprise.instrumentAutre,
      description: reprise.description,
    });
    setPhotosReprises([reprise.photoUrl1, reprise.photoUrl2]);
    setCleReprise((cle) => cle + 1);
    setRepriseDu(reprise.publieeLe);
  }

  function ajouterDate() {
    if (!nouvelleDate) return;
    if (dates.includes(nouvelleDate)) {
      setErreur("Cette date est déjà dans la liste.");
      return;
    }
    if (dates.length >= NOMBRE_MAX_DATES) {
      setErreur(`${NOMBRE_MAX_DATES} dates maximum par annonce.`);
      return;
    }
    setErreur(null);
    setDates([...dates, nouvelleDate].sort());
    setNouvelleDate("");
  }

  function retirerDate(date: string) {
    setDates(dates.filter((d) => d !== date));
  }

  async function soumettre(action: (formData: FormData) => Promise<Resultat>) {
    if (!formRef.current) return;
    setErreur(null);
    setEnCours(true);
    setOccupe?.(true);
    const formData = new FormData(formRef.current);
    const resultat = await appelerAction(action, formData);
    setEnCours(false);
    setOccupe?.(false);
    if ("erreur" in resultat) {
      setErreur(resultat.erreur);
      return;
    }
    referenceRef.current = instantaneCourant();
    if (destinationApresEnregistrement) {
      router.push(destinationApresEnregistrement);
    }
  }

  const inactif = enCours || occupe;

  return (
    <form ref={formRef} className="flex flex-col gap-8" noValidate>
      {fenetre?.type === "brouillon-enregistre" && (
        <FenetreSortie
          titre="Brouillon enregistré"
          message="Annonce enregistrée en brouillon, vous pourrez la reprendre plus tard dans Mes annonces."
          libelleDefaut="OK"
          surDefaut={() => quitterVers(fenetre.destination)}
        />
      )}
      {fenetre?.type === "echec" && (
        <FenetreSortie
          titre="Enregistrement impossible"
          message={
            <>
              <p>{fenetre.raison}</p>
              <p>Rien n&apos;a été enregistré.</p>
            </>
          }
          libelleDefaut="Rester"
          surDefaut={() => setFenetre(null)}
          libelleSecondaire="Quitter sans enregistrer"
          surSecondaire={() => quitterVers(fenetre.destination)}
        />
      )}
      {fenetre?.type === "avertir-perte" && (
        <FenetreSortie
          titre="Modifications non enregistrées"
          message="Vos modifications non enregistrées seront perdues. L'annonce reste publiée telle quelle."
          libelleDefaut="Rester"
          surDefaut={() => setFenetre(null)}
          libelleSecondaire="Quitter"
          surSecondaire={() => quitterVers(fenetre.destination)}
        />
      )}

      {choixBar.mode === "choix" ? (
        <Champ label="Bar">
          <select
            name="barId"
            defaultValue={choixBar.barIdInitial}
            onChange={(e) => {
              setBarChoisi(e.target.value);
              setRepriseDu(null);
            }}
            className="champ-input"
          >
            {choixBar.bars.length > 1 && <option value="">Choisir un bar</option>}
            {choixBar.bars.map((bar) => (
              <option key={bar.id} value={bar.id}>
                {bar.nom}
              </option>
            ))}
          </select>
        </Champ>
      ) : (
        <div className="flex flex-col gap-2">
          <span className="text-[12px] font-medium uppercase text-[var(--color-warm-cream)]">
            Bar
          </span>
          <span className="text-[18px] text-[var(--color-warm-cream)]">{choixBar.nom}</span>
          <span className="text-[12px] text-[color:var(--color-texte-secondaire)]">
            Le bar d&apos;une annonce publiée ne peut plus être changé.
          </span>
        </div>
      )}

      {nouvelleAnnonce && reprise && (
        <div className="-mt-4 flex flex-col items-start gap-2">
          <button
            type="button"
            onClick={reprendre}
            className="rounded-[22.5px] border border-[var(--color-warm-cream)] px-4 py-[7.5px] text-[12px] font-medium uppercase text-[var(--color-warm-cream)]"
          >
            Reprendre la dernière annonce de ce bar
          </button>
          {repriseDu && (
            <span className="text-[12px] font-medium uppercase text-[color:var(--color-texte-secondaire)]">
              Repris de l&apos;annonce publiée le{" "}
              {new Date(repriseDu).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}{" "}
              — dates à ajouter
            </span>
          )}
        </div>
      )}

      <div className="flex flex-col gap-3">
        <span className="text-[12px] font-medium uppercase text-[var(--color-warm-cream)]">
          {dates.length > 1 ? "Dates (annonce récurrente)" : "Date"}
        </span>

        {dates.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {dates.map((date) => (
              <li
                key={date}
                className="flex items-center gap-2 rounded-[9999px] border border-[var(--color-cork-border)] px-3 py-1 text-[12px] uppercase text-[var(--color-warm-cream)]"
              >
                {new Date(date).toLocaleDateString("fr-FR", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                })}
                {datesModifiables && (
                  <button
                    type="button"
                    onClick={() => retirerDate(date)}
                    aria-label={`Retirer le ${date}`}
                    className="text-[color:var(--color-texte-secondaire)]"
                  >
                    ×
                  </button>
                )}
                <input type="hidden" name="dates" value={date} />
              </li>
            ))}
          </ul>
        )}

        {datesModifiables ? (
          <div className="flex items-end gap-3">
            <input
              type="date"
              min={new Date().toISOString().slice(0, 10)}
              value={nouvelleDate}
              onChange={(e) => setNouvelleDate(e.target.value)}
              className="champ-input"
            />
            <button
              type="button"
              onClick={ajouterDate}
              disabled={dates.length >= NOMBRE_MAX_DATES}
              className="whitespace-nowrap rounded-[22.5px] border border-[var(--color-warm-cream)] px-4 py-[7.5px] text-[12px] font-medium uppercase text-[var(--color-warm-cream)] disabled:opacity-60"
            >
              Ajouter une date
            </button>
          </div>
        ) : (
          dates.length === 0 && (
            <span className="text-[15px] text-[color:var(--color-texte-secondaire)]">
              Aucune date renseignée
            </span>
          )
        )}
      </div>

      <div key={`horaire-${cleReprise}`} className="flex gap-6">
        <Champ label="Heure de début">
          <input
            type="time"
            name="heureDebut"
            defaultValue={valeurs.heureDebut}
            className="champ-input"
          />
        </Champ>
        <Champ label="Heure de fin (optionnel)">
          <input
            type="time"
            name="heureFin"
            defaultValue={valeurs.heureFin}
            className="champ-input"
          />
        </Champ>
      </div>

      {occurrencesPourPortee && occurrencesPourPortee.length > 0 && (
        <div className="flex flex-col gap-3">
          <span className="text-[12px] font-medium uppercase text-[var(--color-warm-cream)]">
            Appliquer l&apos;horaire à
          </span>
          <select
            value={porteeOccurrenceId}
            onChange={(e) => setPorteeOccurrenceId(e.target.value)}
            className="champ-input"
          >
            <option value="">Toutes les dates</option>
            {occurrencesPourPortee.map((occurrence) => (
              <option key={occurrence.id} value={occurrence.id}>
                {new Date(occurrence.date).toLocaleDateString("fr-FR", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                })}
              </option>
            ))}
          </select>
          <input type="hidden" name="porteeOccurrenceId" value={porteeOccurrenceId} />
        </div>
      )}

      <GroupeCases
        key={`styles-${cleReprise}`}
        label="Style musical"
        nom="styles"
        options={STYLES_MUSICAUX}
        optionExclusive={TOUS_LES_STYLES}
        valeursCochees={valeurs.styles}
        nomAutre="styleAutre"
        valeurAutre={valeurs.styleAutre}
      />

      <GroupeCases
        key={`instruments-${cleReprise}`}
        label="Instruments disponibles"
        nom="instruments"
        options={INSTRUMENTS_BACKLINE}
        valeursCochees={valeurs.instruments}
        nomAutre="instrumentAutre"
        valeurAutre={valeurs.instrumentAutre}
      />

      <ChampDescription key={`description-${cleReprise}`} valeurInitiale={valeurs.description} />

      {afficherPhotos && (
        <div key={`photos-${cleReprise}`} className="flex gap-6">
          <EmplacementPhoto numero={1} photoRepriseInitiale={photosReprises[0]} />
          <EmplacementPhoto numero={2} photoRepriseInitiale={photosReprises[1]} />
        </div>
      )}

      {erreur && (
        <p className="text-[12px] font-medium uppercase text-[var(--color-gold-elegance)]">
          {erreur}
        </p>
      )}

      <div className="flex gap-4">
        {actionBrouillon && (
          <button
            type="button"
            disabled={inactif}
            onClick={() => soumettre(actionBrouillon)}
            className="rounded-[22.5px] border border-[var(--color-warm-cream)] px-4 py-[7.5px] text-[12px] font-medium uppercase text-[var(--color-warm-cream)] disabled:opacity-60"
          >
            Enregistrer le brouillon
          </button>
        )}
        {actionPublier && (
          <button
            type="button"
            disabled={inactif}
            onClick={() => soumettre(actionPublier)}
            className="rounded-[36px] bg-[var(--color-brass-copper)] px-6 py-[14px] text-[12px] font-medium uppercase text-[var(--color-warm-cream)] disabled:opacity-60"
          >
            Publier
          </button>
        )}
        {actionModifier && (
          <button
            type="button"
            disabled={inactif}
            onClick={() => soumettre(actionModifier)}
            className="rounded-[36px] bg-[var(--color-brass-copper)] px-6 py-[14px] text-[12px] font-medium uppercase text-[var(--color-warm-cream)] disabled:opacity-60"
          >
            Enregistrer les modifications
          </button>
        )}
      </div>
    </form>
  );
}

function GroupeCases({
  label,
  nom,
  options,
  optionExclusive,
  valeursCochees,
  nomAutre,
  valeurAutre,
}: {
  label: string;
  nom: string;
  options: readonly string[];
  // Cochée, elle décoche et désactive toutes les autres cases ; décochée, elle les réactive, vides.
  optionExclusive?: string;
  valeursCochees: string[];
  nomAutre: string;
  valeurAutre: string;
}) {
  const [exclusiveCochee, setExclusiveCochee] = useState(
    optionExclusive !== undefined && valeursCochees.includes(optionExclusive)
  );
  // Après un clic sur l'option exclusive, les autres cases sont remontées vides (key).
  const [basculements, setBasculements] = useState(0);
  const [autreCoche, setAutreCoche] = useState(valeursCochees.includes("Autre"));
  const autres = options.filter((option) => option !== optionExclusive);

  function basculerExclusive(cochee: boolean) {
    setExclusiveCochee(cochee);
    setBasculements((n) => n + 1);
    setAutreCoche(false);
  }

  return (
    <div className="flex flex-col gap-3">
      <span className="text-[12px] font-medium uppercase text-[var(--color-warm-cream)]">
        {label}
      </span>
      {optionExclusive !== undefined && (
        <label className="flex items-center gap-2 text-[12px] uppercase text-[var(--color-warm-cream)]">
          <input
            type="checkbox"
            name={nom}
            value={optionExclusive}
            defaultChecked={exclusiveCochee}
            onChange={(e) => basculerExclusive(e.target.checked)}
          />
          {optionExclusive}
        </label>
      )}
      <div key={basculements} className="flex flex-wrap gap-x-5 gap-y-2">
        {autres.map((option) => (
          <label
            key={option}
            className={`flex items-center gap-2 text-[12px] uppercase text-[var(--color-warm-cream)] ${
              exclusiveCochee ? "cursor-not-allowed opacity-60" : ""
            }`}
          >
            <input
              type="checkbox"
              name={nom}
              value={option}
              disabled={exclusiveCochee}
              defaultChecked={basculements === 0 && valeursCochees.includes(option)}
              onChange={
                option === "Autre" ? (e) => setAutreCoche(e.target.checked) : undefined
              }
              className="disabled:cursor-not-allowed"
            />
            {option}
          </label>
        ))}
      </div>
      {autreCoche && (
        <input
          type="text"
          name={nomAutre}
          placeholder="Précisez (optionnel)"
          defaultValue={basculements === 0 ? valeurAutre : ""}
          className="champ-input"
        />
      )}
    </div>
  );
}

function EmplacementPhoto({
  numero,
  photoRepriseInitiale,
}: {
  numero: 1 | 2;
  photoRepriseInitiale: string | null;
}) {
  const [photoReprise, setPhotoReprise] = useState(photoRepriseInitiale);
  const refFichier = useRef<HTMLInputElement>(null);
  const label = `Photo ${numero} (optionnel)`;

  // Structure stable : l'input fichier garde sa place, sinon React le remonterait et
  // perdrait le fichier choisi via « Remplacer ».
  return (
    <div className="flex flex-1 flex-col gap-2">
      <span className="text-[12px] font-medium uppercase text-[var(--color-warm-cream)]">
        {label}
      </span>
      {photoReprise && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photoReprise} alt={`Photo ${numero} reprise`} className="h-24 w-24 object-cover" />
      )}
      {photoReprise && (
        <input type="hidden" name={`photoReprise${numero}`} value={photoReprise} />
      )}
      <input
        ref={refFichier}
        type="file"
        name={`photo${numero}`}
        aria-label={label}
        accept="image/jpeg,image/png,image/webp"
        // Choisir un fichier remplace la photo reprise de cet emplacement.
        onChange={(e) => {
          if (e.target.files?.length) setPhotoReprise(null);
        }}
        className={photoReprise ? "hidden" : "champ-input champ-input--fichier"}
      />
      {photoReprise && (
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => refFichier.current?.click()}
            className="text-[12px] font-medium uppercase text-[var(--color-warm-cream)] underline"
          >
            Remplacer
          </button>
          <button
            type="button"
            onClick={() => setPhotoReprise(null)}
            className="text-[12px] font-medium uppercase text-[var(--color-warm-cream)] underline"
          >
            Retirer
          </button>
        </div>
      )}
    </div>
  );
}

function ChampDescription({ valeurInitiale }: { valeurInitiale: string }) {
  const [longueur, setLongueur] = useState(valeurInitiale.length);

  return (
    <label className="flex flex-col gap-2">
      <span className="text-[12px] font-medium uppercase text-[var(--color-warm-cream)]">
        Description (optionnel)
      </span>
      <textarea
        name="description"
        rows={4}
        maxLength={LONGUEUR_MAX_DESCRIPTION}
        defaultValue={valeurInitiale}
        onChange={(e) => setLongueur(e.target.value.length)}
        className="champ-input resize-none"
      />
      <span className="self-end text-[12px] text-[color:var(--color-texte-secondaire)]">
        {longueur}/{LONGUEUR_MAX_DESCRIPTION}
      </span>
    </label>
  );
}

function Champ({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-1 flex-col gap-2">
      <span className="text-[12px] font-medium uppercase text-[var(--color-warm-cream)]">
        {label}
      </span>
      {children}
    </label>
  );
}

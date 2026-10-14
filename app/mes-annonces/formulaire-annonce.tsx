"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { STYLES_MUSICAUX, INSTRUMENTS_BACKLINE, TOUS_LES_STYLES } from "@/lib/annonce-constantes";
import {
  LONGUEUR_MAX_CO_ORGANISATEUR,
  LONGUEUR_MAX_TITRE,
  LONGUEUR_MAX_DESCRIPTION,
} from "@/lib/validation/annonce";
import { decisionSortie, instantane } from "@/lib/garde-sortie";
import { useGardeSortie } from "@/components/garde-sortie";
import FenetreSortie from "@/components/fenetre-sortie";
import type { ValeursReprises } from "@/lib/annonces";
import { regleModifiee } from "@/lib/modification-regle";
import ChoixDates, { valeursDatesVides, type ValeursDates } from "./choix-dates";

type Resultat = { erreur: string } | { succes: true; destination?: string };

const ERREUR_RESEAU = "Connexion impossible, l'annonce n'a pas été enregistrée.";

type Fenetre =
  | { type: "brouillon-enregistre"; destination: string }
  | { type: "modification-prise-en-compte"; destination: string }
  | { type: "echec"; destination: string; raison: string }
  | { type: "avertir-perte"; destination: string }
  | { type: "recreer-dates" };

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
  // Type de jam, règle et dates (phase 60), modifiables aussi une fois publiée (phase 62).
  choixDates: ValeursDates;
  heureDebut: string;
  heureFin: string;
  styles: string[];
  styleAutre: string;
  instruments: string[];
  instrumentAutre: string;
  titre: string;
  description: string;
  coOrganisateur: string;
};

const valeursVides: ValeursInitialesAnnonce = {
  choixDates: valeursDatesVides,
  heureDebut: "",
  heureFin: "",
  styles: [],
  styleAutre: "",
  instruments: [],
  instrumentAutre: "",
  titre: "",
  description: "",
  coOrganisateur: "",
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
  dateMinimale,
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
  // Annonce publiée : sa date de début (ou sa date unique), acceptée même passée.
  dateMinimale?: string;
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
  const [choixDates, setChoixDates] = useState(valeurs.choixDates);
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

  // Écrase horaire, styles, instruments, précisions « Autre », description, co-organisateur et photos,
  // y compris par du vide, ainsi que le type, le rythme, le jour et la semaine du mois (phases 60 et 61)
  // quand l'annonce reprise en a ; les dates (date unique, début, fin) ne sont jamais touchées.
  function reprendre() {
    if (!reprise) return;
    if (reprise.typeJam) {
      const typeJam = reprise.typeJam;
      setChoixDates((choix) => ({
        ...choix,
        typeJam,
        ...(typeJam === "recurrente" && reprise.rythme
          ? {
              rythme: reprise.rythme,
              jourSemaine: reprise.jourSemaine,
              semaineDuMois: reprise.semaineDuMois,
            }
          : {}),
      }));
    }
    setValeurs({
      choixDates: valeurs.choixDates,
      heureDebut: reprise.heureDebut,
      heureFin: reprise.heureFin,
      styles: reprise.styles,
      styleAutre: reprise.styleAutre,
      instruments: reprise.instruments,
      instrumentAutre: reprise.instrumentAutre,
      titre: reprise.titre,
      description: reprise.description,
      coOrganisateur: reprise.coOrganisateur,
    });
    setPhotosReprises([reprise.photoUrl1, reprise.photoUrl2]);
    setCleReprise((cle) => cle + 1);
    setRepriseDu(reprise.publieeLe);
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
    if (resultat.destination) {
      setFenetre({ type: "modification-prise-en-compte", destination: resultat.destination });
      return;
    }
    if (destinationApresEnregistrement) {
      router.push(destinationApresEnregistrement);
    }
  }

  const inactif = enCours || occupe;
  // Annonce publiée (phase 62) : une règle qui change les dates impose la fenêtre « Recréer les dates »
  // et rend la portée sans objet (l'horaire vaut pour toutes les dates).
  const regleChangee = Boolean(actionModifier) && regleModifiee(valeurs.choixDates, choixDates);

  return (
    <form ref={formRef} className="flex flex-col gap-5" noValidate>
      {fenetre?.type === "brouillon-enregistre" && (
        <FenetreSortie
          titre="Brouillon enregistré"
          message="Annonce enregistrée en brouillon, vous pourrez la reprendre plus tard dans Mes annonces."
          libelleDefaut="OK"
          surDefaut={() => quitterVers(fenetre.destination)}
        />
      )}
      {fenetre?.type === "modification-prise-en-compte" && (
        <FenetreSortie
          titre="Modification enregistrée"
          message="La modification a été prise en compte."
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
      {fenetre?.type === "recreer-dates" && actionModifier && (
        <FenetreSortie
          titre="Recréer les dates ?"
          message={
            <>
              <p>
                Les dates à venir seront recalculées selon le nouveau rythme. Celles qui disparaissent
                seront supprimées, avec leurs confirmations et annulations.
              </p>
              <p>Les dates passées ne changent pas.</p>
            </>
          }
          libelleDefaut="Retour"
          surDefaut={() => setFenetre(null)}
          libelleSecondaire="Recréer les dates"
          surSecondaire={() => {
            setFenetre(null);
            soumettre(actionModifier);
          }}
          secondaireDanger
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
          <span className="text-[13px] font-bold text-[var(--harbor-marine)]">
            Bar
          </span>
          <span className="text-[18px] text-[var(--harbor-marine)]">{choixBar.nom}</span>
          <span className="text-[12px] text-[var(--harbor-marine-2)]">
            Le bar d&apos;une annonce publiée ne peut plus être changé.
          </span>
        </div>
      )}

      {nouvelleAnnonce && reprise && (
        <div className="flex flex-col items-start gap-2">
          <button
            type="button"
            onClick={reprendre}
            className="rounded-[12px] border border-[var(--harbor-trait)] bg-white px-4 py-2 text-[13px] font-bold text-[var(--harbor-marine)] transition-colors duration-[120ms] hover:bg-[var(--harbor-voile)] active:border-[var(--harbor-bleu-clair)] active:bg-[var(--harbor-voile)]"
          >
            Reprendre la dernière annonce de ce bar
          </button>
          {repriseDu && (
            <span className="text-[12px] font-semibold text-[var(--harbor-marine-2)]">
              Repris de l&apos;annonce publiée le{" "}
              {new Date(repriseDu).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}{" "}
              {choixDates.typeJam === "exceptionnelle"
                ? "— date à choisir"
                : "— dates de début et de fin à choisir"}
            </span>
          )}
        </div>
      )}

      <ChoixDates valeurs={choixDates} onChange={setChoixDates} dateMinimale={dateMinimale} />

      <div key={`horaire-${cleReprise}`} className="grid grid-cols-2 items-stretch gap-3">
        <Champ label="Heure de début">
          <input
            type="time"
            name="heureDebut"
            defaultValue={valeurs.heureDebut}
            className="champ-input mt-auto"
          />
        </Champ>
        <Champ label="Heure de fin (option)">
          <input
            type="time"
            name="heureFin"
            defaultValue={valeurs.heureFin}
            className="champ-input mt-auto"
          />
        </Champ>
      </div>

      {!regleChangee && occurrencesPourPortee && occurrencesPourPortee.length > 0 && (
        <div className="flex flex-col gap-3">
          <span className="text-[13px] font-bold text-[var(--harbor-marine)]">
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

      <label className="flex flex-col gap-2">
        <span className="text-[13px] font-bold text-[var(--harbor-marine)]">
          Co-organisateur (option)
        </span>
        <input
          key={`co-organisateur-${cleReprise}`}
          type="text"
          name="coOrganisateur"
          maxLength={LONGUEUR_MAX_CO_ORGANISATEUR}
          defaultValue={valeurs.coOrganisateur}
          autoComplete="off"
          className="champ-input"
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-[13px] font-bold text-[var(--harbor-marine)]">Titre (option)</span>
        <input
          key={`titre-${cleReprise}`}
          type="text"
          name="titre"
          maxLength={LONGUEUR_MAX_TITRE}
          defaultValue={valeurs.titre}
          autoComplete="off"
          className="champ-input"
        />
      </label>

      <ChampDescription key={`description-${cleReprise}`} valeurInitiale={valeurs.description} />

      {afficherPhotos && (
        <div key={`photos-${cleReprise}`} className="flex gap-6">
          <EmplacementPhoto numero={1} photoRepriseInitiale={photosReprises[0]} />
          <EmplacementPhoto numero={2} photoRepriseInitiale={photosReprises[1]} />
        </div>
      )}

      {erreur && (
        <p className="text-[13px] font-semibold text-[var(--harbor-erreur)]">
          {erreur}
        </p>
      )}

      <div className="flex gap-4">
        {actionBrouillon && (
          <button
            type="button"
            disabled={inactif}
            onClick={() => soumettre(actionBrouillon)}
            className="rounded-[12px] border border-[var(--harbor-trait)] bg-white px-4 py-2 text-[13px] font-bold text-[var(--harbor-marine)] transition-colors duration-[120ms] hover:bg-[var(--harbor-voile)] active:border-[var(--harbor-bleu-clair)] active:bg-[var(--harbor-voile)] disabled:opacity-60"
          >
            Enregistrer le brouillon
          </button>
        )}
        {actionPublier && (
          <button
            type="button"
            disabled={inactif}
            onClick={() => soumettre(actionPublier)}
            className="rounded-[12px] bg-[var(--harbor-bleu)] px-6 py-3 text-[14px] font-bold text-white transition-colors duration-[120ms] hover:bg-[var(--harbor-marine)] active:bg-[var(--harbor-marine)] disabled:opacity-60"
          >
            Publier
          </button>
        )}
        {actionModifier && (
          <button
            type="button"
            disabled={inactif}
            onClick={() =>
              regleChangee ? setFenetre({ type: "recreer-dates" }) : soumettre(actionModifier)
            }
            className="rounded-[12px] bg-[var(--harbor-bleu)] px-6 py-3 text-[14px] font-bold text-white transition-colors duration-[120ms] hover:bg-[var(--harbor-marine)] active:bg-[var(--harbor-marine)] disabled:opacity-60"
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
      <span className="text-[13px] font-bold text-[var(--harbor-marine)]">
        {label}
      </span>
      {optionExclusive !== undefined && (
        <label className="flex items-center gap-2 text-[12px] text-[var(--harbor-marine)]">
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
            className={`flex items-center gap-2 text-[12px] text-[var(--harbor-marine)] ${
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
  const label = `Photo ${numero} (option)`;

  // Structure stable : l'input fichier garde sa place, sinon React le remonterait et
  // perdrait le fichier choisi via « Remplacer ».
  return (
    <div className="flex flex-1 flex-col gap-2">
      <span className="text-[13px] font-bold text-[var(--harbor-marine)]">
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
            className="text-[13px] font-bold text-[var(--harbor-marine)] underline active:text-[var(--harbor-bleu)]"
          >
            Remplacer
          </button>
          <button
            type="button"
            onClick={() => setPhotoReprise(null)}
            className="text-[13px] font-bold text-[var(--harbor-marine)] underline active:text-[var(--harbor-bleu)]"
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
      <span className="text-[13px] font-bold text-[var(--harbor-marine)]">
        Description (option)
      </span>
      <textarea
        name="description"
        rows={4}
        maxLength={LONGUEUR_MAX_DESCRIPTION}
        defaultValue={valeurInitiale}
        onChange={(e) => setLongueur(e.target.value.length)}
        className="champ-input resize-none"
      />
      <span className="self-end text-[12px] text-[var(--harbor-marine-2)]">
        {longueur}/{LONGUEUR_MAX_DESCRIPTION}
      </span>
    </label>
  );
}

function Champ({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex min-w-0 flex-1 flex-col gap-2">
      <span className="text-[13px] font-bold text-[var(--harbor-marine)]">
        {label}
      </span>
      {children}
    </label>
  );
}

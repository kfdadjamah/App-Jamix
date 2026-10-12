import { adresseComplete } from "@/lib/adresse";
import Link from "next/link";
import { formaterDistance } from "@/lib/distance";
import BoutonItineraire from "./bouton-itineraire";
import {
  COULEURS_STATUT_OCCURRENCE,
  LIBELLES_STATUT_OCCURRENCE,
  formaterDateCourte,
  TOUS_LES_STYLES,
  libelleStyles,
} from "@/lib/annonce-constantes";
import { statutAffiche, type recupererAnnoncesPubliees } from "@/lib/annonces";

type Occurrence = Awaited<ReturnType<typeof recupererAnnoncesPubliees>>[number];

// « liste » : extrait de la description, toute la carte mène à la page de la jam.
// « fiche » (marqueur de la carte) : description complète, sans lien.
export default function CarteAnnonce({
  occurrence,
  distanceKm,
  mode,
}: {
  occurrence: Occurrence;
  distanceKm: number | null;
  mode: "liste" | "fiche";
}) {
  const statut = statutAffiche(occurrence);
  const afficherEcheance =
    (statut === "PROGRAMMEE" || statut === "EN_ATTENTE_CONFIRMATION") && occurrence.confirmationJ7;

  const { annonce } = occurrence;
  const annulee = statut === "ANNULEE";
  const nomClasses = `min-w-0 break-words font-[family-name:var(--font-jakarta)] text-[20px] font-extrabold leading-[1.2] tracking-[-0.025em] text-[var(--harbor-marine)]     annulee ? "line-through" : ""
  }`;
  const styles = annonce.styles.includes(TOUS_LES_STYLES)
    ? [libelleStyles(annonce.styles)]
    : [...annonce.styles, ...(annonce.styleAutre ? [annonce.styleAutre] : [])];
  const instruments = [
    ...annonce.instruments,
    ...(annonce.instrumentAutre ? [annonce.instrumentAutre] : []),
  ];
  const ligneChips = (libelle: string, valeurs: string[]) =>
    valeurs.length > 0 && (
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="shrink-0 text-[12px] font-semibold text-[var(--harbor-marine-3)]">{libelle}</span>
        <ul className="flex flex-wrap gap-1.5">
          {valeurs.map((valeur) => (
            <li
              key={valeur}
              className="rounded-full border border-[var(--harbor-trait)] px-2.5 py-[3px] text-[12px] font-semibold text-[var(--harbor-marine-2)]"
            >
              {valeur}
            </li>
          ))}
        </ul>
      </div>
    );
  const couleurStatut = COULEURS_STATUT_OCCURRENCE[statut];

  return (
    <div
      className={`relative flex flex-col gap-1.5 rounded-[16px] border border-[var(--harbor-trait)] bg-white p-4 shadow-[0_4px_24px_rgba(11,54,88,.08)] ${
        annulee ? "opacity-60" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        {mode === "liste" ? (
          <Link
            href={`/jams/${occurrence.id}`}
            className={`${nomClasses} after:absolute after:inset-0 after:rounded-[16px] after:content-['']`}
          >
            {annonce.bar.nom}
          </Link>
        ) : (
          <span className={nomClasses}>{annonce.bar.nom}</span>
        )}
        <span
          className="mt-0.5 max-w-[42%] shrink-0 rounded-[6px] px-2 py-[3px] text-center text-[12px] font-bold leading-[1.25] text-white"
          style={{ backgroundColor: couleurStatut }}
        >
          {LIBELLES_STATUT_OCCURRENCE[statut]}
        </span>
      </div>
      <div className="donnees-carte flex items-baseline justify-between gap-3 text-[13px] text-[var(--harbor-marine-2)]">
        <span>{adresseComplete(annonce.bar)}</span>
        {distanceKm !== null && (
          <span className="shrink-0 font-semibold text-[var(--harbor-marine)]">
            {formaterDistance(distanceKm)}
          </span>
        )}
      </div>
      <p className="donnees-carte text-[13px] font-semibold text-[var(--harbor-marine)]">
        {occurrence.heureDebut}
        {occurrence.heureFin ? ` → ${occurrence.heureFin}` : ""}
      </p>
      {afficherEcheance && (
        <span className="donnees-carte text-[12px] text-[var(--harbor-marine-2)]">
          Sera confirmée le {formaterDateCourte(new Date(occurrence.confirmationJ7!))}
        </span>
      )}
      {ligneChips("Styles", styles)}
      {ligneChips("Instruments", instruments)}
      {annonce.description && (
        <p
          className={`whitespace-pre-line text-[14px] text-[var(--harbor-marine)]             mode === "liste" ? "line-clamp-3" : ""
          }`}
        >
          {annonce.description}
        </p>
      )}
      {(annonce.photoUrl1 || annonce.photoUrl2) && (
        <div className="flex gap-3">
          {[annonce.photoUrl1, annonce.photoUrl2].filter(Boolean).map((url) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={url}
              src={url!}
              alt={annonce.bar.nom}
              className="h-24 w-24 rounded-[12px] object-cover"
            />
          ))}
        </div>
      )}
      <div className="relative z-10 self-start">
        <BoutonItineraire bar={annonce.bar} />
      </div>
    </div>
  );
}

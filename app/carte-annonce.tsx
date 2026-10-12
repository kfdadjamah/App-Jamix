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
  const nomClasses = `text-[22px] font-extrabold leading-[1.15] tracking-[-0.03em] text-[var(--harbor-marine)] ${
    annulee ? "line-through" : ""
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
      <div className="flex flex-col gap-1">
        <span className="text-[12px] font-semibold text-[var(--harbor-marine-3)]">{libelle}</span>
        <ul className="flex flex-wrap gap-1.5">
          {valeurs.map((valeur) => (
            <li
              key={valeur}
              className="rounded-full border border-[var(--harbor-trait)] px-2.5 py-0.5 text-[12px] font-semibold text-[var(--harbor-marine-2)]"
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
      className={`relative flex flex-col gap-1.5 rounded-[20px] border border-[var(--harbor-trait)] bg-white p-4 shadow-[var(--harbor-ombre-carte)] ${
        annulee ? "opacity-60" : ""
      }`}
    >
      <span
        className="self-start rounded-[8px] px-2.5 py-1 text-[12px] font-bold"
        style={{
          color: couleurStatut,
          backgroundColor: `color-mix(in srgb, ${couleurStatut} 12%, white)`,
        }}
      >
        {LIBELLES_STATUT_OCCURRENCE[statut]}
      </span>
      {mode === "liste" ? (
        <Link
          href={`/jams/${occurrence.id}`}
          className={`${nomClasses} after:absolute after:inset-0 after:rounded-[20px] after:content-['']`}
        >
          {annonce.bar.nom}
        </Link>
      ) : (
        <span className={nomClasses}>{annonce.bar.nom}</span>
      )}
      <div className="flex items-baseline justify-between gap-3 text-[13px] text-[var(--harbor-marine-2)]">
        <span>{annonce.bar.adresse}</span>
        {distanceKm !== null && (
          <span className="donnees shrink-0 font-bold text-[var(--harbor-marine)]">
            {formaterDistance(distanceKm)}
          </span>
        )}
      </div>
      <p className="donnees text-[14px] font-bold text-[var(--harbor-marine)]">
        {occurrence.heureDebut}
        {occurrence.heureFin ? ` → ${occurrence.heureFin}` : ""}
      </p>
      {afficherEcheance && (
        <span className="text-[12px] text-[var(--harbor-marine-2)]">
          Sera confirmée le {formaterDateCourte(new Date(occurrence.confirmationJ7!))}
        </span>
      )}
      {ligneChips("Styles", styles)}
      {ligneChips("Instruments", instruments)}
      {annonce.description && (
        <p
          className={`whitespace-pre-line text-[14px] text-[var(--harbor-marine)] ${
            mode === "liste" ? "line-clamp-3" : ""
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

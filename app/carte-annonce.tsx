import Link from "next/link";
import { formaterDistance } from "@/lib/distance";
import BoutonItineraire from "./bouton-itineraire";
import {
  COULEURS_STATUT_OCCURRENCE,
  LIBELLES_STATUT_OCCURRENCE,
  formaterDateCourte,
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
  const nomClasses = `truncate text-[20px] font-extrabold tracking-[-0.025em] text-[var(--harbor-marine)] ${
    annulee ? "line-through" : ""
  }`;
  const lignePuces = (libelle: string, valeur: string) => (
    <p className="flex min-w-0 gap-2 text-[13px]">
      <span className="kicker shrink-0 !text-[11px] text-[var(--harbor-marine-3)]">{libelle}</span>
      <span className="truncate text-[var(--harbor-marine-2)]">{valeur}</span>
    </p>
  );

  return (
    <div
      className={`relative flex flex-col gap-2 rounded-[16px] border border-[var(--harbor-trait)] bg-white p-4 shadow-[var(--harbor-ombre-carte)] ${
        annulee ? "opacity-60" : ""
      }`}
    >
      <div className="flex items-center justify-between gap-3">
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
          className="shrink-0 text-[12px] font-bold"
          style={{ color: COULEURS_STATUT_OCCURRENCE[statut] }}
        >
          {LIBELLES_STATUT_OCCURRENCE[statut]}
        </span>
      </div>
      <div className="flex items-center justify-between gap-2 text-[13px] text-[var(--harbor-marine-2)]">
        <span>{annonce.bar.adresse}</span>
        {distanceKm !== null && (
          <span className="donnees whitespace-nowrap font-semibold">
            {formaterDistance(distanceKm)}
          </span>
        )}
      </div>
      <span className="donnees text-[15px] font-semibold text-[var(--harbor-marine)]">
        {occurrence.heureDebut}
        {occurrence.heureFin ? ` – ${occurrence.heureFin}` : ""}
      </span>
      {afficherEcheance && (
        <span className="text-[12px] text-[var(--harbor-marine-2)]">
          Sera confirmée le {formaterDateCourte(new Date(occurrence.confirmationJ7!))}
        </span>
      )}
      {annonce.styles.length > 0 &&
        lignePuces(
          "Styles",
          `${libelleStyles(annonce.styles)}${annonce.styleAutre ? ` (${annonce.styleAutre})` : ""}`
        )}
      {annonce.instruments.length > 0 &&
        lignePuces(
          "Instruments",
          `${annonce.instruments.join(", ")}${annonce.instrumentAutre ? ` (${annonce.instrumentAutre})` : ""}`
        )}
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

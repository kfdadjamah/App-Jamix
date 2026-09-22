import Link from "next/link";
import { recupererAnnoncesPubliees } from "@/lib/annonces";
import { LIBELLES_STATUT_OCCURRENCE } from "@/lib/annonce-constantes";
import SelecteurDate from "./selecteur-date";

function aujourdHuiIso() {
  return new Date().toISOString().slice(0, 10);
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date } = await searchParams;
  const dateSelectionnee = date ?? aujourdHuiIso();
  const occurrences = await recupererAnnoncesPubliees(dateSelectionnee);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-8 px-6 py-16">
      <div>
        <h1 className="text-[41px] font-medium uppercase leading-[0.9] text-[color:var(--color-warm-cream)]">
          Jamix
        </h1>
        <p className="mt-2 text-[15px] text-[color:var(--color-driftwood)]">
          Les jams à Lyon, ce soir.
        </p>
      </div>

      <label className="flex flex-col gap-2">
        <span className="text-[12px] font-medium uppercase text-[color:var(--color-warm-cream)]">
          Date
        </span>
        <SelecteurDate dateSelectionnee={dateSelectionnee} />
      </label>

      {occurrences.length === 0 ? (
        <p className="text-[18px] leading-[1.26] text-[color:var(--color-warm-cream)]">
          Aucune jam publiée à cette date pour le moment.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {occurrences.map((occurrence) => (
            <div
              key={occurrence.id}
              className="flex flex-col gap-2 rounded-[12px] border border-[var(--color-cork-border)] p-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-[18px] font-medium uppercase text-[var(--color-warm-cream)]">
                  {occurrence.annonce.bar.nom}
                </span>
                <span className="text-[10px] font-medium uppercase text-[var(--color-driftwood)]">
                  {LIBELLES_STATUT_OCCURRENCE[occurrence.statut]}
                </span>
              </div>
              <span className="text-[12px] text-[var(--color-driftwood)]">
                {occurrence.annonce.bar.adresse}
              </span>
              <span className="text-[15px] text-[var(--color-warm-cream)]">
                {occurrence.heureDebut}
                {occurrence.heureFin ? ` – ${occurrence.heureFin}` : ""}
              </span>
              {occurrence.annonce.styles.length > 0 && (
                <span className="text-[12px] uppercase text-[var(--color-driftwood)]">
                  {occurrence.annonce.styles.join(", ")}
                  {occurrence.annonce.styleAutre ? ` (${occurrence.annonce.styleAutre})` : ""}
                </span>
              )}
              {occurrence.annonce.instruments.length > 0 && (
                <span className="text-[12px] text-[var(--color-driftwood)]">
                  Backline : {occurrence.annonce.instruments.join(", ")}
                  {occurrence.annonce.instrumentAutre
                    ? ` (${occurrence.annonce.instrumentAutre})`
                    : ""}
                </span>
              )}
              {(occurrence.annonce.photoUrl1 || occurrence.annonce.photoUrl2) && (
                <div className="flex gap-3">
                  {[occurrence.annonce.photoUrl1, occurrence.annonce.photoUrl2]
                    .filter(Boolean)
                    .map((url) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={url}
                        src={url!}
                        alt={occurrence.annonce.bar.nom}
                        className="h-24 w-24 rounded-[12px] object-cover"
                      />
                    ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Link
        href="/map"
        className="rounded-[36px] bg-[color:var(--color-brass-copper)] px-6 py-3.5 text-center text-xs font-medium uppercase text-[color:var(--color-warm-cream)]"
      >
        Voir la carte
      </Link>
    </main>
  );
}

import Link from "next/link";
import { recupererAnnoncesPubliees, recupererProchainesDatesDisponibles } from "@/lib/annonces";
import SelecteurDate from "./selecteur-date";
import ListeAnnonces from "./liste-annonces";

const NOMBRE_DATES_SUGGEREES = 3;

function aujourdHuiIso() {
  return new Date().toISOString().slice(0, 10);
}

function formaterDateCourte(dateIso: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(dateIso));
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date } = await searchParams;
  const dateSelectionnee = date ?? aujourdHuiIso();
  const occurrences = await recupererAnnoncesPubliees(dateSelectionnee);
  const prochainesDates =
    occurrences.length === 0
      ? await recupererProchainesDatesDisponibles(dateSelectionnee, NOMBRE_DATES_SUGGEREES)
      : [];

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
        <div className="flex flex-col gap-4">
          <p className="text-[18px] leading-[1.26] text-[color:var(--color-warm-cream)]">
            Aucune jam publiée à cette date pour le moment.
          </p>
          {prochainesDates.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-[12px] font-medium uppercase text-[color:var(--color-driftwood)]">
                Prochaines dates
              </span>
              <div className="flex flex-wrap gap-4">
                {prochainesDates.map((date) => (
                  <Link
                    key={date}
                    href={`/?date=${date}`}
                    className="text-[12px] font-medium uppercase text-[color:var(--color-warm-cream)] underline"
                  >
                    {formaterDateCourte(date)}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <ListeAnnonces occurrences={occurrences} />
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

import Link from "next/link";
import { recupererAnnoncesPubliees } from "@/lib/annonces";
import SelecteurDate from "./selecteur-date";
import ListeAnnonces from "./liste-annonces";

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

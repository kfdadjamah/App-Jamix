import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-start justify-center gap-6 px-10">
      <h1 className="text-4xl font-medium uppercase leading-[0.9] text-[color:var(--color-warm-cream)]">
        Jamix
      </h1>
      <p className="max-w-xl text-lg font-normal leading-[1.26] text-[color:var(--color-warm-cream)]">
        Les jams à Lyon, ce soir.
      </p>
      <Link
        href="/map"
        className="rounded-[36px] bg-[color:var(--color-brass-copper)] px-6 py-3.5 text-xs font-medium uppercase text-[color:var(--color-warm-cream)]"
      >
        Voir la carte
      </Link>
    </main>
  );
}

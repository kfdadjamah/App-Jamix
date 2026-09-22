import Link from "next/link";
import { deconnecterOrganisateur } from "@/app/mon-bar/actions";

export default function HeaderOrganisateur({ page }: { page: "mon-bar" | "mes-annonces" }) {
  return (
    <div className="flex items-center justify-between">
      <nav className="flex gap-6">
        <Link
          href="/mon-bar"
          className={`text-[12px] font-medium uppercase ${
            page === "mon-bar"
              ? "text-[var(--color-warm-cream)] underline"
              : "text-[var(--color-driftwood)]"
          }`}
        >
          Mon bar
        </Link>
        <Link
          href="/mes-annonces"
          className={`text-[12px] font-medium uppercase ${
            page === "mes-annonces"
              ? "text-[var(--color-warm-cream)] underline"
              : "text-[var(--color-driftwood)]"
          }`}
        >
          Mes annonces
        </Link>
      </nav>
      <form action={deconnecterOrganisateur}>
        <button
          type="submit"
          className="rounded-[22.5px] border border-[var(--color-warm-cream)] px-4 py-[7.5px] text-[12px] font-medium uppercase text-[var(--color-warm-cream)]"
        >
          Se déconnecter
        </button>
      </form>
    </div>
  );
}

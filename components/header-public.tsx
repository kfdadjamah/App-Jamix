import Link from "next/link";
import { auth } from "@/auth";
import IconeProfil from "./icone-profil";

export default async function HeaderPublic() {
  const session = await auth();

  return (
    <div className="flex justify-end">
      {session?.user?.id ? (
        <IconeProfil />
      ) : (
        <Link
          href="/connexion"
          className="whitespace-nowrap rounded-[22.5px] border border-[var(--color-warm-cream)] px-4 py-[7.5px] text-[12px] font-medium uppercase text-[var(--color-warm-cream)]"
        >
          Connexion organisateur
        </Link>
      )}
    </div>
  );
}

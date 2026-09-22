"use client";

import { useRouter } from "next/navigation";

export default function SelecteurDate({ dateSelectionnee }: { dateSelectionnee: string }) {
  const router = useRouter();

  return (
    <input
      type="date"
      value={dateSelectionnee}
      min={new Date().toISOString().slice(0, 10)}
      onChange={(evenement) => router.push(`/?date=${evenement.target.value}`)}
      className="w-full bg-transparent border-0 border-b border-[var(--color-warm-cream)] px-[2px] py-[1px] text-[18px] text-[var(--color-warm-cream)] focus:outline-none focus:border-[var(--color-gold-elegance)]"
      style={{ colorScheme: "dark" }}
    />
  );
}

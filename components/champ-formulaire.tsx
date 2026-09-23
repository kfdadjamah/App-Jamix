export default function ChampFormulaire({
  label,
  erreur,
  children,
}: {
  label: string;
  erreur?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-[12px] font-medium uppercase text-[var(--color-warm-cream)]">
        {label}
      </span>
      {children}
      {erreur && (
        <span className="text-[10px] font-medium uppercase text-[var(--color-gold-elegance)]">
          {erreur}
        </span>
      )}
    </label>
  );
}

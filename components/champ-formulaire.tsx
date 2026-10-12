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
      <span className="text-[13px] font-bold text-[var(--harbor-marine)]">
        {label}
      </span>
      {children}
      {erreur && (
        <span className="text-[13px] font-semibold text-[var(--harbor-erreur)]">
          {erreur}
        </span>
      )}
    </label>
  );
}

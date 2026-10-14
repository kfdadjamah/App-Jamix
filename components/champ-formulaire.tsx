export default function ChampFormulaire({
  label,
  erreur,
  indication,
  children,
}: {
  label: string;
  erreur?: string;
  indication?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-[13px] font-bold text-[var(--harbor-marine)]">
        {label}
      </span>
      {children}
      {indication && (
        <span className="text-[12px] text-[var(--harbor-marine-2)]">{indication}</span>
      )}
      {erreur && (
        <span className="text-[13px] font-semibold text-[var(--harbor-erreur)]">
          {erreur}
        </span>
      )}
    </label>
  );
}

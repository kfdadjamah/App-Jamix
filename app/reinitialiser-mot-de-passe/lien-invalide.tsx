export default function LienInvalide() {
  return (
    <div className="flex flex-col gap-8">
      <p className="text-[18px] leading-tight text-[var(--color-warm-cream)]">
        Ce lien n&apos;est plus valide. Il a peut-être expiré (validité 1 h), déjà servi, ou été
        remplacé par une demande plus récente.
      </p>
      <a
        href="/mot-de-passe-oublie"
        className="self-start rounded-[22.5px] border border-[var(--color-warm-cream)] px-6 py-[7.5px] text-[12px] font-medium uppercase text-[var(--color-warm-cream)]"
      >
        Demander un nouveau lien
      </a>
    </div>
  );
}

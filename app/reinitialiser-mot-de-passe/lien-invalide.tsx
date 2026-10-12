export default function LienInvalide() {
  return (
    <div className="flex flex-col gap-8">
      <p className="text-[18px] leading-tight text-[var(--harbor-marine)]">
        Ce lien n&apos;est plus valide. Il a peut-être expiré (validité 1 h), déjà servi, ou été
        remplacé par une demande plus récente.
      </p>
      <a
        href="/mot-de-passe-oublie"
        className="self-start rounded-[12px] border border-[var(--harbor-trait)] bg-white px-6 py-2 text-[13px] font-bold text-[var(--harbor-marine)] transition-colors duration-[120ms] hover:bg-[var(--harbor-voile)] active:border-[var(--harbor-bleu-clair)] active:bg-[var(--harbor-voile)]"
      >
        Demander un nouveau lien
      </a>
    </div>
  );
}

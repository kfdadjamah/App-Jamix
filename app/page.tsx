import Link from "next/link";
import { sessionCourante } from "@/auth";
import {
  recupererAnnoncesPubliees,
  recupererJoursAvecJams,
  recupererProchainesDatesDisponibles,
} from "@/lib/annonces";
import { fenetreSept } from "@/lib/semaine";
import { THEME_ACCUEIL } from "@/lib/theme";
import Bandeau from "@/components/bandeau";
import SelecteurDate from "./selecteur-date";
import ConsultationMusicien from "./consultation-musicien";
import type { Vue } from "./toggle-vue";
import PiedDePage from "@/components/pied-de-page";

const NOMBRE_DATES_SUGGEREES = 3;

function aujourdHuiIso() {
  return new Date().toISOString().slice(0, 10);
}

function formaterDateCourte(dateIso: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(dateIso));
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; vue?: string }>;
}) {
  const { date, vue } = await searchParams;
  const dateSelectionnee = date ?? aujourdHuiIso();
  const vueSelectionnee: Vue = vue === "carte" ? "carte" : "liste";
  const session = await sessionCourante();
  const occurrences = await recupererAnnoncesPubliees(dateSelectionnee);
  const prochainesDates =
    occurrences.length === 0
      ? await recupererProchainesDatesDisponibles(dateSelectionnee, NOMBRE_DATES_SUGGEREES)
      : [];

  if (THEME_ACCUEIL === "harbor") {
    const aujourdhui = aujourdHuiIso();
    const fenetre = fenetreSept(dateSelectionnee, aujourdhui);
    const joursAvecJams = await recupererJoursAvecJams(fenetre.debut, fenetre.fin);

    return (
      <div className="theme-harbor flex flex-1 flex-col">
        <Bandeau page="accueil" />
        <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-6 py-8">
          <div>
            <h1 className="text-[40px] font-extrabold leading-[1.1] tracking-[-0.025em]">
              Jammix
            </h1>
            <p className="mt-2 text-[16px] font-semibold text-[var(--harbor-marine-2)]">
              Choisis une date. Vois où jouer ce soir.
            </p>
          </div>

          {session?.user?.id && (
            <Link
              href="/mes-annonces"
              className="w-full rounded-[12px] bg-[var(--harbor-voile)] px-6 py-3 text-center text-[14px] font-bold text-[var(--harbor-marine)] transition-colors duration-[120ms] hover:bg-[var(--harbor-trait)]"
            >
              Accéder à mes annonces
            </Link>
          )}

          <SelecteurDate
            theme="harbor"
            dateSelectionnee={dateSelectionnee}
            aujourdhui={aujourdhui}
            vue={vueSelectionnee}
            joursAvecJams={joursAvecJams}
          />

          {occurrences.length === 0 ? (
            <div className="flex flex-col gap-4 rounded-[16px] border border-dashed border-[var(--harbor-trait)] p-4">
              <p className="text-[16px] font-semibold">
                Aucune jam publiée à cette date pour le moment.
              </p>
              {prochainesDates.length > 0 && (
                <div className="flex flex-col gap-2">
                  <span className="kicker text-[var(--harbor-marine-3)]">Prochaines dates</span>
                  <div className="flex flex-wrap gap-2">
                    {prochainesDates.map((date) => (
                      <Link
                        key={date}
                        href={`/?date=${date}`}
                        className="rounded-full bg-[var(--harbor-voile)] px-4 py-2 text-[13px] font-bold text-[var(--harbor-marine)]"
                      >
                        {formaterDateCourte(date)}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <ConsultationMusicien
              occurrences={occurrences}
              dateSelectionnee={dateSelectionnee}
              vue={vueSelectionnee}
              theme="harbor"
            />
          )}
        </main>
        <PiedDePage theme="harbor" />
      </div>
    );
  }

  return (
    <>
      <Bandeau page="accueil" />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-8 px-6 py-8">
        <div>
          <h1 className="titre-page">
            Jammix
          </h1>
          <p className="mt-2 text-[15px] text-[color:var(--color-texte-secondaire)]">
            Les jams à Lyon, ce soir.
          </p>
        </div>

        {session?.user?.id && (
          <Link
            href="/mes-annonces"
            className="w-full rounded-[36px] bg-[var(--color-brass-copper)] px-6 py-[14px] text-center text-[12px] font-medium uppercase text-[var(--color-warm-cream)]"
          >
            Accéder à mes annonces
          </Link>
        )}

        <label className="flex flex-col gap-2">
          <span className="text-[12px] font-medium uppercase text-[color:var(--color-warm-cream)]">
            Date
          </span>
          <SelecteurDate dateSelectionnee={dateSelectionnee} />
        </label>

        {occurrences.length === 0 ? (
          <div className="flex flex-col gap-4">
            <p className="text-[18px] leading-[1.26] text-[color:var(--color-warm-cream)]">
              Aucune jam publiée à cette date pour le moment.
            </p>
            {prochainesDates.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="text-[12px] font-medium uppercase text-[color:var(--color-texte-secondaire)]">
                  Prochaines dates
                </span>
                <div className="flex flex-wrap gap-4">
                  {prochainesDates.map((date) => (
                    <Link
                      key={date}
                      href={`/?date=${date}`}
                      className="text-[12px] font-medium uppercase text-[color:var(--color-warm-cream)] underline"
                    >
                      {formaterDateCourte(date)}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <ConsultationMusicien
            occurrences={occurrences}
            dateSelectionnee={dateSelectionnee}
            vue={vueSelectionnee}
          />
        )}
      </main>
      <PiedDePage />
    </>
  );
}

import Link from "next/link";
import { sessionCourante } from "@/auth";
import {
  recupererAnnoncesPubliees,
  recupererJoursAvecJams,
  recupererProchainesDatesDisponibles,
} from "@/lib/annonces";
import { fenetreSept } from "@/lib/semaine";
import Bandeau from "@/components/bandeau";
import SelecteurDate from "./selecteur-date";
import ConsultationMusicien from "./consultation-musicien";
import ToggleVue, { type Vue } from "./toggle-vue";
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
  const aujourdhui = aujourdHuiIso();
  const fenetre = fenetreSept(dateSelectionnee, aujourdhui);
  const [session, occurrences, joursAvecJams] = await Promise.all([
    sessionCourante(),
    recupererAnnoncesPubliees(dateSelectionnee),
    recupererJoursAvecJams(fenetre.debut, fenetre.fin),
  ]);
  const prochainesDates =
    occurrences.length === 0
      ? await recupererProchainesDatesDisponibles(dateSelectionnee, NOMBRE_DATES_SUGGEREES)
      : [];

  return (
    <div className="flex flex-1 flex-col">
      <Bandeau page="accueil" />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-5 px-6 pb-6 pt-5">
        {session?.user?.id && (
          <Link
            href="/mes-annonces"
            className="w-full rounded-[12px] bg-[var(--harbor-voile)] px-6 py-3 text-center text-[14px] font-bold text-[var(--harbor-marine)] transition-colors duration-[120ms] hover:bg-[var(--harbor-trait)]"
          >
            Accéder à mes annonces
          </Link>
        )}

        <ToggleVue vue={vueSelectionnee} dateSelectionnee={dateSelectionnee} />

        <SelecteurDate
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
            vue={vueSelectionnee}
           
          />
        )}
      </main>
      <PiedDePage />
    </div>
  );
}

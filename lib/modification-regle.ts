// Modification de la règle d'une annonce publiée (phase 62). Fonctions pures, partagées par le
// formulaire (ouvrir ou non la fenêtre « Recréer les dates ») et par le serveur, qui refait la
// comparaison sans se fier au client.
import { aujourdHuiIso, retireesPertinentes, type RegleRecurrence, type Rythme } from "@/lib/recurrence";

/** Type de jam, règle et dates d'une annonce, tels que les manipule le formulaire (chaînes). */
export type SaisieRegle = {
  typeJam: "recurrente" | "exceptionnelle";
  dateUnique: string;
  rythme: Rythme;
  jourSemaine: string;
  semaineDuMois: string;
  debutRecurrence: string;
  finRecurrence: string;
  datesRetirees: string[];
  // Ancienne annonce aux dates saisies une à une, sans règle.
  datesUneAUne: string[];
};

const versIso = (date: Date | null) => (date ? date.toISOString().slice(0, 10) : "");

/**
 * Saisie initiale du formulaire pour une annonce enregistrée. Une ancienne annonce à une date devient
 * exceptionnelle ; une ancienne annonce à plusieurs dates sans règle garde ses « dates choisies une à
 * une » : toutes pour un brouillon, seulement celles à venir une fois publiée (les dates passées ne
 * bougent pas).
 */
export function saisieDeLAnnonce(
  annonce: {
    estRecurrente: boolean;
    rythme: Rythme | null;
    jourSemaine: number | null;
    semaineDuMois: number | null;
    debutRecurrence: Date | null;
    finRecurrence: Date | null;
    datesRetirees: Date[];
  },
  // Dates des occurrences, AAAA-MM-JJ, triées.
  dates: string[],
  { publiee, aujourdHui = aujourdHuiIso() }: { publiee: boolean; aujourdHui?: string }
): SaisieRegle {
  return {
    typeJam: annonce.estRecurrente ? "recurrente" : "exceptionnelle",
    dateUnique: annonce.estRecurrente ? "" : versIso(annonce.debutRecurrence) || (dates[0] ?? ""),
    rythme: annonce.rythme ?? "CHAQUE_SEMAINE",
    jourSemaine: annonce.jourSemaine ? String(annonce.jourSemaine) : "",
    semaineDuMois: annonce.semaineDuMois ? String(annonce.semaineDuMois) : "",
    debutRecurrence: annonce.estRecurrente ? versIso(annonce.debutRecurrence) : "",
    finRecurrence: versIso(annonce.finRecurrence),
    datesRetirees: annonce.datesRetirees.map(versIso),
    datesUneAUne:
      annonce.estRecurrente && !annonce.rythme
        ? dates.filter((date) => !publiee || date >= aujourdHui)
        : [],
  };
}

/** Règle complète d'une saisie récurrente, ou null. */
export function regleDeLaSaisie(saisie: SaisieRegle): RegleRecurrence | null {
  if (!saisie.jourSemaine || !saisie.debutRecurrence || !saisie.finRecurrence) return null;
  const mensuel = saisie.rythme === "MENSUEL";
  if (mensuel && !saisie.semaineDuMois) return null;
  return {
    rythme: saisie.rythme,
    jourSemaine: Number(saisie.jourSemaine),
    semaineDuMois: mensuel ? Number(saisie.semaineDuMois) : null,
    debut: saisie.debutRecurrence,
    fin: saisie.finRecurrence,
  };
}

/** Saisie récurrente sans règle complète : dates choisies une à une (ou règle en cours de saisie). */
export function estUneAUne(saisie: SaisieRegle): boolean {
  return saisie.typeJam === "recurrente" && regleDeLaSaisie(saisie) === null;
}

/**
 * Clé de comparaison d'une saisie : deux saisies de même clé produisent les mêmes dates. Ignore ce qui
 * n'a pas d'effet (semaine du mois hors mensuel, dates retirées que la règle ne produit pas, règle
 * partielle d'une annonce aux dates choisies une à une).
 */
export function cleRegle(saisie: SaisieRegle): string {
  if (saisie.typeJam === "exceptionnelle") return JSON.stringify(["E", saisie.dateUnique]);
  const regle = regleDeLaSaisie(saisie);
  if (!regle) return JSON.stringify(["U", [...new Set(saisie.datesUneAUne)].sort()]);
  return JSON.stringify([
    "R",
    regle.rythme,
    regle.jourSemaine,
    regle.semaineDuMois ?? null,
    regle.debut,
    regle.fin,
    retireesPertinentes(regle, saisie.datesRetirees),
  ]);
}

/** Vrai si la saisie change les dates de l'annonce : la fenêtre « Recréer les dates » s'impose. */
export function regleModifiee(initiale: SaisieRegle, courante: SaisieRegle): boolean {
  return cleRegle(initiale) !== cleRegle(courante);
}

/**
 * Dates à supprimer et à créer pour passer des dates à venir existantes (aujourd'hui compris) aux dates
 * à venir de la nouvelle règle. Une date commune aux deux garde son occurrence et son statut ; les
 * dates passées ne sont jamais touchées.
 */
export function planRecreation(
  datesExistantes: string[],
  datesCibles: string[],
  aujourdHui: string = aujourdHuiIso()
): { aSupprimer: string[]; aCreer: string[] } {
  const aVenir = datesExistantes.filter((date) => date >= aujourdHui);
  const cibles = new Set(datesCibles.filter((date) => date >= aujourdHui));
  const existantes = new Set(aVenir);
  return {
    aSupprimer: aVenir.filter((date) => !cibles.has(date)).sort(),
    aCreer: [...cibles].filter((date) => !existantes.has(date)).sort(),
  };
}

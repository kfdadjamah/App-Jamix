const MS_PAR_JOUR = 24 * 60 * 60 * 1000;

export function ajouterJours(dateIso: string, jours: number): string {
  return new Date(new Date(dateIso).getTime() + jours * MS_PAR_JOUR).toISOString().slice(0, 10);
}

/**
 * Bandeau de 7 jours du pilote Harbor : blocs de 7 jours ancrés sur aujourd'hui, pour que la
 * fenêtre reste stable quand on clique un jour. Les flèches (± 7 jours) gardent le même jour de bloc.
 */
export function fenetreSept(dateIso: string, aujourdhuiIso: string) {
  const ecart = Math.round(
    (new Date(dateIso).getTime() - new Date(aujourdhuiIso).getTime()) / MS_PAR_JOUR
  );
  const debut = ajouterJours(aujourdhuiIso, Math.floor(ecart / 7) * 7);
  const jours = Array.from({ length: 7 }, (_, i) => ajouterJours(debut, i));
  return { debut, fin: jours[6], jours };
}

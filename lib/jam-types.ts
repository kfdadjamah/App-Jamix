export type OccurrenceStatus =
  | "programmee"
  | "confirmee"
  | "en_attente_confirmation"
  | "annulee";

export interface Bar {
  id: string;
  nom: string;
  adresse: string;
  lat: number;
  lng: number;
}

export interface Occurrence {
  id: string;
  barId: string;
  date: string; // ISO yyyy-mm-dd
  heureDebut: string; // "HH:mm"
  heureFin: string; // "HH:mm"
  style: string;
  status: OccurrenceStatus;
  confirmationJ7: string; // ISO yyyy-mm-dd, échéance J-7
}

export type StickerState = "confirmee" | "en_attente" | "live" | "annulee";

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

/** Statut d'affichage du sticker : dérive "live" d'une occurrence confirmée
 * dont la date est aujourd'hui et l'heure actuelle est dans la tranche horaire. */
export function getStickerState(occurrence: Occurrence, now: Date): StickerState {
  if (occurrence.status === "annulee") return "annulee";

  const todayIso = now.toISOString().slice(0, 10);
  if (occurrence.status === "confirmee" && occurrence.date === todayIso) {
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const start = toMinutes(occurrence.heureDebut);
    const end = toMinutes(occurrence.heureFin);
    if (nowMinutes >= start && nowMinutes < end) return "live";
  }

  if (occurrence.status === "confirmee") return "confirmee";
  return "en_attente"; // programmee ou en_attente_confirmation
}

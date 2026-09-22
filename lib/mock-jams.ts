import type { Bar, Occurrence } from "./jam-types";

export const mockBars: Bar[] = [
  { id: "bar-1", nom: "Le Vinyle Bar", adresse: "12 rue Sainte-Catherine, Lyon 1er", lat: 45.7679, lng: 4.8352 },
  { id: "bar-2", nom: "L'Alambic", adresse: "8 rue des Capucins, Lyon 1er", lat: 45.7699, lng: 4.831 },
  { id: "bar-3", nom: "Le Repaire Jazz", adresse: "45 rue Sébastien Gryphe, Lyon 7e", lat: 45.7492, lng: 4.8354 },
  { id: "bar-4", nom: "Chez Mistral", adresse: "3 quai Saint-Vincent, Lyon 1er", lat: 45.7691, lng: 4.8266 },
];

function isoDate(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

function hhmm(offsetMinutes: number): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() + offsetMinutes);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export const mockOccurrences: Occurrence[] = [
  {
    id: "occ-1",
    barId: "bar-1",
    date: isoDate(2),
    heureDebut: "20:30",
    heureFin: "23:30",
    style: "Jazz",
    status: "confirmee",
    confirmationJ7: isoDate(-5),
  },
  {
    id: "occ-2",
    barId: "bar-2",
    date: isoDate(12),
    heureDebut: "20:00",
    heureFin: "23:00",
    style: "Funk / Soul",
    status: "programmee",
    confirmationJ7: isoDate(5),
  },
  {
    id: "occ-3",
    barId: "bar-3",
    date: new Date().toISOString().slice(0, 10),
    heureDebut: hhmm(-30),
    heureFin: hhmm(90),
    style: "Blues",
    status: "confirmee",
    confirmationJ7: isoDate(-9),
  },
  {
    id: "occ-4",
    barId: "bar-4",
    date: isoDate(4),
    heureDebut: "21:00",
    heureFin: "23:59",
    style: "Rock",
    status: "confirmee",
    confirmationJ7: isoDate(-2),
  },
];

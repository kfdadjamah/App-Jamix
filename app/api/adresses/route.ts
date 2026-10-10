import { NextResponse } from "next/server";
import {
  LONGUEUR_MIN_ADRESSE,
  NB_SUGGESTIONS_MAX,
  normaliserSuggestions,
} from "@/lib/suggestions-adresse";

// Échec silencieux : une liste vide laisse le champ libre.
export async function GET(requete: Request) {
  const q = new URL(requete.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < LONGUEUR_MIN_ADRESSE) return NextResponse.json({ suggestions: [] });
  try {
    const reponse = await fetch(
      `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(q)}&limit=${NB_SUGGESTIONS_MAX}`
    );
    if (!reponse.ok) return NextResponse.json({ suggestions: [] });
    return NextResponse.json({ suggestions: normaliserSuggestions(await reponse.json()) });
  } catch {
    return NextResponse.json({ suggestions: [] });
  }
}

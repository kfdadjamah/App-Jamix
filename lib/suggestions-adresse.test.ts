import { describe, expect, it } from "vitest";
import { normaliserSuggestions } from "./suggestions-adresse";

describe("normaliserSuggestions", () => {
  it("extrait les libellés", () => {
    const d = { features: [{ properties: { label: "12 Rue X 69001 Lyon" } }] };
    expect(normaliserSuggestions(d)).toEqual(["12 Rue X 69001 Lyon"]);
  });
  it("ignore les entrées invalides", () => {
    const d = { features: [{}, { properties: { label: 3 } }, { properties: { label: " " } }] };
    expect(normaliserSuggestions(d)).toEqual([]);
  });
  it("limite à 5 et tolère une réponse inattendue", () => {
    const f = Array.from({ length: 8 }, (_, i) => ({ properties: { label: `a${i}` } }));
    expect(normaliserSuggestions({ features: f })).toHaveLength(5);
    expect(normaliserSuggestions(null)).toEqual([]);
    expect(normaliserSuggestions({})).toEqual([]);
  });
});

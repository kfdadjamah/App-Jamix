import { describe, expect, it } from "vitest";
import { apercuDescription } from "@/lib/apercu";

describe("apercuDescription", () => {
  it("garde une description courte en entier", () => {
    expect(apercuDescription("Inscription sur place")).toBe("Inscription sur place");
    expect(apercuDescription("a".repeat(30))).toBe("a".repeat(30));
  });

  it("coupe sans couper un mot et ajoute « … »", () => {
    expect(apercuDescription("Bœuf blues ouvert à tous, venez avec vos instruments")).toBe("Bœuf blues ouvert à tous,…");
  });

  it("garde 30 caractères quand la coupure tombe entre deux mots", () => {
    expect(apercuDescription(`${"a".repeat(29)} bbb`)).toBe(`${"a".repeat(29)}…`);
    expect(apercuDescription(`${"a".repeat(30)} bbb`)).toBe(`${"a".repeat(30)}…`);
  });

  it("coupe à 30 un premier mot trop long", () => {
    expect(apercuDescription("a".repeat(45))).toBe(`${"a".repeat(30)}…`);
  });

  it("traite les retours à la ligne comme des espaces", () => {
    expect(apercuDescription("Ligne un\n\nLigne deux")).toBe("Ligne un Ligne deux");
  });

  it("renvoie null sans description", () => {
    expect(apercuDescription(null)).toBeNull();
    expect(apercuDescription("  \n ")).toBeNull();
  });
});

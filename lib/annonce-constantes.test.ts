import { describe, expect, it } from "vitest";
import { libelleStyles } from "./annonce-constantes";

describe("libelleStyles", () => {
  it("liste les styles séparés par des virgules", () => {
    expect(libelleStyles(["Jazz", "Blues"])).toBe("Jazz, Blues");
  });

  it("affiche « Tous styles » à la place de la liste", () => {
    expect(libelleStyles(["Tous les styles"])).toBe("Tous styles");
  });
});

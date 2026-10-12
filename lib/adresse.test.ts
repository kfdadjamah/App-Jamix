import { describe, expect, it } from "vitest";
import { adresseComplete, separerCodePostal } from "./adresse";

describe("separerCodePostal", () => {
  it("retire le code postal du libellé de l'API Adresse", () => {
    expect(separerCodePostal("18 Rue Sainte-Hélène 69002 Lyon")).toEqual({
      adresse: "18 Rue Sainte-Hélène, Lyon",
      codePostal: "69002",
    });
    expect(separerCodePostal("18 rue Sainte-Hélène, 69002 Lyon")).toEqual({
      adresse: "18 rue Sainte-Hélène, Lyon",
      codePostal: "69002",
    });
  });

  it("laisse intact un libellé sans code postal", () => {
    expect(separerCodePostal("18 rue Sainte-Hélène, Lyon")).toEqual({
      adresse: "18 rue Sainte-Hélène, Lyon",
      codePostal: "",
    });
  });
});

describe("adresseComplete", () => {
  it("insère le code postal avant la ville", () => {
    expect(adresseComplete({ adresse: "18 rue X, Lyon", codePostal: "69002" })).toBe(
      "18 rue X, 69002 Lyon"
    );
  });

  it("renvoie l'adresse seule sans code postal", () => {
    expect(adresseComplete({ adresse: "18 rue X, Lyon", codePostal: "" })).toBe("18 rue X, Lyon");
  });

  it("gère une adresse sans virgule", () => {
    expect(adresseComplete({ adresse: "Lyon", codePostal: "69002" })).toBe("Lyon, 69002");
  });
});

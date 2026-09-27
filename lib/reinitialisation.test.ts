import { describe, expect, it } from "vitest";
import {
  DUREE_VALIDITE_JETON_MS,
  demandeTropRapprochee,
  genererJeton,
  hacherJeton,
  jetonEstValide,
  lienReinitialisation,
} from "./reinitialisation";

const maintenant = new Date("2026-09-27T12:00:00Z");
const minutes = (n: number) => n * 60 * 1000;

describe("genererJeton", () => {
  it("stocke le hash du jeton brut, pas le jeton lui-même", () => {
    const jeton = genererJeton(maintenant);
    expect(jeton.hash).toBe(hacherJeton(jeton.brut));
    expect(jeton.hash).not.toBe(jeton.brut);
  });

  it("expire 1 h après la demande", () => {
    const jeton = genererJeton(maintenant);
    expect(jeton.expireLe.getTime() - maintenant.getTime()).toBe(DUREE_VALIDITE_JETON_MS);
  });

  it("produit un jeton différent à chaque appel", () => {
    expect(genererJeton().brut).not.toBe(genererJeton().brut);
  });
});

describe("jetonEstValide", () => {
  it("refuse un jeton introuvable (utilisé ou remplacé)", () => {
    expect(jetonEstValide(null, maintenant)).toBe(false);
  });

  it("accepte un jeton non expiré", () => {
    expect(jetonEstValide({ expireLe: new Date(maintenant.getTime() + 1000) }, maintenant)).toBe(
      true
    );
  });

  it("refuse un jeton expiré", () => {
    expect(jetonEstValide({ expireLe: maintenant }, maintenant)).toBe(false);
  });
});

describe("demandeTropRapprochee", () => {
  const jetonCree = (ilYa: number) => {
    const createdAt = new Date(maintenant.getTime() - ilYa);
    return { createdAt, expireLe: new Date(createdAt.getTime() + DUREE_VALIDITE_JETON_MS) };
  };

  it("bloque une demande moins de 2 min après la précédente", () => {
    expect(demandeTropRapprochee([jetonCree(minutes(1))], maintenant)).toBe(true);
  });

  it("autorise une demande 2 min après la précédente", () => {
    expect(demandeTropRapprochee([jetonCree(minutes(2))], maintenant)).toBe(false);
  });

  it("autorise une première demande", () => {
    expect(demandeTropRapprochee([], maintenant)).toBe(false);
  });
});

describe("lienReinitialisation", () => {
  it("pointe vers la page de réinitialisation avec le jeton", () => {
    expect(lienReinitialisation("https://jamix.fr", "abc-_1")).toBe(
      "https://jamix.fr/reinitialiser-mot-de-passe?jeton=abc-_1"
    );
  });
});

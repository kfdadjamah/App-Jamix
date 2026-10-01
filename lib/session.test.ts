import { describe, expect, it } from "vitest";
import { sessionEstValide } from "./session";

const changement = new Date("2026-10-01T12:00:00Z");
const avant = changement.getTime() - 1000;
const apres = changement.getTime() + 1000;

describe("sessionEstValide", () => {
  it("rejette la session d'un organisateur supprimé", () => {
    expect(sessionEstValide(apres, null)).toBe(false);
  });

  it("accepte toute session tant que le mot de passe n'a jamais changé", () => {
    expect(sessionEstValide(avant, { motDePasseModifieLe: null })).toBe(true);
    expect(sessionEstValide(undefined, { motDePasseModifieLe: null })).toBe(true);
  });

  it("rejette une session sans date d'émission après un changement", () => {
    expect(sessionEstValide(undefined, { motDePasseModifieLe: changement })).toBe(false);
  });

  it("rejette une session émise avant le changement", () => {
    expect(sessionEstValide(avant, { motDePasseModifieLe: changement })).toBe(false);
  });

  it("accepte une session émise au moment du changement ou après", () => {
    expect(sessionEstValide(changement.getTime(), { motDePasseModifieLe: changement })).toBe(true);
    expect(sessionEstValide(apres, { motDePasseModifieLe: changement })).toBe(true);
  });
});

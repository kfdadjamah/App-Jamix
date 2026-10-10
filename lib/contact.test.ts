import { describe, expect, it } from "vitest";
import { empreinteIp, ipDuClient, limiteEnvoisAtteinte } from "./contact";

const maintenant = new Date("2026-10-10T12:00:00Z");
const ilYA = (minutes: number) => new Date(maintenant.getTime() - minutes * 60 * 1000);

describe("limiteEnvoisAtteinte", () => {
  it("laisse passer jusqu'à 5 envois dans l'heure", () => {
    expect(limiteEnvoisAtteinte([], maintenant)).toBe(false);
    expect(limiteEnvoisAtteinte([1, 2, 3, 4].map(ilYA), maintenant)).toBe(false);
  });

  it("bloque le 6e envoi en moins d'une heure", () => {
    expect(limiteEnvoisAtteinte([1, 10, 20, 30, 59].map(ilYA), maintenant)).toBe(true);
  });

  it("ne compte pas les envois de plus d'une heure (fenêtre glissante)", () => {
    expect(limiteEnvoisAtteinte([1, 10, 20, 30, 60].map(ilYA), maintenant)).toBe(false);
    expect(limiteEnvoisAtteinte([61, 90, 120, 180, 600].map(ilYA), maintenant)).toBe(false);
  });
});

describe("empreinteIp", () => {
  it("ne contient jamais l'IP en clair et dépend de la clé", () => {
    const empreinte = empreinteIp("203.0.113.7", "secret-a");
    expect(empreinte).toMatch(/^[0-9a-f]{64}$/);
    expect(empreinte).not.toContain("203.0.113.7");
    expect(empreinteIp("203.0.113.7", "secret-a")).toBe(empreinte);
    expect(empreinteIp("203.0.113.7", "secret-b")).not.toBe(empreinte);
    expect(empreinteIp("203.0.113.8", "secret-a")).not.toBe(empreinte);
  });

  it("refuse une clé absente", () => {
    expect(() => empreinteIp("203.0.113.7", "")).toThrow();
  });
});

describe("ipDuClient", () => {
  it("prend la première IP de x-forwarded-for", () => {
    expect(ipDuClient(new Headers({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" }))).toBe(
      "203.0.113.7"
    );
  });

  it("se replie sur x-real-ip, puis sur « inconnue »", () => {
    expect(ipDuClient(new Headers({ "x-real-ip": "198.51.100.2" }))).toBe("198.51.100.2");
    expect(ipDuClient(new Headers())).toBe("inconnue");
  });
});

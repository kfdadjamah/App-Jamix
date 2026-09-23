import { describe, expect, it } from "vitest";
import { applicationsCarto, detecterAppareil } from "./itineraire";

const BAR = {
  nom: "Le Sirius",
  adresse: "4 quai Augagneur, Lyon",
  latitude: 45.7597,
  longitude: 4.8422,
};
const BAR_SANS_COORDONNEES = { ...BAR, latitude: null, longitude: null };

const ORDINATEUR = { apple: false, mobile: false };
const MAC = { apple: true, mobile: false };
const ANDROID = { apple: false, mobile: true };
const IPHONE = { apple: true, mobile: true };

function noms(appareil: { apple: boolean; mobile: boolean }) {
  return applicationsCarto(BAR, appareil).map((app) => app.nom);
}

describe("applicationsCarto — choix des applications selon l'appareil", () => {
  it("ordinateur non Apple : Google Maps seul", () => {
    expect(noms(ORDINATEUR)).toEqual(["Google Maps"]);
  });

  it("Mac : Google Maps et Plans, sans Waze ni Citymapper", () => {
    expect(noms(MAC)).toEqual(["Google Maps", "Plans"]);
  });

  it("mobile Android : Google Maps, Waze, Citymapper, sans Plans", () => {
    expect(noms(ANDROID)).toEqual(["Google Maps", "Waze", "Citymapper"]);
  });

  it("iPhone : les 4 applications", () => {
    expect(noms(IPHONE)).toEqual(["Google Maps", "Plans", "Waze", "Citymapper"]);
  });
});

describe("applicationsCarto — le bar est la destination", () => {
  it("utilise les coordonnées du bar quand elles existent", () => {
    const urls = applicationsCarto(BAR, IPHONE).map((app) => app.url);
    for (const url of urls) expect(url).toContain("45.7597,4.8422");
  });

  it("se rabat sur l'adresse quand le bar n'est pas géocodé", () => {
    const urls = applicationsCarto(BAR_SANS_COORDONNEES, IPHONE).map((app) => app.url);
    for (const url of urls) {
      expect(url).toContain(encodeURIComponent(BAR.adresse));
      expect(url).not.toContain("null");
    }
  });

  it("n'impose jamais de point de départ (fonctionne sans géolocalisation)", () => {
    const urls = applicationsCarto(BAR, IPHONE).map((app) => app.url);
    for (const url of urls) expect(url).not.toMatch(/origin=|saddr=|startcoord=/);
  });

  it("passe par des liens web universels (repli sur la version web)", () => {
    const urls = applicationsCarto(BAR, IPHONE).map((app) => app.url);
    for (const url of urls) expect(url.startsWith("https://")).toBe(true);
  });
});

describe("detecterAppareil", () => {
  it("reconnaît un iPhone comme Apple", () => {
    expect(detecterAppareil("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)", true)).toEqual(
      IPHONE,
    );
  });

  it("reconnaît un iPad en mode bureau (UA Macintosh) comme Apple", () => {
    expect(detecterAppareil("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", true).apple).toBe(true);
  });

  it("un Android n'est pas Apple", () => {
    expect(detecterAppareil("Mozilla/5.0 (Linux; Android 14; Pixel 8)", true)).toEqual(ANDROID);
  });
});

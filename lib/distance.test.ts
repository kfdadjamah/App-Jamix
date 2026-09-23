import { describe, expect, it } from "vitest";
import { distanceJusquAuBar, formaterDistance } from "./distance";

const BELLECOUR = { latitude: 45.7578, longitude: 4.832 };
const PART_DIEU = { latitude: 45.7606, longitude: 4.8593 };

describe("distanceJusquAuBar", () => {
  it("renvoie null sans position du musicien", () => {
    expect(distanceJusquAuBar(null, PART_DIEU)).toBeNull();
  });

  it("renvoie null quand le bar n'a pas de coordonnées", () => {
    expect(distanceJusquAuBar(BELLECOUR, { latitude: null, longitude: null })).toBeNull();
  });

  it("calcule la distance Bellecour → Part-Dieu (environ 2 km)", () => {
    const distance = distanceJusquAuBar(BELLECOUR, PART_DIEU);
    expect(distance).not.toBeNull();
    expect(distance!).toBeGreaterThan(1.9);
    expect(distance!).toBeLessThan(2.3);
  });
});

describe("formaterDistance", () => {
  it("affiche les distances courtes en mètres, arrondies aux 100 m", () => {
    expect(formaterDistance(0.42)).toBe("400 m");
  });

  it("bascule en km quand l'arrondi atteint 1000 m", () => {
    expect(formaterDistance(0.96)).toBe("1.0 km");
  });

  it("affiche une décimale sous 10 km", () => {
    expect(formaterDistance(3.26)).toBe("3.3 km");
  });

  it("bascule au km entier quand l'arrondi atteint 10 km", () => {
    expect(formaterDistance(9.96)).toBe("10 km");
    expect(formaterDistance(9.94)).toBe("9.9 km");
  });

  it("arrondit au km au-delà de 10 km", () => {
    expect(formaterDistance(12.4)).toBe("12 km");
  });
});

import { describe, expect, it, vi } from "vitest";
import { coordonneesApresModification, urlsPhotosDuCompte } from "./compte";

const ADRESSE = "4 quai Augagneur, Lyon";
const NOUVELLE_ADRESSE = "20 rue de la République, Lyon";

describe("coordonneesApresModification", () => {
  it("ne re-géocode pas une adresse inchangée", async () => {
    const geocoder = vi.fn();
    expect(await coordonneesApresModification(ADRESSE, ADRESSE, geocoder)).toEqual({});
    expect(geocoder).not.toHaveBeenCalled();
  });

  it("renvoie les nouvelles coordonnées quand le géocodage réussit", async () => {
    const geocoder = vi.fn().mockResolvedValue({ latitude: 45.76, longitude: 4.836 });
    expect(await coordonneesApresModification(ADRESSE, NOUVELLE_ADRESSE, geocoder)).toEqual({
      latitude: 45.76,
      longitude: 4.836,
    });
    expect(geocoder).toHaveBeenCalledWith(NOUVELLE_ADRESSE);
  });

  it("remet les coordonnées à null quand le géocodage échoue", async () => {
    const geocoder = vi.fn().mockResolvedValue(null);
    expect(await coordonneesApresModification(ADRESSE, NOUVELLE_ADRESSE, geocoder)).toEqual({
      latitude: null,
      longitude: null,
    });
  });
});

describe("urlsPhotosDuCompte", () => {
  it("renvoie une liste vide sans bar", () => {
    expect(urlsPhotosDuCompte(null)).toEqual([]);
  });

  it("ignore un bar sans photo et sans annonce", () => {
    expect(urlsPhotosDuCompte({ photoUrl: null, annonces: [] })).toEqual([]);
  });

  it("collecte la photo du bar et les photos des annonces (0, 1 ou 2)", () => {
    expect(
      urlsPhotosDuCompte({
        photoUrl: "bar.jpg",
        annonces: [
          { photoUrl1: null, photoUrl2: null },
          { photoUrl1: "a1.jpg", photoUrl2: null },
          { photoUrl1: "b1.jpg", photoUrl2: "b2.jpg" },
        ],
      })
    ).toEqual(["bar.jpg", "a1.jpg", "b1.jpg", "b2.jpg"]);
  });

  it("collecte les photos d'annonces même sans photo de bar", () => {
    expect(
      urlsPhotosDuCompte({ photoUrl: null, annonces: [{ photoUrl1: "a1.jpg", photoUrl2: null }] })
    ).toEqual(["a1.jpg"]);
  });
});

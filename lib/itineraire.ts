export interface Destination {
  nom: string;
  adresse: string;
  latitude: number | null;
  longitude: number | null;
}

export interface Appareil {
  apple: boolean;
  mobile: boolean;
}

export interface ApplicationCarto {
  nom: string;
  url: string;
}

// Liens universels : ils ouvrent l'application si elle est installée, sa version web sinon.
// Le bar est la destination ; le départ est laissé à l'application (pas besoin de géolocalisation).
export function applicationsCarto(bar: Destination, appareil: Appareil): ApplicationCarto[] {
  const coordonnees =
    bar.latitude !== null && bar.longitude !== null ? `${bar.latitude},${bar.longitude}` : null;
  const adresse = encodeURIComponent(bar.adresse);
  const destination = coordonnees ?? adresse;

  const applications = [
    {
      nom: "Google Maps",
      url: `https://www.google.com/maps/dir/?api=1&destination=${destination}`,
      visible: true,
    },
    {
      nom: "Plans",
      url: `https://maps.apple.com/?daddr=${destination}`,
      visible: appareil.apple,
    },
    {
      nom: "Waze",
      url: coordonnees
        ? `https://waze.com/ul?ll=${coordonnees}&navigate=yes`
        : `https://waze.com/ul?q=${adresse}&navigate=yes`,
      visible: appareil.mobile,
    },
    {
      nom: "Citymapper",
      url:
        "https://citymapper.com/directions?" +
        (coordonnees ? `endcoord=${coordonnees}&` : "") +
        `endname=${encodeURIComponent(bar.nom)}&endaddress=${adresse}`,
      visible: appareil.mobile,
    },
  ];

  return applications.filter((app) => app.visible).map(({ nom, url }) => ({ nom, url }));
}

// iPadOS se présente comme « Macintosh » : il est bien compté comme appareil Apple.
export function detecterAppareil(userAgent: string, pointeurGrossier: boolean): Appareil {
  return {
    apple: /iPhone|iPad|iPod|Macintosh/.test(userAgent),
    mobile: pointeurGrossier,
  };
}

"use client";

import { useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { StatutOccurrence } from "@prisma/client";
import {
  COULEURS_STATUT_OCCURRENCE,
  LIBELLES_STATUT_OCCURRENCE,
  PRIORITE_STATUT_OCCURRENCE,
} from "@/lib/annonce-constantes";
import { statutAffiche, type recupererAnnoncesPubliees } from "@/lib/annonces";

type Occurrence = Awaited<ReturnType<typeof recupererAnnoncesPubliees>>[number];

const CENTRE_LYON: [number, number] = [4.835, 45.764];

function creerElementMarqueur(nomBar: string, statut: StatutOccurrence): HTMLDivElement {
  const couleur = COULEURS_STATUT_OCCURRENCE[statut];
  const wrapper = document.createElement("div");
  wrapper.className = "jam-sticker";
  wrapper.style.opacity = statut === "ANNULEE" ? "0.55" : "1";
  wrapper.style.cursor = "pointer";

  wrapper.innerHTML = `
    <div class="jam-sticker__pill" style="border-color:${couleur}">
      <span class="jam-sticker__dot" style="background:${couleur}"></span>
      <div class="jam-sticker__text">
        <span class="jam-sticker__name">${nomBar}</span>
        <span class="jam-sticker__sub">${LIBELLES_STATUT_OCCURRENCE[statut]}</span>
      </div>
    </div>
    <div class="jam-sticker__pointer" style="border-top-color:${couleur}"></div>
  `;

  return wrapper;
}

function statutPrioritaire(occurrences: Occurrence[]): StatutOccurrence {
  let meilleur = statutAffiche(occurrences[0]);
  for (const occurrence of occurrences.slice(1)) {
    const statut = statutAffiche(occurrence);
    if (PRIORITE_STATUT_OCCURRENCE[statut] < PRIORITE_STATUT_OCCURRENCE[meilleur]) {
      meilleur = statut;
    }
  }
  return meilleur;
}

interface JamMapProps {
  occurrences: Occurrence[];
  onSelectionBar: (barId: string) => void;
}

export default function JamMap({ occurrences, onSelectionBar }: JamMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {
          "carto-dark": {
            type: "raster",
            tiles: [
              "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
              "https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
              "https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
            ],
            tileSize: 256,
            attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
          },
        },
        layers: [
          { id: "background", type: "background", paint: { "background-color": "#100904" } },
          { id: "carto-dark-layer", type: "raster", source: "carto-dark" },
        ],
      },
      center: CENTRE_LYON,
      zoom: 13,
      attributionControl: { compact: true },
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const occurrencesParBar = new Map<string, Occurrence[]>();
    for (const occurrence of occurrences) {
      const bar = occurrence.annonce.bar;
      if (bar.latitude === null || bar.longitude === null) continue;
      const liste = occurrencesParBar.get(bar.id) ?? [];
      liste.push(occurrence);
      occurrencesParBar.set(bar.id, liste);
    }

    const markers: maplibregl.Marker[] = [];

    for (const [barId, occurrencesDuBar] of occurrencesParBar) {
      const bar = occurrencesDuBar[0].annonce.bar;
      const statut = statutPrioritaire(occurrencesDuBar);
      const el = creerElementMarqueur(bar.nom, statut);
      el.addEventListener("click", () => onSelectionBar(barId));

      const marker = new maplibregl.Marker({ element: el, anchor: "bottom" })
        .setLngLat([bar.longitude!, bar.latitude!])
        .addTo(map);

      markers.push(marker);
    }

    return () => {
      markers.forEach((m) => m.remove());
    };
  }, [occurrences, onSelectionBar]);

  return <div ref={containerRef} className="jam-map h-full w-full" />;
}

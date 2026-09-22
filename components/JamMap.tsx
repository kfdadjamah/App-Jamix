"use client";

import { useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { getStickerState, type Bar, type Occurrence, type StickerState } from "@/lib/jam-types";

const STATE_COLOR: Record<StickerState, string> = {
  confirmee: "#22c55e",
  en_attente: "#a89a8c",
  live: "#ef4444",
  annulee: "#6c5f51",
};

const STATE_LABEL: Record<StickerState, string> = {
  confirmee: "Confirmée",
  en_attente: "En attente de confirmation",
  live: "En cours · Live",
  annulee: "Annulée",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function subLabel(occurrence: Occurrence, state: StickerState): string {
  if (state === "live") return "En cours · Live";
  if (state === "annulee") return "Annulée";
  if (state === "en_attente") {
    return occurrence.status === "programmee"
      ? `Sera confirmée le ${formatDate(occurrence.confirmationJ7)}`
      : "En attente de confirmation";
  }
  return `Confirmée · ${occurrence.heureDebut} · ${occurrence.style}`;
}

function createStickerElement(bar: Bar, occurrence: Occurrence, state: StickerState): HTMLDivElement {
  const color = STATE_COLOR[state];
  const wrapper = document.createElement("div");
  wrapper.className = "jam-sticker";
  wrapper.style.opacity = state === "annulee" ? "0.55" : "1";

  const dotHtml =
    state === "live"
      ? `<span class="jam-sticker__dot-wrap"><span class="jam-sticker__pulse"></span><span class="jam-sticker__dot" style="background:${color}"></span></span>`
      : `<span class="jam-sticker__dot" style="background:${color}"></span>`;

  wrapper.innerHTML = `
    <div class="jam-sticker__pill" style="border-color:${color}">
      ${dotHtml}
      <div class="jam-sticker__text">
        <span class="jam-sticker__name">${bar.nom}</span>
        <span class="jam-sticker__sub" style="${state === "live" ? `color:${color}` : ""}">${subLabel(occurrence, state)}</span>
      </div>
    </div>
    <div class="jam-sticker__pointer" style="border-top-color:${color}"></div>
  `;

  return wrapper;
}

interface JamMapProps {
  bars: Bar[];
  occurrences: Occurrence[];
}

export default function JamMap({ bars, occurrences }: JamMapProps) {
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
      center: [4.835, 45.764],
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

    const markers: maplibregl.Marker[] = [];
    const now = new Date();

    for (const occurrence of occurrences) {
      const bar = bars.find((b) => b.id === occurrence.barId);
      if (!bar) continue;

      const state = getStickerState(occurrence, now);
      const el = createStickerElement(bar, occurrence, state);

      const popup = new maplibregl.Popup({ offset: 18, closeButton: false }).setHTML(
        `<div class="jam-popup">
          <div class="jam-popup__title">${bar.nom}</div>
          <div class="jam-popup__addr">${bar.adresse}</div>
          <div class="jam-popup__status" style="color:${STATE_COLOR[state]}">${STATE_LABEL[state]}</div>
        </div>`
      );

      const marker = new maplibregl.Marker({ element: el, anchor: "bottom" })
        .setLngLat([bar.lng, bar.lat])
        .setPopup(popup)
        .addTo(map);

      markers.push(marker);
    }

    return () => {
      markers.forEach((m) => m.remove());
    };
  }, [bars, occurrences]);

  return <div ref={containerRef} className="jam-map" />;
}

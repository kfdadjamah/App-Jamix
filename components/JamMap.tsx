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
import { calculerDistanceKm, formaterDistance } from "@/lib/distance";

type Occurrence = Awaited<ReturnType<typeof recupererAnnoncesPubliees>>[number];

// Servi depuis public/ par scripts/copier-worker-maplibre.mjs (lancé avant dev/build).
maplibregl.setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");

const CENTRE_LYON: [number, number] = [4.835, 45.764];

// Style vectoriel sombre OpenFreeMap : gratuit, sans clé API (Carto exige désormais une clé).
const STYLE_FOND_CARTE = "https://tiles.openfreemap.org/styles/dark";

// Marge (px) en dessous de laquelle deux étiquettes sont considérées comme superposées.
const MARGE_CHEVAUCHEMENT = 4;

interface MarqueurBar {
  marker: maplibregl.Marker;
  el: HTMLDivElement;
  statut: StatutOccurrence;
  largeur: number;
  hauteur: number;
}

// Les étiquettes qui en recouvrent une plus prioritaire sont réduites à leur pastille.
function resoudreChevauchements(map: maplibregl.Map, marqueurs: MarqueurBar[]) {
  const tries = [...marqueurs].sort(
    (a, b) => PRIORITE_STATUT_OCCURRENCE[a.statut] - PRIORITE_STATUT_OCCURRENCE[b.statut]
  );
  const placees: { gauche: number; droite: number; haut: number; bas: number }[] = [];

  for (const m of tries) {
    const p = map.project(m.marker.getLngLat());
    const boite = {
      gauche: p.x - m.largeur / 2 - MARGE_CHEVAUCHEMENT,
      droite: p.x + m.largeur / 2 + MARGE_CHEVAUCHEMENT,
      haut: p.y - m.hauteur - MARGE_CHEVAUCHEMENT,
      bas: p.y + MARGE_CHEVAUCHEMENT,
    };
    const chevauche = placees.some(
      (b) =>
        boite.gauche < b.droite &&
        boite.droite > b.gauche &&
        boite.haut < b.bas &&
        boite.bas > b.haut
    );
    m.el.classList.toggle("jam-sticker--compact", chevauche);
    // Les pastilles réduites passent devant : petites, elles doivent rester visibles et cliquables.
    m.el.style.zIndex = chevauche ? "2" : "1";
    if (!chevauche) placees.push(boite);
  }
}

function creerElementMarqueur(
  nomBar: string,
  statut: StatutOccurrence,
  distanceKm: number | null
): HTMLDivElement {
  const couleur = COULEURS_STATUT_OCCURRENCE[statut];
  const wrapper = document.createElement("div");
  wrapper.className = "jam-sticker";
  wrapper.style.opacity = statut === "ANNULEE" ? "0.55" : "1";
  wrapper.style.cursor = "pointer";
  wrapper.title = nomBar;
  wrapper.setAttribute("aria-label", `${nomBar} — ${LIBELLES_STATUT_OCCURRENCE[statut]}`);

  wrapper.innerHTML = `
    <div class="jam-sticker__pill" style="border-color:${couleur}">
      <span class="jam-sticker__dot" style="background:${couleur}"></span>
      <div class="jam-sticker__text">
        <span class="jam-sticker__name"></span>
        <span class="jam-sticker__sub">${LIBELLES_STATUT_OCCURRENCE[statut]}</span>
        ${distanceKm !== null ? `<span class="jam-sticker__distance">${formaterDistance(distanceKm)}</span>` : ""}
      </div>
    </div>
    <div class="jam-sticker__pointer" style="border-top-color:${couleur}"></div>
  `;
  // textContent : le nom du bar est saisi par l'organisateur, jamais injecté en HTML.
  wrapper.querySelector(".jam-sticker__name")!.textContent = nomBar;

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
  positionMusicien: { latitude: number; longitude: number } | null;
  onSelectionBar: (barId: string) => void;
}

export default function JamMap({ occurrences, positionMusicien, onSelectionBar }: JamMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: STYLE_FOND_CARTE,
      center: CENTRE_LYON,
      zoom: 13,
      attributionControl: { compact: true },
    });

    map.on("style.load", () => {
      if (map.getLayer("background")) {
        map.setPaintProperty("background", "background-color", "#100904");
      }
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

    const marqueurs: MarqueurBar[] = [];

    for (const [barId, occurrencesDuBar] of occurrencesParBar) {
      const bar = occurrencesDuBar[0].annonce.bar;
      const statut = statutPrioritaire(occurrencesDuBar);
      const distanceKm = positionMusicien
        ? calculerDistanceKm(positionMusicien, {
            latitude: bar.latitude!,
            longitude: bar.longitude!,
          })
        : null;
      const el = creerElementMarqueur(bar.nom, statut, distanceKm);
      el.addEventListener("click", () => onSelectionBar(barId));

      const marker = new maplibregl.Marker({ element: el, anchor: "bottom" })
        .setLngLat([bar.longitude!, bar.latitude!])
        .addTo(map);

      marqueurs.push({
        marker,
        el,
        statut,
        largeur: el.offsetWidth,
        hauteur: el.offsetHeight,
      });
    }

    const recalculer = () => resoudreChevauchements(map, marqueurs);
    recalculer();
    map.on("zoom", recalculer);
    map.on("resize", recalculer);

    return () => {
      map.off("zoom", recalculer);
      map.off("resize", recalculer);
      marqueurs.forEach((m) => m.marker.remove());
    };
  }, [occurrences, positionMusicien, onSelectionBar]);

  return <div ref={containerRef} className="jam-map h-full w-full" />;
}

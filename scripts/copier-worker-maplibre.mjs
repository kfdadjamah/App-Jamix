// maplibre-gl v6 résout l'URL de son worker via import.meta.url, ce qui casse une fois
// empaqueté par Next : on sert le worker (et le module partagé qu'il importe) depuis public/.
import { copyFileSync, mkdirSync } from "node:fs";

const source = "node_modules/maplibre-gl/dist";
const cible = "public/maplibre";

mkdirSync(cible, { recursive: true });
for (const fichier of ["maplibre-gl-worker.mjs", "maplibre-gl-shared.mjs"]) {
  copyFileSync(`${source}/${fichier}`, `${cible}/${fichier}`);
}

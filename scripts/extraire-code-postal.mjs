// Reprise des bars antérieurs au champ codePostal : si l'adresse contient 5 chiffres
// (« 18 rue X, 69002 Lyon »), ils vont dans codePostal et sont retirés de l'adresse.
// Les bars sans code postal dans leur adresse restent vides (à compléter via le profil).
import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();
const MOTIF = /^(.*?)[\s,]*\b(\d{5})\b\s*(.*)$/;

const bars = await p.bar.findMany({ where: { codePostal: "" } });
let repris = 0;
for (const bar of bars) {
  const m = MOTIF.exec(bar.adresse.trim());
  if (!m) continue;
  const adresse = [m[1], m[3]].filter((partie) => partie !== "").join(", ");
  await p.bar.update({ where: { id: bar.id }, data: { adresse, codePostal: m[2] } });
  repris += 1;
}
console.log(`${repris} bar(s) repris sur ${bars.length} sans code postal.`);
await p.$disconnect();

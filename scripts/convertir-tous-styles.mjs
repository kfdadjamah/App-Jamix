// Phase 30 : les annonces qui cochent les 11 styles nommés passent à « Tous les styles ».
// « Autre » et sa précision sont retirés (exclusivité). Brouillons compris.
// Idempotent : une annonce déjà convertie ne contient plus les 11 styles.
import { PrismaClient } from "@prisma/client";

const STYLES_NOMMES = [
  "Jazz",
  "Blues",
  "Rock",
  "Pop",
  "Funk",
  "Soul",
  "R&B",
  "Latin",
  "Reggae",
  "Bossa nova",
  "Impro",
];

const prisma = new PrismaClient();
const { count } = await prisma.annonce.updateMany({
  where: { styles: { hasEvery: STYLES_NOMMES } },
  data: { styles: ["Tous les styles"], styleAutre: null },
});
console.log(`Annonces converties : ${count}`);
await prisma.$disconnect();

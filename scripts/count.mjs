import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
console.log("Organisateurs:", await p.organisateur.count());
console.log("Bars:", await p.bar.count());
console.log("Annonces:", await p.annonce.count());
console.log("Occurrences:", await p.occurrenceJam.count());
await p.$disconnect();
